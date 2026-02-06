import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = (window as any).BACKEND || 'http://127.0.0.1:8000';
  constructor(private http: HttpClient) {}

  // get list of users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.base + '/user/', { withCredentials: true }).pipe(
      catchError(() => of([]))
    );
  }

  // try a profile endpoint; fallback handled by caller if needed
  getProfile(): Observable<any> {
    return this.http.get<any>(this.base + '/user/profile/', { withCredentials: true }).pipe(
      catchError(() => of(null))
    );
  }

  // update profile (expects backend to accept PUT on /user/profile/)
  updateProfile(payload: any) {
    return this.http.put(this.base + '/user/profile/', payload, { withCredentials: true });
  }
}
