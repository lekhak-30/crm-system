
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from apps.customers.models import Customer


class Opportunity(models.Model):

    class Stage(models.TextChoices):
        PROSPECTING = "PROSPECTING", "Prospecting"
        QUALIFICATION = "QUALIFICATION", "Qualification"
        PROPOSAL = "PROPOSAL", "Proposal"
        NEGOTIATION = "NEGOTIATION", "Negotiation"
        WON = "WON", "Won"
        LOST = "LOST", "Lost"

    title = models.CharField(max_length=200)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="opportunities",
    )

    description = models.TextField(blank=True)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(
        max_length=3,
        default="NPR",
    )

    stage = models.CharField(
        max_length=20,
        choices=Stage.choices,
        default=Stage.PROSPECTING,
    )

    probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    expected_close_date = models.DateField(
        null=True,
        blank=True,
    )

    actual_close_date = models.DateField(
        null=True,
        blank=True,
    )

    lost_reason = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_opportunities",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_opportunities",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def weighted_value(self):
        return (
            self.amount * self.probability / Decimal("100")
        ).quantize(Decimal("0.01"))

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Opportunity"
        verbose_name_plural = "Opportunities"

    def __str__(self):
        return self.title
