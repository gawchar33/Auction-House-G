import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
  <div class="register-container">
    <div class="register-card">
      <h2>Register</h2>
      <form (ngSubmit)="onSubmit()" #regForm="ngForm">
        <div class="form-group"><label>Name</label><input name="name" [(ngModel)]="name" required /></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" [(ngModel)]="email" required /></div>
        <div class="form-group"><label>Password</label><input type="password" name="password" [(ngModel)]="password" required minlength="6" /></div>
        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
        <button type="submit" [disabled]="isLoading">Register</button>
      </form>
    </div>
  </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private apiUrl = 'http://127.0.0.1:8000/user/';

  constructor(private http: HttpClient) {}

  onSubmit() {
    this.errorMessage = '';
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Name, email and password are required';
      return;
    }
    this.isLoading = true;
    const payload = { name: this.name, email: this.email, password: this.password };
    this.http.post(this.apiUrl, payload, { withCredentials: true }).subscribe({
      next: (res: any) => {
        // if server accepts, navigate to login
        this.isLoading = false;
        try { window.location.href = '/'; } catch (e) { /* ignore */ }
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.isLoading = false;
        // fallback: store locally if offline
        let local = [] as any[];
        try { local = JSON.parse(localStorage.getItem('local_users')||'[]'); } catch(e){ local = []; }
        local.push({ name: this.name, email: this.email, password: this.password });
        localStorage.setItem('local_users', JSON.stringify(local));
        this.errorMessage = 'Registered locally (offline). Admin can import local users later.';
      }
    });
  }
}
