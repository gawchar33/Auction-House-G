from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Auction(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    starting_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    current_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    category = models.ForeignKey(
        'category.Category',   # <- use string reference to avoid import errors
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title
