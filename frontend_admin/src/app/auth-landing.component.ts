import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div style="display:flex;min-height:60vh;align-items:center;justify-content:center;padding:32px;">
    <div style="max-width:480px;width:100%;background:#fff;padding:28px;border-radius:12px;box-shadow:0 8px 30px rgba(10,20,40,0.08);text-align:center;">
      <h2 style="margin:0 0 8px;font-size:20px">Welcome</h2>
      <p style="margin:0 0 18px;color:#475569">You have signed out. Choose an action below.</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:14px;flex-wrap:wrap">
        <button (click)="goRegister()" style="background:#0b79f0;color:#fff;border:0;padding:10px 16px;border-radius:8px;font-weight:700">Create account</button>
        <button (click)="goLogin()" style="background:transparent;border:1px solid #cbd5e1;color:#0b1720;padding:10px 16px;border-radius:8px;font-weight:700">I already have an account</button>
      </div>
    </div>
  </div>
  `,
})
export class AuthLandingComponent {
  constructor(private router: Router) {}
  goRegister() { try { this.router.navigate(['/register']); } catch(e){ window.location.href = '/register'; } }
  goLogin() { try { this.router.navigate(['/login']); } catch(e){ window.location.href = '/login'; } }
}
