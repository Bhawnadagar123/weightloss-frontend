import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

interface LoginResp {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private tokenTypeKey = 'auth_type';

  constructor(private http: HttpClient) {}

  register(name: string, email: string, password: string): Observable<any> {
    const payload = { name, email, password };
    return this.http.post(`${environment.apiBase}/api/auth/register`, payload);
  }

  login(email: string, password: string): Observable<LoginResp> {
    return this.http.post<LoginResp>(`${environment.apiBase}/api/auth/login`, { email, password })
      .pipe(
        tap(resp => {
          if (resp && resp.accessToken) {
            this.setToken(resp.accessToken, resp.tokenType || 'Bearer');
          }
        })
      );
  }

  setToken(token: string, tokenType = 'Bearer') {
  localStorage.setItem(this.tokenKey, token);
  localStorage.setItem(this.tokenTypeKey, tokenType);

  // Broadcast auth change so components (navbar etc.) update immediately.
  // We dispatch a custom event 'authChanged' and also a storage event for listeners that rely on it.
  // Broadcast auth change to same-tab listeners
  try {
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { token } }));
  } catch (e) {
    console.debug('auth event dispatch failed', e);
  }
}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getTokenType(): string {
    return localStorage.getItem(this.tokenTypeKey) || 'Bearer';
  }

  removeToken() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.tokenTypeKey);

  // Broadcast logout
  try {
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { token: null } }));
  } catch (e) {
    console.debug('auth event dispatch failed', e);
  }
}

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Try to decode userId from JWT payload (base64url)
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const json = atob(padded);
      const data = JSON.parse(json);
      if (data.userId) return Number(data.userId);
      if (data.user_id) return Number(data.user_id);
      if (data.sub && !isNaN(Number(data.sub))) return Number(data.sub);
      return null;
    } catch (e) {
      console.warn('Failed to decode token', e);
      return null;
    }
  }
}
