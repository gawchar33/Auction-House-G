import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend_admin');

  constructor(private router: Router) {
    // On app start, if user is not authenticated, redirect to auth landing/login
    try {
      const authFlag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('auth');
      const path = (this.router && this.router.url) ? String(this.router.url) : '';
      const isAuth = this.isAuthRoute() || path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register');
      if (authFlag !== '1' && !isAuth) {
        // navigate to auth landing
        try { this.router.navigate(['/auth']); } catch (e) { window.location.href = '/auth'; }
      }
    } catch (e) { /* ignore */ }
  }

  isAuthRoute(): boolean {
    try {
      const path = (this.router && this.router.url) ? String(this.router.url) : '';
      return path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register');
    } catch (e) { return false; }
  }

  logout(): void {
    (async () => {
      try {
        // ensure CSRF cookie is set by calling the backend csrf endpoint
        const backend = 'http://127.0.0.1:8000';
        try {
          await fetch(backend + '/user/csrf/', { method: 'GET', credentials: 'include' });
        } catch (e) { /* ignore errors obtaining CSRF cookie */ }

        // helper to read cookie value
        function getCookie(name: string) {
          const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
          return m ? decodeURIComponent(m[2]) : '';
        }

        const csrf = getCookie('csrftoken') || getCookie('csrf') || '';

        // Primary logout endpoint (use the backend route the Django app exposes)
        let res = await fetch(backend + '/user/logout/', {
          method: 'POST',
          credentials: 'include',
          headers: csrf ? { 'X-CSRFToken': csrf } : undefined,
        });

        // If backend exposes an /api/ path, try that as a fallback (but backend returned 404)
        if ((!res || !res.ok) && backend + '/api/user/logout/') {
          try {
            await fetch(backend + '/api/user/logout/', {
              method: 'POST',
              credentials: 'include',
              headers: csrf ? { 'X-CSRFToken': csrf } : undefined,
            });
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        // ignore network/logout errors but still clear client state
      } finally {
        localStorage.removeItem('auth');
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_session');
        sessionStorage.clear();
        try { try { window.dispatchEvent(new Event('user-updated')); } catch(e){} } catch(e){}
        // redirect to the auth landing which shows Register + Login choices
        try {
          // use replace to avoid leaving the logged-in page in history
          window.location.replace('/auth');
        } catch (e) {
          try { window.location.href = '/auth'; } catch (e) { /* ignore */ }
        }
       }
     })();
   }
 }
