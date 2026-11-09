from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie

from rest_framework import generics, status, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from drf_spectacular.utils import extend_schema, inline_serializer

from .models import User
from .serializers import (
    UserProfileSerializer,
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdministrator


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=str(refresh_token),
        max_age=settings.REFRESH_COOKIE_MAX_AGE,
        httponly=settings.REFRESH_COOKIE_HTTPONLY,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response):
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="CSRFTokenResponse",
            fields={
                "csrfToken": serializers.CharField(),
            },
        )
    )
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        refresh_token = data.pop("refresh")

        response = Response(data, status=status.HTTP_200_OK)
        set_refresh_cookie(response, refresh_token)

        return response


@method_decorator(csrf_protect, name="dispatch")
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="RefreshTokenResponse",
                fields={
                    "access": serializers.CharField(),
                },
            ),
            401: inline_serializer(
                name="RefreshTokenErrorResponse",
                fields={
                    "detail": serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(
            settings.REFRESH_COOKIE_NAME
        )

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            response = Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_refresh_cookie(response)
            return response

        data = serializer.validated_data

        response = Response(
            {"access": data["access"]},
            status=status.HTTP_200_OK,
        )

        new_refresh = data.get("refresh")

        if new_refresh:
            set_refresh_cookie(response, new_refresh)

        return response


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="LogoutResponse",
                fields={
                    "detail": serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(
            settings.REFRESH_COOKIE_NAME
        )

        response = Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        clear_refresh_cookie(response)
        return response


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdministrator]
    queryset = User.objects.all().order_by("id")


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdministrator]
    queryset = User.objects.all()

    def perform_update(self, serializer):
        user = self.get_object()

        new_role = serializer.validated_data.get(
            "role",
            user.role,
        )
        new_active = serializer.validated_data.get(
            "is_active",
            user.is_active,
        )

        if user.pk == self.request.user.pk and not new_active:
            raise serializers.ValidationError(
                "You cannot deactivate your own account."
            )

        is_active_admin_after_update = (
            new_role == User.Role.ADMIN and new_active
        )

        if (
            user.role == User.Role.ADMIN
            and user.is_active
            and not is_active_admin_after_update
        ):
            active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True,
            ).count()

            if active_admins <= 1:
                raise serializers.ValidationError(
                    "You cannot deactivate or demote the last active administrator."
                )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise serializers.ValidationError(
                "You cannot delete your own account."
            )

        if (
            instance.role == User.Role.ADMIN
            and instance.is_active
        ):
            active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True,
            ).count()

            if active_admins <= 1:
                raise serializers.ValidationError(
                    "You cannot delete the last active administrator."
                )

        instance.delete()