import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
  <div class="login-container">
    <div class="login-card">
      <h2>Admin Login</h2>
      <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" [(ngModel)]="email" placeholder="Enter your email" required [disabled]="isLoading" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" [(ngModel)]="password" placeholder="Enter your password" required [disabled]="isLoading" />
        </div>

        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" class="login-button" [disabled]="isLoading">
          <span *ngIf="!isLoading">Login</span>
          <span *ngIf="isLoading">Loading...</span>
        </button>
      </form>
    </div>
  </div>
  `
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  private apiUrl = 'http://127.0.0.1:8000/user/login/';

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
    const loginData = { email: this.email, password: this.password };
    this.isLoading = true;
    this.http.post<any>(this.apiUrl, loginData, { withCredentials: true }).subscribe({
      next: (response) => {
        // store user data if provided
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('auth', '1');
        }
        // if token present, keep it
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }
        this.isLoading = false;
        // navigate to admin root
        try { this.router.navigate(['/']); } catch (e) { window.location.href = '/'; }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      }
    });
  }
}
