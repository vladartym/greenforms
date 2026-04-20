import re
from datetime import date as _date
from typing import Any

from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

from .models import Question

SHORT_TEXT_MAX_LENGTH = 255
LONG_TEXT_MAX_LENGTH = 5000
FILE_UPLOAD_MAX_MB = 10
RATING_MAX = 5
PHONE_MASK = "(000) 000-0000"

_email_validator = EmailValidator()
_iso_date_re = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_iso_time_re = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
_phone_re = re.compile(r"^\(\d{3}\) \d{3}-\d{4}$")


def is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, tuple, dict)) and len(value) == 0:
        return True
    return False


def validate_answer(question: Question, value: Any) -> dict[str, str]:
    if is_empty(value):
        return {}

    cfg = question.config if isinstance(question.config, dict) else {}
    t = question.type

    if t == Question.Type.SHORT_TEXT:
        if not isinstance(value, str):
            return {"value": "Enter a text answer."}
        if len(value) > SHORT_TEXT_MAX_LENGTH:
            return {"value": f"Keep it under {SHORT_TEXT_MAX_LENGTH} characters."}
        return {}

    if t == Question.Type.LONG_TEXT:
        if not isinstance(value, str):
            return {"value": "Enter a text answer."}
        if len(value) > LONG_TEXT_MAX_LENGTH:
            return {"value": f"Keep it under {LONG_TEXT_MAX_LENGTH} characters."}
        return {}

    if t == Question.Type.EMAIL:
        if not isinstance(value, str):
            return {"value": "Enter a valid email."}
        try:
            _email_validator(value)
        except ValidationError:
            return {"value": "Enter a valid email."}
        return {}

    if t == Question.Type.MULTIPLE_CHOICE:
        choices = cfg.get("choices", []) or []
        allow_multiple = bool(cfg.get("allow_multiple"))
        if allow_multiple:
            if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
                return {"value": "Pick from the listed options."}
            if any(v not in choices for v in value):
                return {"value": "Pick from the listed options."}
            return {}
        if not isinstance(value, str) or value not in choices:
            return {"value": "Pick one of the options."}
        return {}

    if t == Question.Type.DROPDOWN:
        choices = cfg.get("choices", []) or []
        if not isinstance(value, str) or value not in choices:
            return {"value": "Pick one of the options."}
        return {}

    if t == Question.Type.NUMBER:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return {"value": "Enter a number."}
        if cfg.get("integer") and float(value) != int(value):
            return {"value": "Enter a whole number."}
        return {}

    if t == Question.Type.PHONE_NUMBER:
        if not isinstance(value, str):
            return {"value": "Enter a valid phone number."}
        if not _phone_re.fullmatch(value):
            return {"value": "Enter a valid phone number."}
        return {}

    if t == Question.Type.FILE_UPLOAD:
        if not isinstance(value, dict):
            return {"value": "Upload a file."}
        filename = value.get("filename")
        size = value.get("size")
        url = value.get("url")
        if not isinstance(filename, str) or not isinstance(url, str):
            return {"value": "Upload a file."}
        if not isinstance(size, int):
            return {"value": "Upload a file."}
        if size > FILE_UPLOAD_MAX_MB * 1024 * 1024:
            return {"value": f"File must be under {FILE_UPLOAD_MAX_MB} MB."}
        return {}

    if t == Question.Type.DATE:
        if not isinstance(value, str) or not _iso_date_re.match(value):
            return {"value": "Enter a valid date."}
        try:
            _date.fromisoformat(value)
        except ValueError:
            return {"value": "Enter a valid date."}
        return {}

    if t == Question.Type.TIME:
        if not isinstance(value, str) or not _iso_time_re.match(value):
            return {"value": "Enter a valid time."}
        return {}

    if t == Question.Type.LINEAR_SCALE:
        lo, hi = cfg.get("min"), cfg.get("max")
        if isinstance(value, bool) or not isinstance(value, int):
            return {"value": "Pick a value on the scale."}
        if isinstance(lo, int) and isinstance(hi, int) and not (lo <= value <= hi):
            return {"value": f"Pick a value between {lo} and {hi}."}
        return {}

    if t == Question.Type.RATING:
        if isinstance(value, bool) or not isinstance(value, int):
            return {"value": f"Pick a rating from 1 to {RATING_MAX}."}
        if not (1 <= value <= RATING_MAX):
            return {"value": f"Pick a rating from 1 to {RATING_MAX}."}
        return {}

    if t == Question.Type.RANKING:
        choices = cfg.get("choices", []) or []
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            return {"value": "Invalid ranking."}
        if len(value) != len(choices):
            return {"value": "Rank all of the options."}
        if len(set(value)) != len(value):
            return {"value": "Invalid ranking."}
        if any(v not in choices for v in value):
            return {"value": "Invalid ranking."}
        return {}

    return {}
