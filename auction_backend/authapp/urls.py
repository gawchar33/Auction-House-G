from django.urls import path
from .views import signup, login, user_profile

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("profile/<int:user_id>/", user_profile),
]
