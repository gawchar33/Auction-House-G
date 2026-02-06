import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './user_list.html',
  styleUrls: ['./user_list.css'],
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error = '';

  // edit state
  editing = false;
  editModel: any = null;
  editError = '';

  inflight = false;

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private consumeEvent(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch (e) {}
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.adminData.getUsers().subscribe({
      next: (data: any) => {
        this.users = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load users (${err.status})` : 'Failed to load users.';
        console.error(err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  startEdit(user: any, ev?: Event) {
    this.consumeEvent(ev);
    this.editing = true;
    this.editError = '';
    this.editModel = Object.assign({}, user);
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
    if (!this.editModel || !this.editModel.id) { this.editError = 'No user selected'; return; }
    this.inflight = true;
    const id = this.editModel.id;
    const payload: any = { first_name: this.editModel.first_name, last_name: this.editModel.last_name, email: this.editModel.email };
    this.adminData.updateUser(id, payload).subscribe({
      next: () => { this.cancelEdit(); this.loadUsers(); this.inflight = false; },
      error: (err) => { this.inflight = false; this.editError = err && err.message ? err.message : 'Failed to update user.'; console.error('[UserList] update error', err); }
    });
  }

  deleteItem(user: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this user?')) return;
    const id = user && user.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteUser(id).subscribe({
      next: () => { this.loadUsers(); this.inflight = false; },
      error: (err) => { this.inflight = false; console.error('[UserList] delete error', err); alert('Failed to delete user.'); }
    });
  }
}
