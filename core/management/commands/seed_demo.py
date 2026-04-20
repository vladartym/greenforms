"""Wipe a user's forms and seed demo data using the current question schema.

Usage:
    python manage.py seed_demo --email hello@vladartym.com
"""
import random
from datetime import timedelta
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import Answer, Form, Question, Response, Upload


FIXTURE_PDF_PATH = Path(__file__).parent / "fixtures" / "chicken.pdf"


User = get_user_model()


FORMS = [
    {
        "title": "Customer Feedback",
        "status": Form.Status.PUBLISHED,
        "questions": [
            ("short_text", "What's your name?", True, {}),
            ("email", "Your email address", True, {}),
            (
                "multiple_choice",
                "How did you hear about us?",
                False,
                {"choices": ["Twitter", "Friend", "Google", "Other"], "allow_multiple": False},
            ),
            ("long_text", "What could we do better?", False, {}),
        ],
    },
    {
        "title": "Product Launch Waitlist",
        "status": Form.Status.PUBLISHED,
        "questions": [
            ("email", "Email", True, {}),
            ("short_text", "Company", False, {}),
            (
                "multiple_choice",
                "Team size",
                True,
                {"choices": ["1-10", "11-50", "51-200", "200+"], "allow_multiple": False},
            ),
        ],
    },
    {
        "title": "Event RSVP: Spring Mixer",
        "status": Form.Status.PUBLISHED,
        "questions": [
            ("short_text", "Full name", True, {}),
            ("email", "Email for confirmation", True, {}),
            (
                "multiple_choice",
                "Will you attend?",
                True,
                {"choices": ["Yes", "No", "Maybe"], "allow_multiple": False},
            ),
            ("long_text", "Dietary restrictions?", False, {}),
        ],
    },
    {
        "title": "Post-demo survey",
        "status": Form.Status.DRAFT,
        "questions": [
            (
                "multiple_choice",
                "How would you rate the demo?",
                True,
                {"choices": ["1", "2", "3", "4", "5"], "allow_multiple": False},
            ),
            ("long_text", "Anything unclear?", False, {}),
        ],
    },
    {
        "title": "All question types (demo)",
        "status": Form.Status.PUBLISHED,
        "questions": [
            ("short_text", "Your name", True, {}),
            ("long_text", "Tell us about yourself", False, {}),
            ("email", "Email address", True, {}),
            (
                "multiple_choice",
                "Favourite colour?",
                False,
                {"choices": ["Red", "Green", "Blue"], "allow_multiple": False},
            ),
            (
                "multiple_choice",
                "Pick the frameworks you use",
                False,
                {"choices": ["React", "Vue", "Svelte", "Angular"], "allow_multiple": True},
            ),
            (
                "dropdown",
                "Which country?",
                False,
                {"choices": ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia"]},
            ),
            ("number", "How many years of experience?", False, {"integer": True}),
            ("phone_number", "Phone number", False, {}),
            ("date", "Preferred start date", False, {}),
            ("time", "Preferred meeting time", False, {}),
            (
                "linear_scale",
                "How likely are you to recommend us?",
                False,
                {"min": 0, "max": 10, "min_label": "Not likely", "max_label": "Very likely"},
            ),
            ("rating", "Rate your experience", False, {}),
            (
                "ranking",
                "Rank these features",
                False,
                {"choices": ["Speed", "Reliability", "Price", "Support"]},
            ),
            ("file_upload", "Attach your resume", False, {}),
        ],
    },
]


SAMPLE_NAMES = [
    "Ava Chen", "Marco Silva", "Priya Patel", "Liam O'Brien",
    "Sofia Rossi", "Noah Kim", "Zara Ahmed", "Elena Petrov",
    "Diego Morales", "Yuki Tanaka",
]
SAMPLE_EMAILS = [
    n.lower().replace(" ", ".").replace("'", "") + "@example.com"
    for n in SAMPLE_NAMES
]
SAMPLE_COMPANIES = ["Acme", "Globex", "Initech", "Hooli", "Umbrella", "Soylent"]
SAMPLE_FEEDBACK = [
    "Loved it overall, pricing page could be clearer.",
    "Faster onboarding would be great.",
    "Everything worked as expected, thanks!",
    "More integrations please.",
    "The mobile experience felt a bit cramped.",
]


def serialize_questions(form: Form) -> list[dict]:
    return [
        {
            "id": str(q.id),
            "type": q.type,
            "label": q.label,
            "required": q.required,
            "position": q.position,
            "config": q.config or {},
        }
        for q in form.questions.order_by("position")
    ]


def answer_for(question: Question, i: int):
    t = question.type
    cfg = question.config or {}
    if t == "short_text":
        label = question.label.lower()
        if "name" in label:
            return SAMPLE_NAMES[i % len(SAMPLE_NAMES)]
        if "company" in label:
            return random.choice(SAMPLE_COMPANIES)
        return "Sample answer"
    if t == "email":
        return SAMPLE_EMAILS[i % len(SAMPLE_EMAILS)]
    if t == "long_text":
        return random.choice(SAMPLE_FEEDBACK)
    if t == "multiple_choice":
        choices = cfg.get("choices") or ["Yes"]
        if cfg.get("allow_multiple"):
            k = random.randint(1, len(choices))
            return random.sample(choices, k=k)
        return random.choice(choices)
    if t == "dropdown":
        return random.choice(cfg.get("choices") or ["Option"])
    if t == "number":
        return random.randint(0, 30)
    if t == "phone_number":
        return "(415) 555-0%03d" % random.randint(100, 999)
    if t == "date":
        offset = random.randint(-30, 30)
        return (timezone.now() + timedelta(days=offset)).date().isoformat()
    if t == "time":
        return "%02d:%02d" % (random.randint(9, 17), random.choice([0, 15, 30, 45]))
    if t == "linear_scale":
        lo = int(cfg.get("min", 1))
        hi = int(cfg.get("max", 5))
        return random.randint(lo, hi)
    if t == "rating":
        return random.randint(1, 5)
    if t == "ranking":
        choices = list(cfg.get("choices") or [])
        random.shuffle(choices)
        return choices
    if t == "file_upload":
        return None
    return ""


def create_demo_upload(response: Response) -> dict:
    upload = Upload(
        response=response,
        original_name="chicken.pdf",
        size=FIXTURE_PDF_PATH.stat().st_size,
        mime_type="application/pdf",
    )
    with FIXTURE_PDF_PATH.open("rb") as fh:
        upload.file.save("chicken.pdf", File(fh), save=True)
    return {
        "filename": upload.original_name,
        "size": upload.size,
        "url": upload.file.url,
        "mime_type": upload.mime_type,
    }


class Command(BaseCommand):
    help = "Wipe all forms for the given user and seed fresh demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            required=True,
            help="Email of the user to seed data for.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise CommandError(f"No user found with email {email!r}.") from exc

        deleted, _ = Form.objects.filter(owner=user).delete()
        self.stdout.write(f"Deleted {deleted} existing rows for {email}.")

        created_forms = []
        for fdata in FORMS:
            form = Form.objects.create(
                owner=user, title=fdata["title"], status=fdata["status"]
            )
            for pos, (qtype, label, required, config) in enumerate(fdata["questions"]):
                Question.objects.create(
                    form=form,
                    type=qtype,
                    label=label,
                    required=required,
                    position=pos,
                    config=config,
                )

            if fdata["status"] == Form.Status.PUBLISHED:
                form.published_title = form.title
                form.published_questions = serialize_questions(form)
                form.published_at = timezone.now()
                form.has_unpublished_changes = False
                form.save(
                    update_fields=[
                        "published_title",
                        "published_questions",
                        "published_at",
                        "has_unpublished_changes",
                    ]
                )

            created_forms.append(form)

        total_responses = 0
        for form in created_forms:
            if form.status != Form.Status.PUBLISHED:
                continue
            n = random.randint(6, 14)
            questions = list(form.questions.all())
            for i in range(n):
                completed = random.random() > 0.2
                started = timezone.now() - timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                )
                resp = Response.objects.create(
                    form=form,
                    status=(
                        Response.Status.COMPLETED if completed else Response.Status.DRAFT
                    ),
                    cookie_id=f"mock-{form.id.hex[:8]}-{i}",
                    questions_snapshot=form.published_questions,
                )
                Response.objects.filter(pk=resp.pk).update(started_at=started)
                if completed:
                    resp.completed_at = started + timedelta(
                        minutes=random.randint(1, 8)
                    )
                    resp.save(update_fields=["completed_at"])

                qs_to_answer = (
                    questions
                    if completed
                    else random.sample(questions, k=max(1, len(questions) // 2))
                )
                for q in qs_to_answer:
                    if q.type == "file_upload":
                        ans = create_demo_upload(resp)
                    else:
                        ans = answer_for(q, i)
                        if ans is None:
                            continue
                    Answer.objects.create(
                        response=resp,
                        question=q,
                        value=ans,
                        question_label=q.label,
                        question_type=q.type,
                        question_position=q.position,
                        question_config=q.config or {},
                    )
                total_responses += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(created_forms)} forms and {total_responses} responses for {email}."
            )
        )
        for f in created_forms:
            self.stdout.write(
                f"  - {f.title} ({f.status}): "
                f"{f.questions.count()}q, {f.responses.count()} responses"
            )
