"""
Django settings for core project.
CORREGIDO PARA RAILWAY + VERCEL
"""

from pathlib import Path
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-2i=g)%6c^4y9dwc44i#pz)6$+haug0o2w$(^p(pmy&7pa!r&kb'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',   # <--- Importante para conectar con React
    'rest_framework',
    'mapa',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',         # <--- SIEMPRE DE PRIMERO
    'django.middleware.security.SecurityMiddleware', # <--- SIEMPRE DE SEGUNDO
    'whitenoise.middleware.WhiteNoiseMiddleware',    # <--- TERCERO (Archivos estáticos)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Eliminé el SecurityMiddleware repetido que tenías aquí
]

# PERMITE QUE CUALQUIER SITIO (VERCEL) SE CONECTE
CORS_ALLOW_ALL_ORIGINS = True 

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'core.wsgi.application'

# Database
# Usando tu base de datos de Railway
DATABASE_URL = "postgresql://postgres:PKyZlPFYwfHnzVpyXPtTssrobSCZpvDF@shinkansen.proxy.rlwy.net:41385/railway"

DATABASES = {
    'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600)
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CONFIGURACIÓN DE CORREO (Gmail)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mreinaldo818@gmail.com'
EMAIL_HOST_PASSWORD = 'hxdg vkxn elbh zssa' 

# LISTA DE SITIOS CONFIABLES PARA GUARDAR DATOS (CSRF)
# Aquí agregué Vercel para que no te bloquee al guardar puntos
CSRF_TRUSTED_ORIGINS = [
    'https://*.railway.app',
    'https://*.up.railway.app',
    'https://*.vercel.app'  # <--- ESTA ES LA CLAVE NUEVA
]