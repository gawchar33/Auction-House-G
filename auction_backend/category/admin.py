from django.contrib import admin

try:
    from .models import Category
    admin.site.register(Category)
except Exception:
    # model not present or broken yet — don't crash admin import
    pass