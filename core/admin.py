from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from .models import Answer, Form, Question, Response, Upload


def _truncate(value, length):
    text = "" if value is None else str(value)
    return text if len(text) <= length else text[: length - 1] + "…"


class QuestionInline(admin.TabularInline):
    model = Question
    fields = ("position", "type", "label", "required")
    ordering = ("position",)
    extra = 0
    show_change_link = True


class AnswerInline(admin.TabularInline):
    model = Answer
    fields = ("question_position", "question_label", "question_type", "value")
    readonly_fields = fields
    ordering = ("question_position",)
    extra = 0
    can_delete = False
    show_change_link = True


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "owner",
        "question_count",
        "response_count",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("title", "owner__email", "owner__username")
    date_hierarchy = "created_at"
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "published_title",
        "published_questions",
        "published_at",
        "has_unpublished_changes",
    )
    list_select_related = ("owner",)
    inlines = (QuestionInline,)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(
                _question_count=Count("questions", distinct=True),
                _response_count=Count("responses", distinct=True),
            )
        )

    @admin.display(description="Questions", ordering="_question_count")
    def question_count(self, obj):
        return obj._question_count

    @admin.display(description="Responses", ordering="_response_count")
    def response_count(self, obj):
        return obj._response_count


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("label_short", "type", "form", "required", "position", "id")
    list_filter = ("type", "required", "form")
    search_fields = ("label", "form__title")
    list_select_related = ("form",)
    ordering = ("form", "position")
    readonly_fields = ("id",)

    @admin.display(description="Label", ordering="label")
    def label_short(self, obj):
        return _truncate(obj.label, 60)


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "form",
        "status",
        "cookie_id",
        "started_at",
        "completed_at",
        "answer_count",
    )
    list_filter = ("status", "form", "started_at")
    search_fields = ("cookie_id", "form__title")
    date_hierarchy = "started_at"
    list_select_related = ("form",)
    readonly_fields = ("id", "started_at", "questions_snapshot")
    inlines = (AnswerInline,)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(_answer_count=Count("answers"))
        )

    @admin.display(description="Answers", ordering="_answer_count")
    def answer_count(self, obj):
        return obj._answer_count


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = (
        "question_label_short",
        "question_type",
        "question_position",
        "response",
        "value_preview",
    )
    list_filter = ("question_type",)
    search_fields = (
        "question_label",
        "response__cookie_id",
        "response__form__title",
    )
    list_select_related = ("response", "response__form", "question")
    ordering = ("response", "question_position")
    readonly_fields = (
        "id",
        "question_label",
        "question_type",
        "question_position",
        "question_config",
    )

    @admin.display(description="Question", ordering="question_label")
    def question_label_short(self, obj):
        return _truncate(obj.question_label, 60)

    @admin.display(description="Value")
    def value_preview(self, obj):
        return _truncate(obj.value, 80)


@admin.register(Upload)
class UploadAdmin(admin.ModelAdmin):
    list_display = (
        "original_name",
        "file_link",
        "mime_type",
        "size",
        "response",
        "created_at",
    )
    list_filter = ("mime_type", "created_at")
    search_fields = ("original_name", "response__cookie_id", "response__form__title")
    list_select_related = ("response", "response__form")
    readonly_fields = ("id", "created_at", "file_link")
    ordering = ("-created_at",)

    @admin.display(description="File")
    def file_link(self, obj):
        if not obj.file:
            return "-"
        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer">Open</a>',
            obj.file.url,
        )
