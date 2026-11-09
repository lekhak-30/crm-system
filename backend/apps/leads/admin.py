
from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "source",
        "status",
        "assigned_to",
        "created_at",
    )

    list_filter = (
        "status",
        "source",
        "created_at",
    )

    search_fields = (
        "first_name",
        "last_name",
        "email",
        "phone",
        "company",
    )

    readonly_fields = (
        "converted_customer",
        "converted_at",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
