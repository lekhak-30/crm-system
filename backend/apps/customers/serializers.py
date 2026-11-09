
from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        allow_null=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_by",
            "created_at",
            "updated_at",
        )

    def get_fields(self):
        fields = super().get_fields()

        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
            and request.user.role == "SALES_EMPLOYEE"
        ):
            fields["assigned_to"].read_only = True

        return fields
