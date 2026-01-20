from django.urls import path
from .views import customer_list_create, customer_me

urlpatterns = [
    path('', customer_list_create, name='customer-list-create'),
    path('me/', customer_me, name='customer-me'),
]
