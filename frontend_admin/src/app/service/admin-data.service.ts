import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

const API_BASE_URL = 'http://127.0.0.1:8000/';

@Injectable({
  providedIn: 'root',
})
export class AdminDataService {
  constructor(private http: HttpClient) {}

  private getCsrfToken(): string | null {
    try {
      const m = document.cookie.match(/(^|;)\s*(?:csrftoken|csrf)=([^;]+)/);
      return m ? decodeURIComponent(m[2]) : null;
    } catch (e) {
      return null;
    }
  }

  private withCsrfOptions(): any {
    const token = this.getCsrfToken();
    console.debug('[AdminDataService] withCsrfOptions csrftoken=', token);
    const headers: any = {};
    if (token) headers['X-CSRFToken'] = token;
    return { withCredentials: true, headers };
  }

  // ensure CSRF cookie is present; if not, call backend /user/csrf/ to set it
  private ensureCsrf$(): Observable<void> {
    if (this.getCsrfToken()) return of(void 0);
    // use fetch to set cookie (mirrors server-side behavior), return observable that completes regardless of network errors
    return from(fetch(`${API_BASE_URL}user/csrf/`, { method: 'GET', credentials: 'include' })).pipe(
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  private callWithCsrf<T>(reqFactory: () => Observable<T>): Observable<T> {
    return this.ensureCsrf$().pipe(switchMap(() => {
      const token = this.getCsrfToken();
      console.debug('[AdminDataService] callWithCsrf csrftoken after ensure=', token);
      return reqFactory();
    }));
  }

  // Central error handler used by catchError in many requests
  public handleError(err: any): Observable<never> {
    try {
      const status = err && err.status ? err.status : null;
      if (status === 401 || status === 403) {
        return throwError(() => ({ code: 'AUTH_REQUIRED', message: 'Authentication required' }));
      }
      const message = (err && err.error && err.error.detail) || (err && err.message) || 'Unknown error';
      return throwError(() => ({ code: 'ERROR', message }));
    } catch (e) {
      return throwError(() => ({ code: 'ERROR', message: 'Unknown error' }));
    }
  }

  // helper that the UI can call to verify server session / profile
  getProfile(): Observable<any> {
    return this.http.get(`${API_BASE_URL}user/profile/`, { withCredentials: true }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  getProducts(): Observable<any> {
    return this.http.get(`${API_BASE_URL}product/`, { withCredentials: true }).pipe(catchError((err) => this.handleError(err)));
  }

  getCategories(): Observable<any> {
    return this.http.get(`${API_BASE_URL}category/`, { withCredentials: true }).pipe(catchError((err) => this.handleError(err)));
  }

  getCustomers(): Observable<any> {
    return this.http.get(`${API_BASE_URL}customer/`, { withCredentials: true }).pipe(catchError((err) => this.handleError(err)));
  }

  // Try the canonical /user/ endpoint, then fall back to /user (no slash) and /customer/
  getUsers(): Observable<any> {
    return this.http.get(`${API_BASE_URL}user/`, { withCredentials: true }).pipe(
      catchError((err) => {
        if (err && err.status === 404) {
          return this.http.get(`${API_BASE_URL}user`, { withCredentials: true }).pipe(
            catchError(() => this.http.get(`${API_BASE_URL}customer/`, { withCredentials: true }).pipe(catchError((e) => this.handleError(e))))
          );
        }
        return this.handleError(err);
      })
    );
  }

  getAuctions(): Observable<any> {
    return this.http.get(`${API_BASE_URL}auction/`, { withCredentials: true }).pipe(catchError((err) => this.handleError(err)));
  }

  getBiddings(): Observable<any> {
    return this.http.get(`${API_BASE_URL}bidding/`, { withCredentials: true }).pipe(catchError((err) => this.handleError(err)));
  }

  // CREATE endpoints for admin add pages (use request factory so ensureCsrf$ runs first)
  createProduct(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}product/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  createCategory(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}category/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  createCustomer(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}customer/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  // user creation via signup endpoint
  createUser(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}user/signup/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  // Auctions
  createAuction(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}auction/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  updateAuction(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}auction/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteAuction(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}auction/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  // Biddings
  createBidding(payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.post(`${API_BASE_URL}bidding/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  updateBidding(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}bidding/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteBidding(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}bidding/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  // UPDATE / DELETE helpers
  updateProduct(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}product/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteProduct(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}product/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  updateCategory(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}category/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteCategory(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}category/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  updateCustomer(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}customer/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteCustomer(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}customer/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  // user update/delete (map to user/<id>/ on backend)
  updateUser(id: any, payload: any): Observable<any> {
    return this.callWithCsrf(() => this.http.put(`${API_BASE_URL}user/${id}/`, payload, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }

  deleteUser(id: any): Observable<any> {
    return this.callWithCsrf(() => this.http.delete(`${API_BASE_URL}user/${id}/`, this.withCsrfOptions()).pipe(catchError((err) => this.handleError(err))));
  }
}
