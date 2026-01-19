from django.urls import path
from . import views

app_name = 'user'

urlpatterns = [
    path('csrf/', views.csrf, name='csrf'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
]