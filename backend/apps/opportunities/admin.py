
from django.contrib import admin

from .models import Opportunity


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "title",
        "customer",
        "amount",
        "currency",
        "stage",
        "probability",
        "assigned_to",
        "expected_close_date",
    )

    list_filter = (
        "stage",
        "currency",
        "expected_close_date",
        "created_at",
    )

    search_fields = (
        "title",
        "customer__first_name",
        "customer__last_name",
        "customer__company",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
