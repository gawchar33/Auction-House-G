import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:18px;max-width:900px;margin:18px auto;background:#fff;border-radius:8px;box-shadow:0 6px 20px rgba(2,6,23,0.06);">
      <h2>Admin Debug</h2>
      <p>Use these buttons to inspect cookies, csrf token and try sample requests (for dev only).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <button (click)="showCookies()" class="btn">Show document.cookie</button>
        <button (click)="ensureCsrf()" class="btn">GET /user/csrf/ (ensure csrf cookie)</button>
        <button (click)="getProfile()" class="btn">GET /user/profile/</button>
        <button (click)="getProducts()" class="btn">GET /product/</button>
        <button (click)="testCreateProduct()" class="btn">POST /product/ (test create)</button>
      </div>

      <div style="margin-top:8px;">
        <div style="font-weight:700;margin-bottom:6px;">Output</div>
        <pre style="white-space:pre-wrap;background:#f6f8fb;padding:12px;border-radius:6px;max-height:400px;overflow:auto;">{{ output }}</pre>
      </div>
    </div>
  `,
})
export class DebugComponent {
  output = '';

  private append(line: any) {
    try {
      const s = typeof line === 'string' ? line : JSON.stringify(line, null, 2);
      this.output = (this.output ? this.output + '\n' : '') + s;
    } catch (e) {
      this.output = (this.output ? this.output + '\n' : '') + String(line);
    }
  }

  showCookies() {
    this.append('document.cookie: ' + (document.cookie || '<none>'));
  }

  async ensureCsrf() {
    try {
      this.append('calling GET /user/csrf/ ...');
      const res = await fetch((window as any).BACKEND + '/user/csrf/', { method: 'GET', credentials: 'include' });
      this.append('status: ' + res.status + ' ' + res.statusText);
      this.append('document.cookie after call: ' + (document.cookie || '<none>'));
    } catch (e) {
      this.append('ensureCsrf error: ' + String(e));
    }
  }

  async getProfile() {
    try {
      this.append('GET /user/profile/ ...');
      const res = await fetch((window as any).BACKEND + '/user/profile/', { method: 'GET', credentials: 'include' });
      this.append('status: ' + res.status);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.json();
        this.append(json);
      } else {
        const txt = await res.text();
        this.append(txt);
      }
    } catch (e) {
      this.append('getProfile error: ' + String(e));
    }
  }

  async getProducts() {
    try {
      this.append('GET /product/ ...');
      const res = await fetch((window as any).BACKEND + '/product/', { method: 'GET', credentials: 'include' });
      this.append('status: ' + res.status);
      const json = await res.json();
      this.append(json);
    } catch (e) {
      this.append('getProducts error: ' + String(e));
    }
  }

  private readCsrfToken(): string | null {
    try {
      const m = document.cookie.match(/(^|;)\s*(?:csrftoken|csrf)=([^;]+)/);
      return m ? decodeURIComponent(m[2]) : null;
    } catch (e) { return null; }
  }

  async testCreateProduct() {
    try {
      const token = this.readCsrfToken();
      this.append('csrftoken (from cookie): ' + (token || '<none>'));
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['X-CSRFToken'] = token;
      this.append('POST /product/ ...');
      const res = await fetch((window as any).BACKEND + '/product/', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ name: 'DEBUG-TEST-' + Date.now(), price: 1, stock: 1, category: null })
      });
      this.append('status: ' + res.status);
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) this.append(await res.json()); else this.append(await res.text());
    } catch (e) {
      this.append('testCreateProduct error: ' + String(e));
    }
  }
}
