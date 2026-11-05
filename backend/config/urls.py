from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


def home(request):
    return HttpResponse("CRM System API is running.")


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    # Authentication APIs
    path("api/v1/auth/", include("apps.accounts.urls")),

    # API documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]