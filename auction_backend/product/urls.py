from django.urls import path
from .views import product_list_create, product_detail

urlpatterns = [
    path('', product_list_create, name='product-list-create'),
    path('<int:id>/', product_detail, name='product-detail'),
]