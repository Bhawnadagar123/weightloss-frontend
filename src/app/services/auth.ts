import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Try to decode JWT and return userId if present.
   * Returns number | null
   */
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // base64url -> base64
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // pad if needed
      const pad = b64.length % 4;
      const b64p = pad ? b64 + '='.repeat(4 - pad) : b64;
      const json = atob(b64p);
      const data = JSON.parse(json);
      // adjust key name if backend uses different claim name
      // e.g. { userId: 101 } or { sub: "john@example.com", userId: 101 }
      if (data.userId) return Number(data.userId);
      if (data.user_id) return Number(data.user_id);
      // sometimes user id is in `sub` or `sub` contains email; return null otherwise
      return null;
    } catch (e) {
      console.error('Failed to parse token', e);
      return null;
    }
  }
  
}
