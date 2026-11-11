
from rest_framework import serializers

from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):

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

    customer_name = serializers.SerializerMethodField()
    lead_name = serializers.SerializerMethodField()

    opportunity_name = serializers.CharField(
        source="opportunity.title",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Activity
        fields = "__all__"

        read_only_fields = (
            "id",
            "created_by",
            "completed_at",
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

    def get_customer_name(self, obj) -> str | None:
        return str(obj.customer) if obj.customer else None

    def get_lead_name(self, obj) -> str | None:
        return str(obj.lead) if obj.lead else None

    def validate(self, attrs):
        instance = self.instance

        # Completed and cancelled activities are immutable.
        if instance and instance.status in [
            Activity.Status.COMPLETED,
            Activity.Status.CANCELLED,
        ]:
            raise serializers.ValidationError(
                "Completed or cancelled activities cannot be modified."
            )

        customer = attrs.get(
            "customer",
            instance.customer if instance else None,
        )

        lead = attrs.get(
            "lead",
            instance.lead if instance else None,
        )

        opportunity = attrs.get(
            "opportunity",
            instance.opportunity if instance else None,
        )

        linked_records = [
            customer,
            lead,
            opportunity,
        ]

        linked_count = sum(
            record is not None for record in linked_records
        )

        if linked_count > 1:
            raise serializers.ValidationError(
                "An activity can be linked to only one CRM record."
            )

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            user = request.user

            if user.role == "SALES_EMPLOYEE":
                linked_record = customer or lead or opportunity

                if (
                    linked_record
                    and linked_record.assigned_to_id != user.id
                ):
                    raise serializers.ValidationError(
                        "You can only create activities for records assigned to you."
                    )

        return attrs

    def validate_status(self, value):
        if value == Activity.Status.COMPLETED:
            raise serializers.ValidationError(
                "Use the activity completion endpoint to complete an activity."
            )

        return value
