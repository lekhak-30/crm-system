
from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "assigned_to",
        "status",
        "created_at",
    )

    list_filter = ("status", "created_at")
    search_fields = (
        "first_name",
        "last_name",
        "email",
        "company",
        "phone",
    )

    readonly_fields = ("created_at", "updated_at")

    ordering = ("-created_at",)
