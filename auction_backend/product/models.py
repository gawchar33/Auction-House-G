from django.db import models
from django.utils import timezone

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # use string reference to avoid import issues during app loading
    category = models.ForeignKey(
        'category.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name