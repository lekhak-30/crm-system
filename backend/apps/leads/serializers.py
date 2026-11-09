
from rest_framework import serializers

from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
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

    converted_customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = "__all__"

        read_only_fields = (
            "id",
            "created_by",
            "converted_customer",
            "converted_at",
            "created_at",
            "updated_at",
        )

    def get_converted_customer_name(self, obj)-> str | None:
        if obj.converted_customer:
            return str(obj.converted_customer)
        return None

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

    def validate_status(self, value):
        if value == Lead.Status.CONVERTED:
            raise serializers.ValidationError(
                "Use the lead conversion endpoint to convert a lead."
            )

        return value
