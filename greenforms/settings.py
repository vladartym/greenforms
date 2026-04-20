import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

SECRET_KEY = 'django-insecure-h2@y4jt==ig77t0-$at_jwqft=4*aad5rdov-&%10=7$(116$f'
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'core',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_vite',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'greenforms.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'greenforms.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
_frontend_dist = BASE_DIR / 'frontend' / 'dist'
STATICFILES_DIRS = [BASE_DIR / 'static']
if _frontend_dist.exists():
    STATICFILES_DIRS.append(_frontend_dist)

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50 MB hard ceiling; per-question limits enforce smaller.

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = '/login'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# Cookie-based CSRF so the React SPA can read the token and send it in X-XSRF-TOKEN.
CSRF_COOKIE_NAME = 'XSRF-TOKEN'
CSRF_HEADER_NAME = 'HTTP_X_XSRF_TOKEN'
CSRF_COOKIE_HTTPONLY = False

DJANGO_VITE = {
    'default': {
        'dev_mode': DEBUG,
        'dev_server_port': 5173,
        'manifest_path': BASE_DIR / 'frontend' / 'dist' / '.vite' / 'manifest.json',
        'static_url_prefix': '',
    }
}
