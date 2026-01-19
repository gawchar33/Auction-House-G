from django.contrib import admin
from .models import Bid

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('id','product','customer','amount','created_at')
    search_fields = ('title','description')
    list_filter = ('product','customer')