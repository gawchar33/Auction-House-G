from django.contrib.auth import get_user_model, authenticate, login as django_login, logout as django_logout
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.http import JsonResponse
from django.db import IntegrityError
from django.utils.crypto import get_random_string
import json

from customer.models import Customer

User = get_user_model()

@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

@csrf_exempt
@require_http_methods(["POST"])
def signup(request):
    try:
        body = request.body.decode('utf-8') if request.body else ''
        try:
            data = json.loads(body) if body else request.POST
        except Exception:
            data = request.POST

        name = (data.get('name') or data.get('first_name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not name or not email or not password:
            return JsonResponse({'error': 'name, email and password required'}, status=400)
        if len(password) < 6:
            return JsonResponse({'error': 'password must be at least 6 characters'}, status=400)

        first_name = name.split(' ')[0]
        last_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''

        base = email.split('@')[0] if '@' in email else first_name.lower() or 'user'
        username = base
        attempt = 0
        while User.objects.filter(username=username).exists():
            attempt += 1
            username = f"{base}{get_random_string(4)}" if attempt > 4 else f"{base}{attempt}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # ensure a Customer row exists for this user
        try:
            Customer.objects.get_or_create(user=user)
        except Exception:
            pass

        return JsonResponse({'detail': 'user created', 'id': user.id, 'username': user.username, 'email': user.email}, status=201)

    except IntegrityError:
        return JsonResponse({'error': 'user with that email or username already exists'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'internal server error', 'exception': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    try:
        body = request.body.decode('utf-8') if request.body else ''
        try:
            data = json.loads(body) if body else request.POST
        except Exception:
            data = request.POST

        identifier = (data.get('email') or data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        if not identifier or not password:
            return JsonResponse({'error': 'email/username and password required'}, status=400)

        # If identifier looks like an email, resolve to username first
        user_obj = None
        if '@' in identifier:
            user_obj = User.objects.filter(email__iexact=identifier).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
                if user:
                    django_login(request, user)
                    return JsonResponse({'detail': 'logged in', 'id': user.id, 'username': user.username, 'first_name': user.first_name, 'email': user.email}, status=200)
                # explicit check_password fallback (covers manually created hashes)
                if user_obj.check_password(password):
                    django_login(request, user_obj)
                    return JsonResponse({'detail': 'logged in', 'id': user_obj.id, 'username': user_obj.username, 'first_name': user_obj.first_name, 'email': user_obj.email}, status=200)

        # Fallback: treat identifier as username
        user = authenticate(request, username=identifier, password=password)
        if user:
            django_login(request, user)
            return JsonResponse({'detail': 'logged in', 'id': user.id, 'username': user.username, 'first_name': user.first_name, 'email': user.email}, status=200)

        return JsonResponse({'error': 'invalid credentials'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'internal server error', 'exception': str(e)}, status=500)


@require_POST
def logout(request):
    django_logout(request)
    return JsonResponse({'detail': 'logged out'}, status=200)


@require_GET
def profile(request):
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'error': 'unauthenticated'}, status=401)
    user = request.user
    data = {'id': user.id, 'username': user.username, 'first_name': user.first_name, 'email': user.email}
    try:
        cust = getattr(user, 'customer', None)
        if cust:
            # normalize avatar_base64: strip optional 'username:' prefix before returning
            raw_avatar = getattr(cust, 'avatar_base64', None)
            if raw_avatar and isinstance(raw_avatar, str) and ':' in raw_avatar:
                # assume format 'username:base64'
                raw_avatar = raw_avatar.split(':', 1)[1]
            data['customer'] = {'id': getattr(cust, 'id', None), 'phone': getattr(cust, 'phone', None), 'address': getattr(cust, 'address', None), 'avatar_base64': raw_avatar}
            # also expose phone/address/avatar at top level for older frontend
            data['phone'] = getattr(cust, 'phone', None)
            data['address'] = getattr(cust, 'address', None)
            data['avatar_base64'] = raw_avatar
    except Exception:
        pass
    return JsonResponse(data)
