import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
  <div class="auth-wrap">
    <div class="auth-grid">
      <div class="auth-visual">
        <div class="brand">Auction House</div>
        <h2>Admin Console</h2>
        <p class="lead">Secure access to manage products, users and auctions.</p>
        <div class="features">
          <div>• Fast listings</div>
          <div>• Real-time bidding</div>
          <div>• Secure admin controls</div>
        </div>
      </div>

      <div class="form-container">
        <div class="form-box">
          <div class="button-box">
            <div id="btn" [style.transform]="active==='login' ? 'translateX(0)' : 'translateX(100%)'"></div>
            <button type="button" class="toggle-btn" (click)="setActive('login')">Log In</button>
            <button type="button" class="toggle-btn" (click)="setActive('register')">Register</button>
          </div>

          <!-- Login Form -->
          <form *ngIf="active==='login'" (ngSubmit)="submitLogin()" class="input-group" novalidate>
            <h3 class="form-title">Admin Login</h3>
            <input type="email" name="email" [(ngModel)]="loginEmail" class="input-field" placeholder="Enter your email" required />
            <input type="password" name="password" [(ngModel)]="loginPassword" class="input-field" placeholder="Enter your password" required />
            <div class="error" *ngIf="loginError">{{ loginError }}</div>
            <button type="submit" class="submit-btn" [disabled]="loginLoading">{{ loginLoading ? 'Loading…' : 'Log In' }}</button>
          </form>

          <!-- Register Form -->
          <form *ngIf="active==='register'" (ngSubmit)="submitRegister()" class="input-group" novalidate>
            <h3 class="form-title">Create Account</h3>
            <input type="text" name="name" [(ngModel)]="regName" class="input-field" placeholder="Full name" required />
            <input type="email" name="email" [(ngModel)]="regEmail" class="input-field" placeholder="Email" required />
            <input type="password" name="password" [(ngModel)]="regPassword" class="input-field" placeholder="Enter password" required minlength="6" />
            <div class="error" *ngIf="regError">{{ regError }}</div>
            <button type="submit" class="submit-btn" [disabled]="regLoading">{{ regLoading ? 'Creating…' : 'Register' }}</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [
    `:host{display:block;font-family:Inter,system-ui,Arial,sans-serif}
    .auth-wrap{display:flex;align-items:center;justify-content:center;min-height:72vh;padding:28px;background:linear-gradient(180deg,#eef6ff,#fff)}
    .auth-grid{width:100%;max-width:980px;display:grid;grid-template-columns:1fr 420px;gap:28px}
    .auth-visual{background:linear-gradient(180deg,#0b79f0 0%, #4f8cff 100%);color:#fff;border-radius:12px;padding:32px;display:flex;flex-direction:column;justify-content:center;gap:12px;box-shadow:0 12px 40px rgba(10,20,40,0.12)}
    .auth-visual .brand{font-weight:900;font-size:20px;letter-spacing:0.6px}
    .auth-visual h2{margin:0;font-size:28px}
    .auth-visual .lead{opacity:0.95;margin:0 0 6px}
    .auth-visual .features{margin-top:10px;display:flex;flex-direction:column;gap:6px;font-weight:600}

    .form-container{display:flex;align-items:center;justify-content:center}
    .form-box{background:#fff;border-radius:12px;padding:18px;box-shadow:0 12px 40px rgba(12,24,48,0.08);position:relative;overflow:hidden;width:100%}
    .button-box{position:relative;width:100%;display:flex;border-radius:8px;background:#f6f8fb;padding:6px;margin-bottom:12px}
    .button-box .toggle-btn{flex:1;border:0;background:transparent;padding:10px 6px;font-weight:700;cursor:pointer;color:#0b1720}
    #btn{position:absolute;width:50%;height:100%;top:0;left:0;background:linear-gradient(90deg,#0b79f0,#4f8cff);border-radius:8px;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
    .input-group{display:flex;flex-direction:column;gap:12px;margin-top:8px}
    .form-title{margin:0 0 2px;font-size:16px;text-align:center;color:#0b1720}
    .input-field{padding:12px;border-radius:10px;border:1px solid #e6eef8;font-size:14px;outline:none;box-shadow:inset 0 1px 0 rgba(16,24,40,0.02)}
    .input-field:focus{border-color:#94c6ff;box-shadow:0 6px 20px rgba(11,79,191,0.06)}
    .submit-btn{background:linear-gradient(90deg,#0b79f0,#4f8cff);color:#fff;border:0;padding:12px;border-radius:10px;font-weight:800;cursor:pointer}
    .submit-btn:disabled{opacity:0.6;cursor:default}
    .error{color:#b00020;font-size:13px;text-align:center}

    /* small screens: single column */
    @media (max-width:880px){
      .auth-grid{grid-template-columns:1fr}
      #btn{display:none}
      .auth-visual{order:2;padding:20px}
      .form-box{order:1}
    }
    `,
  ],
})
export class AuthComponent {
  active: 'login' | 'register' = 'login';

  // login
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;

  // register
  regName = '';
  regEmail = '';
  regPassword = '';
  regError = '';
  regLoading = false;

  private loginUrl = 'http://127.0.0.1:8000/user/login/';
  private registerUrl = 'http://127.0.0.1:8000/user/';

  constructor(private http: HttpClient, private router: Router) {}

  setActive(mode: 'login' | 'register') { this.active = mode; }

  submitLogin() {
    this.loginError = '';
    if (!this.loginEmail || !this.loginPassword) { this.loginError = 'Email and password required'; return; }
    this.loginLoading = true;
    this.http.post<any>(this.loginUrl, { email: this.loginEmail, password: this.loginPassword }, { withCredentials: true }).subscribe({
      next: (res) => {
        this.loginLoading = false;
        // store user or token if present
        try { if (res.user) { localStorage.setItem('user', JSON.stringify(res.user)); localStorage.setItem('auth','1'); } } catch(e){}
        try { if (res.token) localStorage.setItem('authToken', res.token); } catch(e){}
        // navigate to admin root
        try { this.router.navigate(['/']); } catch(e) { window.location.href = '/'; }
      },
      error: (err) => {
        console.error(err);
        this.loginLoading = false;
        if (err.status === 401) this.loginError = 'Invalid credentials';
        else if (err.status === 0) this.loginError = 'Cannot reach server';
        else this.loginError = (err.error && (err.error.detail || err.error.error)) || 'Login failed';
      }
    });
  }

  submitRegister() {
    this.regError = '';
    if (!this.regName || !this.regEmail || !this.regPassword) { this.regError = 'Name, email and password required'; return; }
    if (this.regPassword.length < 6) { this.regError = 'Password must be at least 6 characters'; return; }
    this.regLoading = true;
    const payload = { name: this.regName, email: this.regEmail, password: this.regPassword };
    this.http.post<any>(this.registerUrl, payload, { withCredentials: true }).subscribe({
      next: (res) => {
        this.regLoading = false;
        // after register, switch to login with prefilled email
        this.setActive('login');
        this.loginEmail = this.regEmail;
        this.loginPassword = '';
      },
      error: (err) => {
        console.error(err);
        this.regLoading = false;
        // fallback: save locally
        try {
          const users = JSON.parse(localStorage.getItem('local_users') || '[]');
          users.push(payload);
          localStorage.setItem('local_users', JSON.stringify(users));
        } catch (e) {}
        this.regError = 'Registered locally (offline).';
      }
    });
  }
}
