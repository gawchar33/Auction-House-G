import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './category_list.html',
  styleUrls: ['./category_list.css'],
})
export class CategoryListComponent implements OnInit {
  categories: any[] = [];
  loading = false;
  error = '';

  // add form state
  showAdd = false;
  addName = '';
  addSlug = '';
  addDescription = '';
  addError = '';

  // edit state
  editing = false;
  editModel: any = null;
  editError = '';

  // inflight guard to prevent double actions (public so template can read)
  inflight = false;

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private consumeEvent(ev?: Event) {
    try {
      ev?.preventDefault();
      ev?.stopPropagation();
    } catch (e) {}
  }

  loadCategories(ev?: Event): void {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    this.error = '';
    this.adminData.getCategories().subscribe({
      next: (data: any) => {
        this.categories = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          this.loading = false;
          this.inflight = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load categories (${err.status})` : 'Failed to load categories.';
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

  toggleAdd(ev?: Event) {
    this.consumeEvent(ev);
    this.showAdd = !this.showAdd;
    this.addError = '';
    if (!this.showAdd) {
      this.addName = this.addSlug = this.addDescription = '';
    }
  }

  submitAdd(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.addError = '';
    if (!this.addName) {
      this.addError = 'Name required';
      return;
    }
    this.inflight = true;
    const payload = { name: this.addName, slug: this.addSlug, description: this.addDescription };
    this.adminData.createCategory(payload).subscribe({
      next: () => {
        this.showAdd = false;
        this.addName = this.addSlug = this.addDescription = '';
        this.loadCategories();
      },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') {
          this.addError = 'Authentication required. Redirecting to login...';
          setTimeout(() => this.router.navigate(['/auth']), 300);
          this.inflight = false;
          return;
        }
        this.addError = err && err.message ? err.message : 'Failed to create category.';
        console.error('[CategoryList] create error', err);
        this.inflight = false;
      },
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
    if (!this.editModel || !this.editModel.id) {
      this.editError = 'No item selected';
      return;
    }
    this.inflight = true;
    const id = this.editModel.id;
    const payload = { name: this.editModel.name, slug: this.editModel.slug, description: this.editModel.description };
    this.adminData.updateCategory(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadCategories();
      },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') {
          this.editError = 'Authentication required. Redirecting to login...';
          setTimeout(() => this.router.navigate(['/auth']), 300);
          this.inflight = false;
          return;
        }
        this.editError = err && err.message ? err.message : 'Failed to update category.';
        console.error('[CategoryList] update error', err);
        this.inflight = false;
      },
    });
  }

  deleteItem(item: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this category?')) return;
    const id = item && item.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteCategory(id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err) => {
        console.error('[CategoryList] delete error', err);
        alert('Failed to delete category.');
        this.inflight = false;
      },
    });
  }
}
