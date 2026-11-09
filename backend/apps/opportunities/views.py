
from django.db import transaction
from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.customers.models import Customer
from .models import Opportunity
from .serializers import OpportunitySerializer


class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.none()
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "title",
        "description",
        "customer__first_name",
        "customer__last_name",
        "customer__company",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "title",
        "amount",
        "expected_close_date",
        "probability",
        "stage",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = Opportunity.objects.select_related(
            "customer",
            "assigned_to",
            "created_by",
        )

        if user.role in ["ADMIN", "SALES_MANAGER"]:
            queryset = queryset.all()
        else:
            queryset = queryset.filter(assigned_to=user)

        # Optional stage filter
        stage = self.request.query_params.get("stage")
        if stage:
            queryset = queryset.filter(stage=stage.upper())

        # Optional customer filter
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        # Only administrators and managers can filter by employee
        assigned_to = self.request.query_params.get("assigned_to")
        if assigned_to and user.role in ["ADMIN", "SALES_MANAGER"]:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        customer = serializer.validated_data["customer"]

        if user.role == "SALES_EMPLOYEE":
            if customer.assigned_to_id != user.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    "You can only create opportunities for your assigned customers."
                )

            serializer.save(
                created_by=user,
                assigned_to=user,
            )
        else:
            serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        customer = serializer.validated_data.get(
            "customer",
            serializer.instance.customer,
        )

        if (
            user.role == "SALES_EMPLOYEE"
            and customer.assigned_to_id != user.id
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You can only use customers assigned to you."
            )

        serializer.save()

    @action(
        detail=True,
        methods=["post"],
        url_path="close-won",
    )
    def close_won(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [
            Opportunity.Stage.WON,
            Opportunity.Stage.LOST,
        ]:
            return Response(
                {"detail": "This opportunity is already closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            opportunity.stage = Opportunity.Stage.WON
            opportunity.probability = 100
            opportunity.actual_close_date = timezone.localdate()
            opportunity.lost_reason = ""

            opportunity.save(
                update_fields=[
                    "stage",
                    "probability",
                    "actual_close_date",
                    "lost_reason",
                    "updated_at",
                ]
            )

        return Response(
            OpportunitySerializer(
                opportunity,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="close-lost",
    )
    def close_lost(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [
            Opportunity.Stage.WON,
            Opportunity.Stage.LOST,
        ]:
            return Response(
                {"detail": "This opportunity is already closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("lost_reason", "").strip()

        if not reason:
            return Response(
                {"lost_reason": "A reason is required to close an opportunity as lost."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            opportunity.stage = Opportunity.Stage.LOST
            opportunity.probability = 0
            opportunity.actual_close_date = timezone.localdate()
            opportunity.lost_reason = reason

            opportunity.save(
                update_fields=[
                    "stage",
                    "probability",
                    "actual_close_date",
                    "lost_reason",
                    "updated_at",
                ]
            )

        return Response(
            OpportunitySerializer(
                opportunity,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )
