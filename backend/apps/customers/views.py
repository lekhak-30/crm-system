
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.none()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

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
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        # Administrators and sales managers can view all customers.
        if user.role in ["ADMIN", "SALES_MANAGER"]:
            return Customer.objects.select_related(
                "assigned_to",
                "created_by",
            ).all()

        # Sales employees can only view their assigned customers.
        return Customer.objects.select_related(
            "assigned_to",
            "created_by",
        ).filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user

        # Employees cannot assign customers to other users.
        if user.role == "SALES_EMPLOYEE":
            serializer.save(
                created_by=user,
                assigned_to=user,
            )
        else:
            serializer.save(created_by=user)
