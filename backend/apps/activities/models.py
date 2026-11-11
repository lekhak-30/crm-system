
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.customers.models import Customer
from apps.leads.models import Lead
from apps.opportunities.models import Opportunity


class Activity(models.Model):

    class ActivityType(models.TextChoices):
        CALL = "CALL", "Call"
        MEETING = "MEETING", "Meeting"
        EMAIL = "EMAIL", "Email"
        TASK = "TASK", "Task"
        FOLLOW_UP = "FOLLOW_UP", "Follow-up"

    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    subject = models.CharField(max_length=200)

    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
    )

    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    due_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )

    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_activities",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_activities",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

   
    class Meta:
        ordering = ["due_at", "-created_at"]
        verbose_name = "Activity"
        verbose_name_plural = "Activities"

        constraints = [
            models.CheckConstraint(
                condition=~(
                    models.Q(
                        customer__isnull=False,
                        lead__isnull=False,
                    )
                    | models.Q(
                        customer__isnull=False,
                        opportunity__isnull=False,
                    )
                    | models.Q(
                        lead__isnull=False,
                        opportunity__isnull=False,
                    )
                ),
                name="activity_only_one_crm_record",
            ),
        ]


    def clean(self):
        related_records = [
            self.customer_id,
            self.lead_id,
            self.opportunity_id,
        ]

        if sum(record is not None for record in related_records) > 1:
            raise ValidationError(
                "An activity can be linked to only one CRM record."
            )

    def __str__(self):
        return f"{self.get_activity_type_display()}: {self.subject}"
