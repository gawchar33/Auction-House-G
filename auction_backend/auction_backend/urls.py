

from django.contrib import admin
from django.urls import path,include


urlpatterns = [
    path("admin/", admin.site.urls),
     path('user/', include('user.urls')),
     path('customer/', include('customer.urls')),
     path('category/', include('category.urls')),
     path('product/', include('product.urls')),
     path('auction/', include('auction.urls')),
     path('auth/', include('authapp.urls')),
       path('auth/', include('user.urls')),

]