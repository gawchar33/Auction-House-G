import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminDataService } from '../service/admin-data.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './product_list.html',
  styleUrls: ['./product_list.css'],
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error = '';
  mediaURL = 'http://127.0.0.1:8000';

  // simple add form state
  showAdd = false;
  addModel: any = { name: '', price: 0, stock: 0, category: null, imageFile: null };
  addError = '';

  // edit state
  editing = false;
  editModel: any = null;
  editError = '';

  inflight = false; // prevent double-run (public so template can read it)

  constructor(private adminData: AdminDataService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  private consumeEvent(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch (e) {}
  }

  loadProducts(ev?: Event): void {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    this.error = '';
    this.adminData.getProducts().subscribe({
      next: (data: any) => {
        this.products = Array.isArray(data) ? data : data?.results ?? [];
      },
      error: (err) => {
        if (err && (err.message === 'AUTH_REQUIRED' || err === 'AUTH_REQUIRED')) {
          this.error = 'Authentication required. Redirecting to login...';
          console.warn('[ProductList] auth required, redirecting');
          this.loading = false;
          this.inflight = false;
          setTimeout(() => this.router.navigate(['/auth']), 300);
          return;
        }
        this.error = err && err.status ? `Failed to load products (${err.status})` : 'Failed to load products.';
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
    if (!this.showAdd) this.addModel = { name: '', price: 0, stock: 0, category: null, imageFile: null };
  }

  submitAdd(ev?: Event) {
    this.consumeEvent(ev);
    if (this.inflight) return;
    this.addError = '';
    if (!this.addModel.name) {
      this.addError = 'Name is required.';
      return;
    }
    this.inflight = true;

    // If an image file is provided, use FormData
    let reqPayload: any;
    if (this.addModel.imageFile) {
      const fd = new FormData();
      fd.append('name', this.addModel.name);
      fd.append('price', String(this.addModel.price));
      fd.append('stock', String(this.addModel.stock));
      if (this.addModel.category !== null && this.addModel.category !== undefined) fd.append('category', String(this.addModel.category));
      fd.append('image', this.addModel.imageFile);
      reqPayload = fd;
    } else {
      reqPayload = {
        name: this.addModel.name,
        price: this.addModel.price,
        stock: this.addModel.stock,
        category: this.addModel.category,
      };
    }

    this.adminData.createProduct(reqPayload).subscribe({
      next: (res) => {
        this.toggleAdd();
        this.loadProducts();
      },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') {
          this.addError = 'Authentication required. Redirecting to login...';
          setTimeout(() => this.router.navigate(['/auth']), 300);
          this.inflight = false;
          return;
        }
        if (err && err.message === 'NOT_SUPPORTED') {
          this.addError = 'Create not supported by backend.';
          this.inflight = false;
          return;
        }
        console.error('[ProductList] create error', err);
        this.addError = err && err.message ? err.message : 'Failed to create product.';
        this.inflight = false;
      },
    });
  }

  // image input handler for add form
  onAddImage(ev?: Event) {
    try {
      const input = ev && (ev.target as HTMLInputElement);
      if (!input || !input.files || input.files.length === 0) {
        this.addModel.imageFile = null;
        return;
      }
      this.addModel.imageFile = input.files[0];
    } catch (e) {
      console.warn('[ProductList] onAddImage error', e);
      this.addModel.imageFile = null;
    }
  }

  startEdit(item: any, ev?: Event) {
    this.consumeEvent(ev);
    this.editing = true;
    this.editError = '';
    // shallow copy
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

    let payload: any;
    if (this.editModel.imageFile) {
      const fd = new FormData();
      fd.append('name', this.editModel.name);
      fd.append('price', String(this.editModel.price));
      fd.append('stock', String(this.editModel.stock));
      if (this.editModel.category !== null && this.editModel.category !== undefined) fd.append('category', String(this.editModel.category));
      fd.append('image', this.editModel.imageFile);
      payload = fd;
    } else {
      payload = { name: this.editModel.name, price: this.editModel.price, stock: this.editModel.stock, category: this.editModel.category };
    }

    this.adminData.updateProduct(id, payload).subscribe({
      next: () => { this.cancelEdit(); this.loadProducts(); this.inflight = false; },
      error: (err) => {
        if (err && err.message === 'AUTH_REQUIRED') { this.editError = 'Authentication required. Redirecting to login...'; setTimeout(() => this.router.navigate(['/auth']), 300); this.inflight = false; return; }
        if (err && err.message === 'NOT_SUPPORTED') { this.editError = 'Update not supported by backend.'; this.inflight = false; return; }
        this.editError = err && err.message ? err.message : 'Failed to update product.';
        console.error('[ProductList] update error', err);
        this.inflight = false;
      }
    });
  }

  // image input handler for edit form
  onEditImage(ev?: Event) {
    try {
      const input = ev && (ev.target as HTMLInputElement);
      if (!input || !input.files || input.files.length === 0) {
        if (this.editModel) this.editModel.imageFile = null;
        return;
      }
      if (this.editModel) this.editModel.imageFile = input.files[0];
    } catch (e) {
      console.warn('[ProductList] onEditImage error', e);
      if (this.editModel) this.editModel.imageFile = null;
    }
  }

  deleteItem(item: any, ev?: Event) {
    this.consumeEvent(ev);
    if (!confirm('Delete this product?')) return;
    const id = item && item.id;
    if (!id) return;
    if (this.inflight) return;
    this.inflight = true;
    this.adminData.deleteProduct(id).subscribe({
      next: () => { this.loadProducts(); this.inflight = false; },
      error: (err) => { this.inflight = false; if (err && err.message === 'NOT_SUPPORTED') { alert('Delete not supported by backend.'); return; } console.error('[ProductList] delete error', err); alert('Failed to delete product.'); }
    });
  }
}
