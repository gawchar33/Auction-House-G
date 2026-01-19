from django.urls import path
from .views import category_list_create, category_detail

urlpatterns = [
    path('', category_list_create, name='category-list-create'),
    path('<int:id>/', category_detail, name='category-detail'),
]