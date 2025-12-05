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
  private logoutTimer: any = null;

  constructor(private http: HttpClient) {
    this.startTokenExpiryWatcher();
  }

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

  private startTokenExpiryWatcher() {
  const token = this.getToken();
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // convert to ms
    const now = Date.now();

    const timeLeft = exp - now;

    if (timeLeft <= 0) {
      this.removeToken();
      return;
    }

    // Auto logout when expiry time reached
    this.logoutTimer = setTimeout(() => {
      this.removeToken();
    }, timeLeft);

  } catch {}
}
  setToken(token: string, tokenType = 'Bearer') {
  localStorage.setItem(this.tokenKey, token);
  localStorage.setItem(this.tokenTypeKey, tokenType);

  this.startTokenExpiryWatcher();

  window.dispatchEvent(new CustomEvent('authChanged', { detail: { token } }));
}

   getToken(): string | null {
    try {
      return localStorage.getItem('auth_token'); // adapt key to your app
    } catch {
      return null;
    }
  }

  getTokenType(): string {
    return localStorage.getItem(this.tokenTypeKey) || 'Bearer';
  }

  removeToken() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.tokenTypeKey);

  if (this.logoutTimer) {
    clearTimeout(this.logoutTimer);
    this.logoutTimer = null;
  }

  window.dispatchEvent(new CustomEvent('authChanged', { detail: { token: null } }));
}

  isLoggedIn(): boolean {
  const token = this.getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp; // expiry in seconds

    if (!exp) return true; // if token doesn't have exp claim

    const now = Math.floor(Date.now() / 1000);

    if (exp < now) {
      this.removeToken();   // ❌ token expired → remove it
      return false;
    }

    return true;
  } catch {
    this.removeToken();
    return false;
  }
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
