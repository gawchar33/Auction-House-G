import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './customer_list.html',
  styleUrls: ['./customer_list.css'],
})
export class CustomerListComponent implements OnInit {
  customers: any[] = [];
  loading = false;
  error = '';

  // add form state
  showAdd = false;
  addUser = '';
  addPhone = '';
  addAddress = '';
  addError = '';

  // edit state
  editing = false;
  editModel: any = null;
  editError = '';

  // inflight guard
  inflight = false;

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  private consumeEvent(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch (e) {}
  }

  loadCustomers(ev?: Event): void {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    this.error = '';
    this.adminData.getCustomers().subscribe({
      next: (data: any) => {
        this.customers = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          this.loading = false;
          this.inflight = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load customers (${err.status})` : 'Failed to load customers.';
        console.error(err);
        this.loading = false;
        this.inflight = false;
      },
      complete: () => {
        this.loading = false;
        this.inflight = false;
      },
    });
  }

  // toggle add form visibility
  toggleAdd(ev?: Event) {
    this.consumeEvent(ev);
    this.showAdd = !this.showAdd;
    this.addError = '';
    if (!this.showAdd) {
      this.addUser = this.addPhone = this.addAddress = '';
    }
  }

  submitAdd(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.addError = '';
    if (!this.addUser) { this.addError = 'User is required'; return; }
    this.inflight = true;
    const payload = { user: this.addUser, phone: this.addPhone, address: this.addAddress };
    this.adminData.createCustomer(payload).subscribe({
      next: () => {
        this.showAdd = false;
        this.addUser = this.addPhone = this.addAddress = '';
        this.loadCustomers();
      },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') { this.addError = 'Authentication required. Redirecting to login...'; setTimeout(() => this.router.navigate(['/auth']), 300); this.inflight = false; return; }
        this.addError = err && err.message ? err.message : 'Failed to create customer.';
        console.error('[CustomerList] create error', err);
        this.inflight = false;
      }
    });
  }

  startEdit(item: any, ev?: Event) {
    this.consumeEvent(ev);
    this.editing = true;
    this.editError = '';
    this.editModel = Object.assign({}, item);
  }

  cancelEdit(ev?: Event) {
    this.consumeEvent(ev);
    this.editing = false;
    this.editModel = null;
    this.editError = '';
  }

  submitEdit(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    if (!this.editModel || !this.editModel.id) { this.editError = 'No item selected'; return; }
    this.inflight = true;
    const id = this.editModel.id;
    const payload = { user: this.editModel.user, phone: this.editModel.phone, address: this.editModel.address };
    this.adminData.updateCustomer(id, payload).subscribe({
      next: () => { this.cancelEdit(); this.loadCustomers(); },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') { this.editError = 'Authentication required. Redirecting to login...'; setTimeout(() => this.router.navigate(['/auth']), 300); this.inflight = false; return; }
        this.editError = err && err.message ? err.message : 'Failed to update customer.';
        console.error('[CustomerList] update error', err);
        this.inflight = false;
      }
    });
  }

  deleteItem(item: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this customer?')) return;
    const id = item && item.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteCustomer(id).subscribe({
      next: () => { this.loadCustomers(); },
      error: (err) => { console.error('[CustomerList] delete error', err); alert('Failed to delete customer.'); this.inflight = false; }
    });
  }

  showNotSupported(ev?: Event) {
    this.consumeEvent(ev);
    alert('Server does not support editing or deleting arbitrary customers. Add /customer/<id>/ endpoints on the backend to enable this.');
  }
}
