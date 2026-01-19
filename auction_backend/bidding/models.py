# ...existing code...
from django.db import models

class Bid(models.Model):
    # use app_label.ModelName (match your INSTALLED_APPS entries)
    product = models.ForeignKey('product.Product', on_delete=models.CASCADE, related_name='biddings')
    customer = models.ForeignKey('customer.Customer', on_delete=models.CASCADE, related_name='biddings')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product} - {self.amount}"

    class Meta:
        db_table = 'bidding'
# ...existing code...