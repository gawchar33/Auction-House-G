from django.urls import path
from .views import auction_list_create, auction_detail

urlpatterns = [
    path('', auction_list_create),
    path('<int:id>/', auction_detail),
]
