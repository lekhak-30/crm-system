from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        SALES_MANAGER = "SALES_MANAGER", "Sales Manager"
        SALES_EMPLOYEE = "SALES_EMPLOYEE", "Sales Employee"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SALES_EMPLOYEE,
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    department = models.CharField(
        max_length=100,
        blank=True,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"