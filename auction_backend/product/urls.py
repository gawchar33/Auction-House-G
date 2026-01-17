from django.urls import path
from .views import product_list_create, product_detail

urlpatterns = [
    path('', product_list_create),
    path('<int:id>/', product_detail),
]
