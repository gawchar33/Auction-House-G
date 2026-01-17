from django.urls import path
from .views import customer_list_create, customer_detail

urlpatterns = [
    path('', customer_list_create),        # GET, POST
    path('<int:id>/', customer_detail),    # GET, PUT, DELETE
]
