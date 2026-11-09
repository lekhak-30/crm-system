
from rest_framework import serializers

from .models import Opportunity


class OpportunitySerializer(serializers.ModelSerializer):

    customer_name = serializers.SerializerMethodField()

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

    weighted_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Opportunity

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_by",
            "actual_close_date",
            "created_at",
            "updated_at",
        )

    def get_customer_name(self, obj)-> str | None:
        return str(obj.customer) if obj.customer else None

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

    def validate(self, attrs):
        instance = self.instance

        stage = attrs.get(
            "stage",
            instance.stage if instance else Opportunity.Stage.PROSPECTING,
        )

        lost_reason = attrs.get(
            "lost_reason",
            instance.lost_reason if instance else "",
        )

        if stage == Opportunity.Stage.LOST and not lost_reason.strip():
            raise serializers.ValidationError({
                "lost_reason": "A reason is required when an opportunity is lost."
            })

        if stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            if instance is None or instance.stage != stage:
                raise serializers.ValidationError({
                    "stage": "Use the opportunity closing endpoint to mark a deal as won or lost."
                })

        return attrs
