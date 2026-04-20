import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver


class Form(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="forms",
    )
    title = models.CharField(max_length=200)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT
    )
    published_title = models.CharField(max_length=200, blank=True, default="")
    published_questions = models.JSONField(default=list, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    has_unpublished_changes = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    class Type(models.TextChoices):
        SHORT_TEXT = "short_text", "Short text"
        LONG_TEXT = "long_text", "Long text"
        MULTIPLE_CHOICE = "multiple_choice", "Multiple choice"
        EMAIL = "email", "Email"
        DROPDOWN = "dropdown", "Dropdown"
        NUMBER = "number", "Number"
        PHONE_NUMBER = "phone_number", "Phone number"
        FILE_UPLOAD = "file_upload", "File upload"
        DATE = "date", "Date"
        TIME = "time", "Time"
        LINEAR_SCALE = "linear_scale", "Linear scale"
        RATING = "rating", "Rating"
        RANKING = "ranking", "Ranking"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        Form, on_delete=models.CASCADE, related_name="questions"
    )
    type = models.CharField(max_length=32, choices=Type.choices)
    label = models.CharField(max_length=500)
    required = models.BooleanField(default=False)
    position = models.PositiveIntegerField()
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return self.label


class Response(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        Form, on_delete=models.CASCADE, related_name="responses"
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT
    )
    cookie_id = models.CharField(max_length=64, db_index=True)
    questions_snapshot = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


def _upload_path(instance, filename):
    return f"uploads/{instance.id}/{filename}"


class Upload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(
        Response,
        on_delete=models.CASCADE,
        related_name="uploads",
        null=True,
        blank=True,
    )
    file = models.FileField(upload_to=_upload_path)
    original_name = models.CharField(max_length=255)
    size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


@receiver(post_delete, sender=Upload)
def _delete_upload_file(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(
        Response, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.SET_NULL,
        related_name="answers",
        null=True,
        blank=True,
    )
    value = models.JSONField(default=dict, blank=True)
    question_label = models.CharField(max_length=500, blank=True)
    question_type = models.CharField(max_length=32, blank=True)
    question_position = models.PositiveIntegerField(default=0)
    question_config = models.JSONField(default=dict, blank=True)
