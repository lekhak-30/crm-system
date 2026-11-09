
from django.conf import settings
from django.db import models

from apps.customers.models import Customer


class Lead(models.Model):

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        CONTACTED = "CONTACTED", "Contacted"
        QUALIFIED = "QUALIFIED", "Qualified"
        UNQUALIFIED = "UNQUALIFIED", "Unqualified"
        CONVERTED = "CONVERTED", "Converted"

    class Source(models.TextChoices):
        WEBSITE = "WEBSITE", "Website"
        REFERRAL = "REFERRAL", "Referral"
        SOCIAL_MEDIA = "SOCIAL_MEDIA", "Social Media"
        EMAIL = "EMAIL", "Email"
        PHONE = "PHONE", "Phone"
        ADVERTISEMENT = "ADVERTISEMENT", "Advertisement"
        OTHER = "OTHER", "Other"

    # Contact information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Company information
    company = models.CharField(max_length=150, blank=True)
    job_title = models.CharField(max_length=100, blank=True)

    # Lead management
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.OTHER,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_leads",
    )

    # Conversion tracking
    converted_customer = models.OneToOneField(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_from_lead",
    )

    converted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Lead"
        verbose_name_plural = "Leads"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
