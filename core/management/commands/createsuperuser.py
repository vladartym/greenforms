"""Create a superuser with email + password only (username is derived from email)."""
import getpass
import sys

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Create a superuser with email + password (no username prompt)."

    def add_arguments(self, parser):
        parser.add_argument("--email", help="Superuser email (also used as username).")
        parser.add_argument("--noinput", "--no-input", action="store_true", dest="noinput")

    def handle(self, *args, **options):
        email = (options.get("email") or "").strip().lower()
        noinput = options["noinput"]

        if not email:
            if noinput:
                raise CommandError("--email is required with --noinput.")
            email = input("Email: ").strip().lower()

        if not email or "@" not in email:
            raise CommandError("Enter a valid email.")

        if User.objects.filter(username=email).exists():
            raise CommandError(f"A user with email {email} already exists.")

        if noinput:
            password = None
        else:
            while True:
                password = getpass.getpass("Password: ")
                confirm = getpass.getpass("Password (again): ")
                if password != confirm:
                    self.stderr.write("Passwords do not match. Try again.")
                    continue
                try:
                    validate_password(password)
                except ValidationError as exc:
                    self.stderr.write("\n".join(exc.messages))
                    if input("Use this password anyway? [y/N]: ").strip().lower() != "y":
                        continue
                break

        User.objects.create_superuser(username=email, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created."))
