
from django.db import transaction
from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Activity
from .serializers import ActivitySerializer


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.none()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "subject",
        "description",
        "customer__first_name",
        "customer__last_name",
        "lead__first_name",
        "lead__last_name",
        "opportunity__title",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "due_at",
        "priority",
        "status",
    ]

    ordering = ["due_at", "-created_at"]

    LOCKED_STATUSES = [
        Activity.Status.COMPLETED,
        Activity.Status.CANCELLED,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = Activity.objects.select_related(
            "customer",
            "lead",
            "opportunity",
            "assigned_to",
            "created_by",
        )

        if user.role not in ["ADMIN", "SALES_MANAGER"]:
            queryset = queryset.filter(assigned_to=user)

        activity_type = self.request.query_params.get("activity_type")
        if activity_type:
            queryset = queryset.filter(
                activity_type=activity_type.upper()
            )

        activity_status = self.request.query_params.get("status")
        if activity_status:
            queryset = queryset.filter(
                status=activity_status.upper()
            )

        if self.request.query_params.get("overdue") == "true":
            queryset = queryset.filter(
                due_at__lt=timezone.now(),
                status__in=[
                    Activity.Status.PLANNED,
                    Activity.Status.IN_PROGRESS,
                ],
            )

        if self.request.query_params.get("upcoming") == "true":
            queryset = queryset.filter(
                due_at__gte=timezone.now(),
                status__in=[
                    Activity.Status.PLANNED,
                    Activity.Status.IN_PROGRESS,
                ],
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "SALES_EMPLOYEE":
            serializer.save(
                created_by=user,
                assigned_to=user,
            )
        else:
            serializer.save(created_by=user)

    def perform_update(self, serializer):
        activity = serializer.instance

        if activity.status in self.LOCKED_STATUSES:
            raise PermissionDenied(
                "Completed or cancelled activities cannot be edited."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.status in self.LOCKED_STATUSES:
            raise PermissionDenied(
                "Completed or cancelled activities cannot be deleted."
            )

        instance.delete()

    @action(
        detail=True,
        methods=["post"],
        url_path="complete",
    )
    def complete(self, request, pk=None):
        with transaction.atomic():
            # First retrieve through the role-filtered queryset.
            activity = self.get_object()

            # Lock the database row while checking and updating its status.
            activity = Activity.objects.select_for_update().get(
                pk=activity.pk
            )

            if activity.status == Activity.Status.COMPLETED:
                return Response(
                    {"detail": "This activity is already completed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if activity.status == Activity.Status.CANCELLED:
                return Response(
                    {"detail": "A cancelled activity cannot be completed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            activity.status = Activity.Status.COMPLETED
            activity.completed_at = timezone.now()

            activity.save(
                update_fields=[
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )

            response_data = ActivitySerializer(
                activity,
                context={"request": request},
            ).data

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )
