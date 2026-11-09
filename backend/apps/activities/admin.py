
from django.contrib import admin

from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "subject",
        "activity_type",
        "status",
        "priority",
        "assigned_to",
        "due_at",
        "created_at",
    )

    list_filter = (
        "activity_type",
        "status",
        "priority",
        "due_at",
    )

    search_fields = (
        "subject",
        "description",
        "customer__first_name",
        "customer__last_name",
        "lead__first_name",
        "lead__last_name",
        "opportunity__title",
    )

    readonly_fields = (
        "completed_at",
        "created_at",
        "updated_at",
    )

    ordering = ("due_at", "-created_at")
