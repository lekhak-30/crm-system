from django.urls import path

from .views import (
    CSRFTokenView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    CurrentUserView,
    AdminUserListView,
    AdminUserDetailView,
)

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current-user"),

    path(
        "users/",
        AdminUserListView.as_view(),
        name="admin-user-list",
    ),
    path(
        "users/<int:pk>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),
]