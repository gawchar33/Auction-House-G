import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from './user.service';

interface User { id?: number; name: string; email: string; phone?: string; address?: string; type?: string; }
interface Customer { id?: number; name: string; email: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  template: `
  <div class="container">
    <h2>Dashboard</h2>
    <div style="display:flex;gap:16px">
      <div style="flex:1">
        <h3>Users</h3>
        <div *ngIf="users.length === 0">No users found.</div>
        <ul>
          <li *ngFor="let u of users">{{ u.name }} — {{ u.email }}</li>
        </ul>
      </div>
      <div style="flex:1">
        <h3>Customers</h3>
        <div *ngIf="customers.length === 0">No customers found.</div>
        <ul>
          <li *ngFor="let c of customers">{{ c.name }} — {{ c.email }}</li>
        </ul>
      </div>
    </div>
  </div>
  `
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  customers: Customer[] = [];
  userForm: FormGroup;
  customerForm: FormGroup;

  private userApiUrl = 'http://127.0.0.1:8000/user/';
  private customerApiUrl = 'http://127.0.0.1:8000/customer/';

  constructor(private http: HttpClient, private router: Router, private fb: FormBuilder, private us: UserService) {
    this.userForm = this.fb.group({ name: ['', [Validators.required]], email: ['', [Validators.required]], phone: [''], address: [''], password: [''], type: ['customer'] });
    this.customerForm = this.fb.group({ name: ['', [Validators.required]], email: ['', [Validators.required]], phone: [''], address: [''], city: [''], state: [''], pincode: [''] });
  }

  ngOnInit(): void { this.loadUsers(); this.loadCustomers(); }

  loadUsers(): void {
    this.http.get<User[]>(this.userApiUrl, { withCredentials: true }).subscribe({ next: (res) => { this.users = res; }, error: (err)=> { console.error('load users', err); } });
  }

  loadCustomers(): void {
    this.http.get<Customer[]>(this.customerApiUrl, { withCredentials: true }).subscribe({ next: (res) => { this.customers = res; }, error: (err)=> { console.error('load customers', err); } });
  }
}
