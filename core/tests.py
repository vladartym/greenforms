import json
import uuid

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.utils import timezone

from .models import Answer, Form, Question, Response as FormResponse


def _auth_client(user: User) -> Client:
    client = Client()
    client.force_login(user)
    return client


class QuestionLogicModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="u@example.com", email="u@example.com", password="pw"
        )
        self.form = Form.objects.create(owner=self.user, title="Test")

    def test_logic_round_trips(self):
        target = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="T", position=1,
        )
        source = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="S", position=0,
            logic={
                "operator": "equals",
                "value": "yes",
                "target_question_id": str(target.id),
            },
        )
        source.refresh_from_db()
        self.assertEqual(source.logic["operator"], "equals")
        self.assertEqual(source.logic["value"], "yes")
        self.assertEqual(source.logic["target_question_id"], str(target.id))

    def test_logic_defaults_to_none(self):
        q = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="L", position=0,
        )
        q.refresh_from_db()
        self.assertIsNone(q.logic)


class PublishLogicValidationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="v@example.com", email="v@example.com", password="pw"
        )
        self.client = _auth_client(self.user)

    def _put_form(self, form_id: str, questions: list[dict], title: str = "F"):
        return self.client.put(
            f"/api/forms/{form_id}",
            data=json.dumps({"title": title, "status": "draft", "questions": questions}),
            content_type="application/json",
        )

    def _publish(self, form_id: str):
        return self.client.post(f"/api/forms/{form_id}/publish")

    def _create_form(self, title: str = "F") -> str:
        resp = self.client.post(
            "/api/forms",
            data=json.dumps({"title": title, "status": "draft", "questions": []}),
            content_type="application/json",
        )
        return resp.json()["id"]

    def _create_form_with_two_questions(self, q1_type: str = "short_text", q1_config: dict = None):
        """Create a form with two questions and return (form_id, q1_id, q2_id)."""
        form_id = self._create_form()
        self._put_form(form_id, [
            {
                "type": q1_type, "label": "Q1", "required": False,
                "position": 0, "config": q1_config or {},
            },
            {
                "type": "short_text", "label": "Q2", "required": False,
                "position": 1, "config": {},
            },
        ])
        form = Form.objects.get(id=form_id)
        questions = list(form.questions.order_by("position"))
        return form_id, str(questions[0].id), str(questions[1].id)

    def test_rejects_logic_on_unsupported_type(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions(q1_type="long_text")
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "long_text", "label": "Q1",
                "required": False, "position": 0, "config": {},
                "logic": {
                    "operator": "equals", "value": "x",
                    "target_question_id": q2_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.json()["errors"]["questions.0.logic"],
            "Logic is only supported on short text and multiple choice questions in MVP.",
        )

    def test_rejects_incomplete_logic(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions()
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "short_text", "label": "Q1",
                "required": False, "position": 0, "config": {},
                "logic": {
                    "operator": "equals", "value": "",
                    "target_question_id": q2_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.json()["errors"]["questions.0.logic"],
            "Complete the logic rule, or remove it.",
        )

    def test_rejects_missing_target(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions()
        unknown_id = str(uuid.uuid4())
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "short_text", "label": "Q1",
                "required": False, "position": 0, "config": {},
                "logic": {
                    "operator": "equals", "value": "yes",
                    "target_question_id": unknown_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.json()["errors"]["questions.0.logic"],
            "Target question not found.",
        )

    def test_rejects_backward_target(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions()
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "short_text", "label": "Q1",
                "required": False, "position": 0, "config": {},
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
                "logic": {
                    "operator": "equals", "value": "yes",
                    "target_question_id": q1_id,
                },
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.json()["errors"]["questions.1.logic"],
            "Logic target must be a later question.",
        )

    def test_rejects_choice_not_in_options(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions(
            q1_type="multiple_choice", q1_config={"choices": ["a", "b"]},
        )
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "multiple_choice", "label": "Q1",
                "required": False, "position": 0,
                "config": {"choices": ["a", "b"]},
                "logic": {
                    "operator": "equals", "value": "c",
                    "target_question_id": q2_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(
            resp.json()["errors"]["questions.0.logic"],
            "Logic value must be one of the question's choices.",
        )

    def test_accepts_valid_logic_and_snapshots_it(self):
        form_id, q1_id, q2_id = self._create_form_with_two_questions()
        self._put_form(form_id, [
            {
                "id": q1_id, "type": "short_text", "label": "Q1",
                "required": False, "position": 0, "config": {},
                "logic": {
                    "operator": "equals", "value": "yes",
                    "target_question_id": q2_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1, "config": {},
            },
        ])
        resp = self._publish(form_id)
        self.assertEqual(resp.status_code, 200, resp.content)

        form = Form.objects.get(id=form_id)
        published = form.published_questions
        logic_map = {q["id"]: q.get("logic") for q in published}
        self.assertIsNotNone(logic_map[q1_id])
        self.assertEqual(logic_map[q1_id]["operator"], "equals")
        self.assertEqual(logic_map[q1_id]["value"], "yes")
        self.assertEqual(logic_map[q1_id]["target_question_id"], q2_id)
        self.assertIsNone(logic_map[q2_id])


class AnswerLogicSnapshotTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="a@example.com", email="a@example.com", password="pw"
        )
        self.form = Form.objects.create(owner=self.user, title="T", status=Form.Status.PUBLISHED)
        self.target = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="T", position=1,
        )
        self.source = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="S", position=0,
            logic={
                "operator": "equals",
                "value": "go",
                "target_question_id": str(self.target.id),
            },
        )
        self.form.published_questions = [
            {
                "id": str(self.source.id), "type": "short_text", "label": "S",
                "required": False, "position": 0, "config": {},
                "logic": self.source.logic,
            },
            {
                "id": str(self.target.id), "type": "short_text", "label": "T",
                "required": False, "position": 1, "config": {},
                "logic": None,
            },
        ]
        self.form.save()

    def test_answer_snapshots_question_logic(self):
        client = Client()
        start = client.post(
            "/api/responses",
            data=json.dumps({"form_id": str(self.form.id)}),
            content_type="application/json",
        )
        response_id = start.json()["response_id"]
        resp = client.put(
            f"/api/responses/{response_id}/answers/{self.source.id}",
            data=json.dumps({"value": "go"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        answer = Answer.objects.get(response_id=response_id, question=self.source)
        self.assertIsNotNone(answer.question_logic)
        self.assertEqual(answer.question_logic["operator"], "equals")
        self.assertEqual(answer.question_logic["value"], "go")


class QuestionHiddenTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="h@example.com", email="h@example.com", password="pw"
        )
        self.client = _auth_client(self.user)

    def _create_form(self, title: str = "F") -> str:
        resp = self.client.post(
            "/api/forms",
            data=json.dumps({"title": title, "status": "draft", "questions": []}),
            content_type="application/json",
        )
        return resp.json()["id"]

    def _put_form(self, form_id: str, questions: list[dict], title: str = "F"):
        return self.client.put(
            f"/api/forms/{form_id}",
            data=json.dumps({"title": title, "status": "draft", "questions": questions}),
            content_type="application/json",
        )

    def test_hidden_defaults_to_false_on_orm(self):
        form = Form.objects.create(owner=self.user, title="T")
        q = Question.objects.create(
            form=form, type=Question.Type.SHORT_TEXT,
            label="L", position=0,
        )
        q.refresh_from_db()
        self.assertFalse(q.hidden)

    def test_hidden_round_trips_via_orm(self):
        form = Form.objects.create(owner=self.user, title="T")
        q = Question.objects.create(
            form=form, type=Question.Type.SHORT_TEXT,
            label="L", position=0, hidden=True,
        )
        q.refresh_from_db()
        self.assertTrue(q.hidden)

    def test_hidden_round_trips_via_api(self):
        form_id = self._create_form()
        self._put_form(form_id, [
            {
                "type": "short_text", "label": "Q1", "required": False,
                "position": 0, "config": {}, "hidden": True,
            },
            {
                "type": "short_text", "label": "Q2", "required": False,
                "position": 1, "config": {}, "hidden": False,
            },
        ])
        resp = self.client.get(f"/api/forms/{form_id}")
        self.assertEqual(resp.status_code, 200, resp.content)
        questions = resp.json()["questions"]
        self.assertTrue(questions[0]["hidden"])
        self.assertFalse(questions[1]["hidden"])

    def test_hidden_captured_in_publish_snapshot_and_response_start(self):
        form_id = self._create_form()
        self._put_form(form_id, [
            {
                "type": "short_text", "label": "Q1", "required": False,
                "position": 0, "config": {}, "hidden": False,
            },
            {
                "type": "short_text", "label": "Q2", "required": False,
                "position": 1, "config": {}, "hidden": True,
            },
        ])
        publish = self.client.post(f"/api/forms/{form_id}/publish")
        self.assertEqual(publish.status_code, 200, publish.content)

        form = Form.objects.get(id=form_id)
        published = sorted(form.published_questions, key=lambda q: q["position"])
        self.assertFalse(published[0]["hidden"])
        self.assertTrue(published[1]["hidden"])

        anon = Client()
        start = anon.post(
            "/api/responses",
            data=json.dumps({"form_id": form_id}),
            content_type="application/json",
        )
        self.assertEqual(start.status_code, 200, start.content)
        response_id = start.json()["response_id"]
        response = FormResponse.objects.get(id=response_id)
        snapshot = sorted(response.questions_snapshot, key=lambda q: q["position"])
        self.assertFalse(snapshot[0]["hidden"])
        self.assertTrue(snapshot[1]["hidden"])

    def test_answer_snapshots_question_hidden(self):
        form = Form.objects.create(
            owner=self.user, title="T", status=Form.Status.PUBLISHED
        )
        q = Question.objects.create(
            form=form, type=Question.Type.SHORT_TEXT,
            label="L", position=0, hidden=True,
        )
        form.published_questions = [
            {
                "id": str(q.id), "type": "short_text", "label": "L",
                "required": False, "position": 0, "config": {},
                "logic": None, "hidden": True,
            },
        ]
        form.save()

        anon = Client()
        start = anon.post(
            "/api/responses",
            data=json.dumps({"form_id": str(form.id)}),
            content_type="application/json",
        )
        response_id = start.json()["response_id"]
        put = anon.put(
            f"/api/responses/{response_id}/answers/{q.id}",
            data=json.dumps({"value": "hi"}),
            content_type="application/json",
        )
        self.assertEqual(put.status_code, 200, put.content)
        answer = Answer.objects.get(response_id=response_id, question=q)
        self.assertTrue(answer.question_hidden)

    def test_discard_changes_preserves_logic_and_hidden(self):
        form_id = self._create_form()
        put = self._put_form(form_id, [
            {
                "type": "multiple_choice", "label": "Q1",
                "required": False, "position": 0,
                "config": {"choices": ["Yes", "No"]},
                "hidden": False,
            },
            {
                "type": "short_text", "label": "Q2",
                "required": False, "position": 1,
                "config": {}, "hidden": True,
            },
            {
                "type": "short_text", "label": "Q3",
                "required": False, "position": 2,
                "config": {},
            },
        ])
        self.assertEqual(put.status_code, 200, put.content)
        form = Form.objects.get(id=form_id)
        questions = list(form.questions.order_by("position"))
        q1_id, q2_id, q3_id = (str(q.id) for q in questions)

        self._put_form(form_id, [
            {
                "id": q1_id, "type": "multiple_choice", "label": "Q1",
                "required": False, "position": 0,
                "config": {"choices": ["Yes", "No"]},
                "hidden": False,
                "logic": {
                    "operator": "equals", "value": "Yes",
                    "target_question_id": q3_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1,
                "config": {}, "hidden": True,
            },
            {
                "id": q3_id, "type": "short_text", "label": "Q3",
                "required": False, "position": 2,
                "config": {},
            },
        ])

        publish = self.client.post(f"/api/forms/{form_id}/publish")
        self.assertEqual(publish.status_code, 200, publish.content)

        # Snapshot captured at publish time, used as the source of truth for discard.
        form.refresh_from_db()
        published_before = form.published_questions

        # Edit the draft (change Q1 label).
        edit = self._put_form(form_id, [
            {
                "id": q1_id, "type": "multiple_choice", "label": "Q1 edited",
                "required": False, "position": 0,
                "config": {"choices": ["Yes", "No"]},
                "hidden": False,
                "logic": {
                    "operator": "equals", "value": "Yes",
                    "target_question_id": q3_id,
                },
            },
            {
                "id": q2_id, "type": "short_text", "label": "Q2",
                "required": False, "position": 1,
                "config": {}, "hidden": True,
            },
            {
                "id": q3_id, "type": "short_text", "label": "Q3",
                "required": False, "position": 2,
                "config": {},
            },
        ])
        self.assertEqual(edit.status_code, 200, edit.content)

        discard = self.client.post(f"/api/forms/{form_id}/discard")
        self.assertEqual(discard.status_code, 200, discard.content)

        resp = self.client.get(f"/api/forms/{form_id}")
        self.assertEqual(resp.status_code, 200, resp.content)
        questions = sorted(resp.json()["questions"], key=lambda q: q["position"])

        self.assertEqual(questions[0]["label"], "Q1")
        self.assertIsNotNone(questions[0]["logic"])
        self.assertEqual(questions[0]["logic"]["target_question_id"], q3_id)
        self.assertEqual(questions[0]["logic"]["operator"], "equals")
        self.assertEqual(questions[0]["logic"]["value"], "Yes")
        self.assertTrue(questions[1]["hidden"])

        form.refresh_from_db()
        self.assertEqual(form.published_questions, published_before)

    def test_duplicate_form_copies_hidden(self):
        form_id = self._create_form()
        self._put_form(form_id, [
            {
                "type": "short_text", "label": "Q1", "required": False,
                "position": 0, "config": {}, "hidden": True,
            },
            {
                "type": "short_text", "label": "Q2", "required": False,
                "position": 1, "config": {}, "hidden": False,
            },
        ])
        dup = self.client.post(f"/api/forms/{form_id}/duplicate")
        self.assertEqual(dup.status_code, 200, dup.content)
        copy_id = dup.json()["id"]
        resp = self.client.get(f"/api/forms/{copy_id}")
        self.assertEqual(resp.status_code, 200, resp.content)
        questions = resp.json()["questions"]
        self.assertTrue(questions[0]["hidden"])
        self.assertFalse(questions[1]["hidden"])


class SubmitWithPathTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="s@example.com", email="s@example.com", password="pw"
        )
        self.form = Form.objects.create(
            owner=self.user, title="F", status=Form.Status.PUBLISHED
        )
        self.q1 = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="Q1", required=True, position=0,
        )
        self.q2 = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="Q2", required=True, position=1,
        )
        self.q3 = Question.objects.create(
            form=self.form, type=Question.Type.SHORT_TEXT,
            label="Q3", required=True, position=2,
        )
        self.form.published_questions = [
            {
                "id": str(q.id), "type": "short_text", "label": q.label,
                "required": True, "position": q.position, "config": {}, "logic": None,
            }
            for q in (self.q1, self.q2, self.q3)
        ]
        self.form.save()

    def _start_response(self, client: Client) -> str:
        resp = client.post(
            "/api/responses",
            data=json.dumps({"form_id": str(self.form.id)}),
            content_type="application/json",
        )
        return resp.json()["response_id"]

    def test_submit_with_path_drops_off_path_answers_and_skips_required(self):
        client = Client()
        response_id = self._start_response(client)

        # Respondent answered q1 and q2 (e.g. explored a branch), then went back
        # and re-routed so the final path is [q1, q3]. q3 is never answered,
        # but q2 is dropped from the response and q2's required is bypassed.
        for q, value in ((self.q1, "a"), (self.q2, "b"), (self.q3, "c")):
            r = client.put(
                f"/api/responses/{response_id}/answers/{q.id}",
                data=json.dumps({"value": value}),
                content_type="application/json",
            )
            self.assertEqual(r.status_code, 200, r.content)

        submit = client.post(
            f"/api/responses/{response_id}/submit",
            data=json.dumps({"path": [str(self.q1.id), str(self.q3.id)]}),
            content_type="application/json",
        )
        self.assertEqual(submit.status_code, 200, submit.content)

        resp = FormResponse.objects.get(id=response_id)
        self.assertEqual(resp.status, FormResponse.Status.COMPLETED)
        remaining_qids = {str(a.question_id) for a in resp.answers.all()}
        self.assertEqual(remaining_qids, {str(self.q1.id), str(self.q3.id)})

    def test_submit_with_path_bypasses_required_for_skipped_questions(self):
        client = Client()
        response_id = self._start_response(client)

        # Only q1 and q3 are answered; q2 is a required question that was skipped.
        for q, value in ((self.q1, "a"), (self.q3, "c")):
            client.put(
                f"/api/responses/{response_id}/answers/{q.id}",
                data=json.dumps({"value": value}),
                content_type="application/json",
            )

        submit = client.post(
            f"/api/responses/{response_id}/submit",
            data=json.dumps({"path": [str(self.q1.id), str(self.q3.id)]}),
            content_type="application/json",
        )
        self.assertEqual(submit.status_code, 200, submit.content)

    def test_submit_without_path_validates_all_required(self):
        client = Client()
        response_id = self._start_response(client)
        client.put(
            f"/api/responses/{response_id}/answers/{self.q1.id}",
            data=json.dumps({"value": "a"}),
            content_type="application/json",
        )
        submit = client.post(
            f"/api/responses/{response_id}/submit",
            data=json.dumps({}),
            content_type="application/json",
        )
        self.assertEqual(submit.status_code, 400)
        errors = submit.json()["errors"]
        self.assertIn(str(self.q2.id), errors)
        self.assertIn(str(self.q3.id), errors)

    def test_submit_without_path_keeps_all_answers(self):
        client = Client()
        response_id = self._start_response(client)
        for q, value in ((self.q1, "a"), (self.q2, "b"), (self.q3, "c")):
            client.put(
                f"/api/responses/{response_id}/answers/{q.id}",
                data=json.dumps({"value": value}),
                content_type="application/json",
            )
        submit = client.post(
            f"/api/responses/{response_id}/submit",
            data=json.dumps({}),
            content_type="application/json",
        )
        self.assertEqual(submit.status_code, 200, submit.content)
        resp = FormResponse.objects.get(id=response_id)
        qids = {str(a.question_id) for a in resp.answers.all()}
        self.assertEqual(qids, {str(self.q1.id), str(self.q2.id), str(self.q3.id)})
