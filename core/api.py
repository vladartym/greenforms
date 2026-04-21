import uuid
from types import SimpleNamespace
from typing import Any, Literal, Optional

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.timesince import timesince
from ninja import NinjaAPI, Router, Schema
from ninja.security import django_auth
from pydantic import ConfigDict

from ninja import File, UploadedFile

from .models import Answer, Form, Question, Response as FormResponse, Upload
from .validation import is_empty, validate_answer

UPLOAD_MAX_BYTES = 10 * 1024 * 1024

api = NinjaAPI()


@api.get("/ping")
def ping(request):
    return {"status": "ok", "message": "pong from django-ninja"}


class MeOut(Schema):
    id: int
    email: str


@api.get("/me", response={200: MeOut, 401: dict})
def me(request):
    if not request.user.is_authenticated:
        return 401, {"detail": "Not authenticated."}
    return 200, {"id": request.user.id, "email": request.user.email}


class LoginIn(Schema):
    model_config = ConfigDict(extra="forbid")
    email: str
    password: str


class SignupIn(Schema):
    model_config = ConfigDict(extra="forbid")
    email: str
    password: str


class UserOut(Schema):
    id: int
    email: str


class ErrorOut(Schema):
    errors: dict[str, str]


auth_router = Router()


@auth_router.post("/login", response={200: UserOut, 400: ErrorOut})
def api_login(request, payload: LoginIn):
    email = payload.email.strip().lower()
    errors: dict[str, str] = {}
    if not email:
        errors["email"] = "Enter your email."
    if not payload.password:
        errors["password"] = "Enter your password."
    if errors:
        return 400, {"errors": errors}

    user = authenticate(request, username=email, password=payload.password)
    if user is None:
        return 400, {"errors": {"email": "Email or password is incorrect."}}

    login(request, user)
    return 200, {"id": user.id, "email": user.email}


@auth_router.post("/signup", response={200: UserOut, 400: ErrorOut})
def api_signup(request, payload: SignupIn):
    email = payload.email.strip().lower()
    errors: dict[str, str] = {}

    if not email or "@" not in email:
        errors["email"] = "Enter a valid email."
    elif User.objects.filter(username=email).exists():
        errors["email"] = "An account with this email already exists."

    if not payload.password:
        errors["password"] = "Choose a password."
    else:
        try:
            validate_password(payload.password)
        except ValidationError as exc:
            errors["password"] = " ".join(exc.messages)

    if errors:
        return 400, {"errors": errors}

    user = User.objects.create_user(
        username=email, email=email, password=payload.password
    )
    login(request, user)
    return 200, {"id": user.id, "email": user.email}


@auth_router.post("/logout", auth=django_auth)
def api_logout(request):
    logout(request)
    return {"ok": True}


api.add_router("/auth", auth_router)


class LogicSchema(Schema):
    model_config = ConfigDict(extra="forbid")
    operator: Literal["equals", "not_equals"]
    value: Any
    target_question_id: str


class QuestionIn(Schema):
    model_config = ConfigDict(extra="forbid")
    id: str | None = None
    type: str
    label: str
    required: bool = False
    position: int
    config: dict = {}
    logic: Optional[LogicSchema] = None
    hidden: bool = False


class FormWriteIn(Schema):
    model_config = ConfigDict(extra="forbid")
    title: str = ""
    status: str = "draft"
    questions: list[QuestionIn] = []


class QuestionOut(Schema):
    id: str
    type: str
    label: str
    required: bool
    position: int
    config: dict
    logic: Optional[LogicSchema] = None
    hidden: bool = False


class FormOut(Schema):
    id: str
    title: str
    status: str
    has_unpublished_changes: bool = False
    published_at: str | None = None


class FormDetailOut(Schema):
    id: str
    title: str
    status: str
    has_unpublished_changes: bool
    published_at: str | None
    questions: list[QuestionOut]


class FormRowOut(Schema):
    id: str
    title: str
    status: str
    has_unpublished_changes: bool
    responses_completed: int
    responses_draft: int
    updated_at_label: str


class AnswerOut(Schema):
    question_id: str | None
    label: str
    type: str
    position: int
    value: Any


class ResponseRowOut(Schema):
    id: str
    completed_at_label: str
    answers: list[AnswerOut]


class FormResponsesOut(Schema):
    form: dict
    responses: list[ResponseRowOut]


class PublicFormOut(Schema):
    form: dict
    questions: list[QuestionOut]


class OkOut(Schema):
    ok: bool


forms_router = Router()


@forms_router.get("", response={200: list[FormRowOut]}, auth=django_auth)
def list_forms(request):
    qs = (
        request.user.forms.annotate(
            responses_completed=Count(
                "responses",
                filter=Q(responses__status=FormResponse.Status.COMPLETED),
            ),
            responses_draft=Count(
                "responses",
                filter=Q(responses__status=FormResponse.Status.DRAFT),
            ),
        )
        .order_by("-updated_at")
    )
    return 200, [
        {
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "has_unpublished_changes": f.has_unpublished_changes,
            "responses_completed": f.responses_completed,
            "responses_draft": f.responses_draft,
            "updated_at_label": f"{timesince(f.updated_at).split(',')[0]} ago",
        }
        for f in qs
    ]


def _structural_errors(payload: FormWriteIn) -> dict[str, str]:
    errors: dict[str, str] = {}
    if len(payload.title) > 200:
        errors["title"] = "Title must be 200 characters or fewer."
    if payload.status not in Form.Status.values:
        errors["status"] = "Invalid status."
    valid_types = set(Question.Type.values)
    for idx, q in enumerate(payload.questions):
        if q.type not in valid_types:
            errors[f"questions.{idx}.type"] = "Invalid question type."
    return errors


def _publish_errors(payload: FormWriteIn) -> dict[str, str]:
    errors: dict[str, str] = {}
    if not payload.title.strip():
        errors["title"] = "Enter a title."
    choice_list_types = {
        Question.Type.MULTIPLE_CHOICE,
        Question.Type.DROPDOWN,
        Question.Type.RANKING,
    }
    logic_supported_types = {
        Question.Type.SHORT_TEXT,
        Question.Type.MULTIPLE_CHOICE,
    }
    questions_by_id = {q.id: q for q in payload.questions if q.id}
    for idx, q in enumerate(payload.questions):
        prefix = f"questions.{idx}"
        cfg = q.config if isinstance(q.config, dict) else {}
        if not q.label.strip():
            errors[f"{prefix}.label"] = "Question label is required."

        if q.type in choice_list_types:
            choices = cfg.get("choices")
            cleaned = [c.strip() for c in choices] if isinstance(choices, list) else []
            if len([c for c in cleaned if c]) < 2:
                errors[f"{prefix}.choices"] = "Add at least 2 choices."

        if q.type == Question.Type.LINEAR_SCALE:
            lo, hi = cfg.get("min"), cfg.get("max")
            if not (isinstance(lo, int) and isinstance(hi, int) and hi > lo and hi - lo <= 10):
                errors[f"{prefix}.range"] = "Set a valid min and max (max > min, at most 11 steps)."

        if q.type == Question.Type.RATING:
            max_value = cfg.get("max", 5)
            if not (isinstance(max_value, int) and 3 <= max_value <= 10):
                errors[f"{prefix}.max"] = "Rating max must be between 3 and 10."

        if q.type in {Question.Type.NUMBER, Question.Type.DATE, Question.Type.TIME}:
            lo, hi = cfg.get("min"), cfg.get("max")
            if lo is not None and hi is not None and lo >= hi:
                errors[f"{prefix}.range"] = "Min must be less than max."

        if q.logic is not None:
            logic_key = f"{prefix}.logic"
            if q.type not in logic_supported_types:
                errors[logic_key] = (
                    "Logic is only supported on short text and multiple choice questions in MVP."
                )
                continue

            operator = q.logic.operator
            value = q.logic.value
            target_id = q.logic.target_question_id
            if (
                not operator
                or not target_id
                or value is None
                or (isinstance(value, str) and value == "")
            ):
                errors[logic_key] = "Complete the logic rule, or remove it."
                continue

            target = questions_by_id.get(target_id)
            if target is None:
                errors[logic_key] = "Target question not found."
                continue

            if target.position <= q.position:
                errors[logic_key] = "Logic target must be a later question."
                continue

            if q.type == Question.Type.MULTIPLE_CHOICE:
                choices = cfg.get("choices") if isinstance(cfg.get("choices"), list) else []
                if value not in choices:
                    errors[logic_key] = "Logic value must be one of the question's choices."
                    continue
    return errors


def _serialize_live_questions(form: Form) -> list[dict]:
    return [
        {
            "id": str(q.id),
            "type": q.type,
            "label": q.label,
            "required": q.required,
            "position": q.position,
            "config": q.config or {},
            "logic": q.logic,
            "hidden": q.hidden,
        }
        for q in form.questions.order_by("position")
    ]


def _form_payload_for_publish(form: Form) -> FormWriteIn:
    return FormWriteIn(
        title=form.title,
        status=Form.Status.PUBLISHED,
        questions=[
            QuestionIn(
                id=str(q.id),
                type=q.type,
                label=q.label,
                required=q.required,
                position=q.position,
                config=q.config or {},
                logic=q.logic,
                hidden=q.hidden,
            )
            for q in form.questions.order_by("position")
        ],
    )


def _form_out(form: Form) -> dict:
    return {
        "id": str(form.id),
        "title": form.title,
        "status": form.status,
        "has_unpublished_changes": form.has_unpublished_changes,
        "published_at": form.published_at.isoformat() if form.published_at else None,
    }


def _form_detail(form: Form) -> dict:
    return {
        **_form_out(form),
        "questions": [
            {
                "id": str(q.id),
                "type": q.type,
                "label": q.label,
                "required": q.required,
                "position": q.position,
                "config": q.config or {},
                "logic": q.logic,
                "hidden": q.hidden,
            }
            for q in form.questions.order_by("position")
        ],
    }


def _write_questions(form: Form, questions: list[QuestionIn]) -> None:
    existing = {str(q.id): q for q in form.questions.all()}
    incoming_ids: set[str] = set()

    for idx, q in enumerate(questions):
        config = q.config if isinstance(q.config, dict) else {}
        logic = q.logic.dict() if q.logic is not None else None
        label = q.label.strip()
        existing_question = existing.get(q.id) if q.id else None
        if existing_question is not None:
            existing_question.type = q.type
            existing_question.label = label
            existing_question.required = q.required
            existing_question.position = idx
            existing_question.config = config
            existing_question.logic = logic
            existing_question.hidden = q.hidden
            existing_question.save(
                update_fields=["type", "label", "required", "position", "config", "logic", "hidden"]
            )
            incoming_ids.add(str(existing_question.id))
        else:
            created = Question.objects.create(
                form=form,
                type=q.type,
                label=label,
                required=q.required,
                position=idx,
                config=config,
                logic=logic,
                hidden=q.hidden,
            )
            incoming_ids.add(str(created.id))

    stale_ids = [qid for qid in existing if qid not in incoming_ids]
    if stale_ids:
        form.questions.filter(id__in=stale_ids).delete()


@forms_router.post("", response={200: FormOut, 400: ErrorOut}, auth=django_auth)
def create_form(request, payload: FormWriteIn):
    errors = _structural_errors(payload)
    if errors:
        return 400, {"errors": errors}

    with transaction.atomic():
        form = Form.objects.create(
            owner=request.user,
            title=payload.title.strip(),
            status=Form.Status.DRAFT,
        )
        _write_questions(form, payload.questions)

    return 200, _form_out(form)


@forms_router.get("/{form_id}", response={200: FormDetailOut, 404: ErrorOut}, auth=django_auth)
def get_form(request, form_id: str):
    try:
        form = request.user.forms.prefetch_related("questions").get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}
    return 200, {
        "id": str(form.id),
        "title": form.title,
        "status": form.status,
        "has_unpublished_changes": form.has_unpublished_changes,
        "published_at": form.published_at.isoformat() if form.published_at else None,
        "questions": [
            {
                "id": str(q.id),
                "type": q.type,
                "label": q.label,
                "required": q.required,
                "position": q.position,
                "config": q.config,
                "logic": q.logic,
                "hidden": q.hidden,
            }
            for q in form.questions.order_by("position")
        ],
    }


@forms_router.put("/{form_id}", response={200: FormDetailOut, 400: ErrorOut, 404: ErrorOut}, auth=django_auth)
def update_form(request, form_id: str, payload: FormWriteIn):
    try:
        form = request.user.forms.get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}

    errors = _structural_errors(payload)
    if errors:
        return 400, {"errors": errors}

    with transaction.atomic():
        form.title = payload.title.strip()
        update_fields = ["title", "updated_at"]
        if form.status == Form.Status.PUBLISHED and not form.has_unpublished_changes:
            form.has_unpublished_changes = True
            update_fields.append("has_unpublished_changes")
        form.save(update_fields=update_fields)
        _write_questions(form, payload.questions)

    return 200, _form_detail(form)


@forms_router.post(
    "/{form_id}/publish",
    response={200: FormOut, 400: ErrorOut, 404: ErrorOut},
    auth=django_auth,
)
def publish_form(request, form_id: str):
    try:
        form = request.user.forms.prefetch_related("questions").get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}

    snapshot_payload = _form_payload_for_publish(form)
    errors = _structural_errors(snapshot_payload)
    errors.update(_publish_errors(snapshot_payload))
    if errors:
        return 400, {"errors": errors}

    with transaction.atomic():
        form.published_title = form.title
        form.published_questions = _serialize_live_questions(form)
        form.published_at = timezone.now()
        form.status = Form.Status.PUBLISHED
        form.has_unpublished_changes = False
        form.save(
            update_fields=[
                "published_title",
                "published_questions",
                "published_at",
                "status",
                "has_unpublished_changes",
                "updated_at",
            ]
        )

    return 200, _form_out(form)


@forms_router.post(
    "/{form_id}/discard",
    response={200: FormDetailOut, 400: ErrorOut, 404: ErrorOut},
    auth=django_auth,
)
def discard_form_changes(request, form_id: str):
    try:
        form = request.user.forms.get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}

    if form.status != Form.Status.PUBLISHED or not form.has_unpublished_changes:
        return 400, {"errors": {"form": "No changes to discard."}}

    with transaction.atomic():
        form.title = form.published_title
        form.has_unpublished_changes = False
        form.save(
            update_fields=["title", "has_unpublished_changes", "updated_at"]
        )
        form.questions.all().delete()
        for snap in form.published_questions:
            Question.objects.create(
                form=form,
                id=snap["id"],
                type=snap["type"],
                label=snap["label"],
                required=snap.get("required", False),
                position=snap["position"],
                config=snap.get("config") or {},
                logic=snap.get("logic"),
                hidden=snap.get("hidden", False),
            )

    return 200, {
        "id": str(form.id),
        "title": form.title,
        "status": form.status,
        "has_unpublished_changes": form.has_unpublished_changes,
        "published_at": form.published_at.isoformat() if form.published_at else None,
        "questions": [
            {
                "id": str(q.id),
                "type": q.type,
                "label": q.label,
                "required": q.required,
                "position": q.position,
                "config": q.config,
                "logic": q.logic,
                "hidden": q.hidden,
            }
            for q in form.questions.order_by("position")
        ],
    }


class RenameIn(Schema):
    model_config = ConfigDict(extra="forbid")
    title: str


@forms_router.patch(
    "/{form_id}/rename",
    response={200: FormOut, 400: ErrorOut, 404: ErrorOut},
    auth=django_auth,
)
def rename_form(request, form_id: str, payload: RenameIn):
    try:
        form = request.user.forms.get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}

    title = payload.title.strip()
    if not title:
        return 400, {"errors": {"title": "Enter a title."}}
    if len(title) > 200:
        return 400, {"errors": {"title": "Title must be 200 characters or fewer."}}

    form.title = title
    update_fields = ["title", "updated_at"]
    if form.status == Form.Status.PUBLISHED and not form.has_unpublished_changes:
        form.has_unpublished_changes = True
        update_fields.append("has_unpublished_changes")
    form.save(update_fields=update_fields)
    return 200, _form_out(form)


@forms_router.post(
    "/{form_id}/duplicate",
    response={200: FormOut, 404: ErrorOut},
    auth=django_auth,
)
def duplicate_form(request, form_id: str):
    try:
        form = request.user.forms.prefetch_related("questions").get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}

    with transaction.atomic():
        copy = Form.objects.create(
            owner=request.user,
            title=(form.title + " (copy)")[:200] if form.title else "(copy)",
            status=Form.Status.DRAFT,
        )
        Question.objects.bulk_create(
            [
                Question(
                    form=copy,
                    type=q.type,
                    label=q.label,
                    required=q.required,
                    position=q.position,
                    config=q.config,
                    logic=q.logic,
                    hidden=q.hidden,
                )
                for q in form.questions.order_by("position")
            ]
        )

    return 200, _form_out(copy)


@forms_router.delete(
    "/{form_id}", response={200: OkOut, 404: ErrorOut}, auth=django_auth
)
def delete_form(request, form_id: str):
    try:
        form = request.user.forms.get(id=form_id)
    except Form.DoesNotExist:
        return 404, {"errors": {"form": "Form not found."}}
    form.delete()
    return 200, {"ok": True}


@forms_router.get(
    "/{form_id}/responses",
    response={200: FormResponsesOut, 404: ErrorOut},
    auth=django_auth,
)
def get_form_responses(request, form_id: str):
    try:
        form = request.user.forms.get(id=form_id)
    except (Form.DoesNotExist, ValidationError, ValueError):
        return 404, {"errors": {"form": "Form not found."}}

    responses = (
        form.responses.filter(status=FormResponse.Status.COMPLETED)
        .prefetch_related("answers")
        .order_by("-completed_at")
    )

    def serialize_answers(answers):
        items = [
            {
                "question_id": str(a.question_id) if a.question_id else None,
                "label": a.question_label,
                "type": a.question_type,
                "position": a.question_position,
                "value": a.value,
            }
            for a in answers
        ]
        items.sort(key=lambda item: item["position"])
        return items

    return 200, {
        "form": {"id": str(form.id), "title": form.title},
        "responses": [
            {
                "id": str(r.id),
                "completed_at_label": (
                    f"{timesince(r.completed_at).split(',')[0]} ago"
                    if r.completed_at
                    else ""
                ),
                "answers": serialize_answers(r.answers.all()),
            }
            for r in responses
        ],
    }


api.add_router("/forms", forms_router)


public_router = Router()


@public_router.get(
    "/forms/{form_id}", response={200: PublicFormOut, 404: ErrorOut}
)
def get_public_form(request, form_id: str):
    try:
        form = Form.objects.get(id=form_id, status=Form.Status.PUBLISHED)
    except (Form.DoesNotExist, ValidationError, ValueError):
        return 404, {"errors": {"form": "Form not found."}}

    snapshot = sorted(form.published_questions or [], key=lambda q: q.get("position", 0))
    return 200, {
        "form": {"id": str(form.id), "title": form.published_title or form.title},
        "questions": [
            {
                "id": str(q["id"]),
                "type": q["type"],
                "label": q["label"],
                "required": q.get("required", False),
                "position": q["position"],
                "config": q.get("config") or {},
                "logic": q.get("logic"),
                "hidden": q.get("hidden", False),
            }
            for q in snapshot
        ],
    }


api.add_router("/public", public_router)


class ResponseStartIn(Schema):
    model_config = ConfigDict(extra="forbid")
    form_id: str


class ResponseStartOut(Schema):
    response_id: str


class AnswerIn(Schema):
    model_config = ConfigDict(extra="forbid")
    value: Any = None


responses_router = Router()


@responses_router.post(
    "", response={200: ResponseStartOut, 404: ErrorOut}
)
def start_response(request, payload: ResponseStartIn):
    try:
        form = Form.objects.get(
            id=payload.form_id, status=Form.Status.PUBLISHED
        )
    except (Form.DoesNotExist, ValidationError, ValueError):
        return 404, {"errors": {"form": "Form not found."}}

    snapshot = sorted(
        form.published_questions or [],
        key=lambda q: q.get("position", 0),
    )
    response = FormResponse.objects.create(
        form=form,
        cookie_id=uuid.uuid4().hex,
        questions_snapshot=snapshot,
    )
    return 200, {"response_id": str(response.id)}


@responses_router.put(
    "/{response_id}/answers/{question_id}",
    response={200: OkOut, 400: ErrorOut, 404: ErrorOut},
)
def save_answer(request, response_id: str, question_id: str, payload: AnswerIn):
    try:
        response = FormResponse.objects.get(id=response_id)
    except (FormResponse.DoesNotExist, ValidationError, ValueError):
        return 404, {"errors": {"response": "Response not found."}}
    if response.status == FormResponse.Status.COMPLETED:
        return 400, {"errors": {"response": "Response already submitted."}}

    try:
        question = Question.objects.get(id=question_id, form_id=response.form_id)
    except (Question.DoesNotExist, ValidationError, ValueError):
        return 400, {"errors": {"question": "Question does not belong to this form."}}

    errors = validate_answer(question, payload.value)
    if errors:
        return 400, {"errors": errors}

    Answer.objects.update_or_create(
        response=response,
        question=question,
        defaults={
            "value": payload.value,
            "question_label": question.label,
            "question_type": question.type,
            "question_position": question.position,
            "question_config": question.config or {},
            "question_logic": question.logic,
            "question_hidden": question.hidden,
        },
    )
    return 200, {"ok": True}


class SubmitIn(Schema):
    model_config = ConfigDict(extra="forbid")
    path: Optional[list[str]] = None


@responses_router.post(
    "/{response_id}/submit", response={200: OkOut, 400: ErrorOut, 404: ErrorOut}
)
def submit_response(request, response_id: str, payload: SubmitIn = None):
    path_ids: Optional[set[str]] = None
    if payload is not None and payload.path:
        path_ids = {str(pid) for pid in payload.path}

    try:
        with transaction.atomic():
            try:
                response = FormResponse.objects.select_for_update().get(id=response_id)
            except FormResponse.DoesNotExist:
                return 404, {"errors": {"response": "Response not found."}}
            if response.status == FormResponse.Status.COMPLETED:
                return 400, {"errors": {"response": "Response already submitted."}}

            if path_ids is not None:
                response.answers.exclude(question_id__in=path_ids).delete()

            snapshot = response.questions_snapshot or []
            answers_map = {
                str(a.question_id): a.value for a in response.answers.all()
            }

            errors: dict[str, str] = {}
            for snap in snapshot:
                qid = str(snap.get("id"))
                if path_ids is not None and qid not in path_ids:
                    continue
                value = answers_map.get(qid)
                if snap.get("required") and is_empty(value):
                    errors[qid] = "This question is required."
                    continue
                spec = SimpleNamespace(
                    type=snap.get("type"),
                    config=snap.get("config") or {},
                )
                field_errors = validate_answer(spec, value)
                if field_errors:
                    errors[qid] = field_errors["value"]

            if errors:
                return 400, {"errors": errors}

            response.status = FormResponse.Status.COMPLETED
            response.completed_at = timezone.now()
            response.save(update_fields=["status", "completed_at"])
    except (ValidationError, ValueError):
        return 404, {"errors": {"response": "Response not found."}}
    return 200, {"ok": True}


api.add_router("/responses", responses_router)


uploads_router = Router()


class UploadOut(Schema):
    filename: str
    size: int
    url: str
    mime_type: str


@uploads_router.post("", response={200: UploadOut, 400: ErrorOut, 404: ErrorOut})
def create_upload(
    request,
    response_id: str,
    question_id: str,
    file: UploadedFile = File(...),
):
    try:
        response = FormResponse.objects.get(id=response_id)
    except (FormResponse.DoesNotExist, ValidationError, ValueError):
        return 404, {"errors": {"response": "Response not found."}}
    if response.status == FormResponse.Status.COMPLETED:
        return 400, {"errors": {"response": "Response already submitted."}}

    try:
        question = Question.objects.get(
            id=question_id,
            form_id=response.form_id,
            type=Question.Type.FILE_UPLOAD,
        )
    except (Question.DoesNotExist, ValidationError, ValueError):
        return 400, {
            "errors": {"question": "Not a file-upload question on this form."}
        }

    if file.size > UPLOAD_MAX_BYTES:
        return 400, {
            "errors": {
                "file": f"File must be under {UPLOAD_MAX_BYTES // (1024 * 1024)} MB."
            }
        }

    upload = Upload.objects.create(
        response=response,
        file=file,
        original_name=file.name,
        size=file.size,
        mime_type=file.content_type or "",
    )
    return 200, {
        "filename": upload.original_name,
        "size": upload.size,
        "url": upload.file.url,
        "mime_type": upload.mime_type,
    }


api.add_router("/uploads", uploads_router)
