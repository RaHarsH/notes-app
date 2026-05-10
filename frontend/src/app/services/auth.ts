import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, AuthTokens } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  
  // State
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  user = signal<User | null>(null);
  isAuthenticated = computed(() => this.user() !== null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.fetchMe().subscribe({
        error: () => this.logout() // Token invalid
      });
    }
  }

  signup(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/signup`, data).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.user.set(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  fetchMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this.user.set(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  private handleAuthResponse(res: AuthTokens) {
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken);
    }
    if (res.refreshToken) {
      localStorage.setItem('refresh_token', res.refreshToken);
    }
    if (res.user) {
      this.user.set(res.user);
      this.currentUserSubject.next(res.user);
    } else {
      this.fetchMe().subscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
