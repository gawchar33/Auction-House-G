from django.db import models
from django.conf import settings

class Media(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='media')
    filename = models.CharField(max_length=255, blank=True, null=True)
    file = models.ImageField(upload_to='customer_media/', blank=True, null=True)
    base64 = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename or f"media_{self.id}"


class Customer(models.Model):
    # link customer to Django user for per-user profiles
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='customer')

    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # add a text field to hold base64-encoded avatar (no data: prefix)
    avatar_base64 = models.TextField(blank=True, null=True)

    # optional link to latest media row
    media = models.ForeignKey(Media, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')

    def __str__(self):
        if self.user:
            return f"Customer(user={getattr(self.user, 'email', getattr(self.user, 'username', 'user'))})"
        return f"Customer(id={self.id}, phone={self.phone})"
