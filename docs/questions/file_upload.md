# File upload

An uploader that accepts a single file per question.

## When to use

Resumes, screenshots, receipts, supporting documents. For multiple files, ask multiple questions.

## Data model

- Type key: `file_upload`
- Value shape: `{ filename: string, size: number, url: string, mime_type: string }`
- Config shape: `{}` (no per-question config)

## Respond UI

A drag-and-drop zone with a "Choose file" fallback button. Once a file is attached, the card shows filename, size, and a remove action. Upload happens immediately on select; the answer is saved only after upload succeeds. Any file type is accepted.

## Builder UI

- Label, required toggle.
- No config: every file upload uses the same 10 MB cap and accepts any file type.

## Validation

- Required: null fails with "This question is required."
- Size: files over 10 MB are rejected before upload with "File must be under 10 MB." The upload endpoint enforces the same cap.
- Null / empty passes on save.

## Notes

- Storage target is Django's default storage (local dev) or an S3-compatible bucket in prod.
- No malware scanning. Treat uploaded files as untrusted in any downstream use.
- In preview, the file is held locally as an object URL; nothing is uploaded.
