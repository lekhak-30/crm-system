
from django.db import transaction
from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.customers.models import Customer
from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.none()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "company",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "first_name",
        "company",
        "status",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = Lead.objects.select_related(
            "assigned_to",
            "created_by",
            "converted_customer",
        )

        if user.role in ["ADMIN", "SALES_MANAGER"]:
            return queryset.all()

        return queryset.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "SALES_EMPLOYEE":
            serializer.save(
                created_by=user,
                assigned_to=user,
            )
        else:
            serializer.save(created_by=user)

    @action(
        detail=True,
        methods=["post"],
        url_path="convert",
    )
    def convert(self, request, pk=None):
        lead = self.get_object()

        if lead.status == Lead.Status.CONVERTED:
            return Response(
                {"detail": "This lead has already been converted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if lead.status != Lead.Status.QUALIFIED:
            return Response(
                {"detail": "Only qualified leads can be converted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            customer = Customer.objects.create(
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=lead.email,
                phone=lead.phone,
                company=lead.company,
                job_title=lead.job_title,
                status=Customer.Status.ACTIVE,
                assigned_to=lead.assigned_to,
                created_by=request.user,
                notes=lead.notes,
            )

            lead.status = Lead.Status.CONVERTED
            lead.converted_customer = customer
            lead.converted_at = timezone.now()
            lead.save(
                update_fields=[
                    "status",
                    "converted_customer",
                    "converted_at",
                    "updated_at",
                ]
            )

        return Response(
            LeadSerializer(
                lead,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )
