"""
user app models module.

Do NOT define a Customer model here — the project already has customer.models.Customer.
Keep this file minimal so Django won't create a conflicting Customer model.
"""
from django.contrib.auth import get_user_model

User = get_user_model()
