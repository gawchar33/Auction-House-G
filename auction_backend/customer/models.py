from django.db import models

class Customer(models.Model):
    # Removed the OneToOneField to User to avoid FK/migration complications.
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Customer(id={self.id}, phone={self.phone})"
