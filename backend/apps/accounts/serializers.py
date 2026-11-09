from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "phone",
            "department",
        )
        read_only_fields = fields


class AdminUserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        trim_whitespace=False,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "phone",
            "department",
            "is_active",
            "date_joined",
            "password",
        )
        read_only_fields = (
            "id",
            "role_display",
            "date_joined",
        )

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            **validated_data,
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = UserProfileSerializer(
            self.user
        ).data

        return data