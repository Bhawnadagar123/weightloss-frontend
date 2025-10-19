import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserCart } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private base = environment.apiBase;
  // reactive cart count (total quantity)
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  // localStorage key for guest cart
  private guestKey = 'guest_cart';

  constructor(private http: HttpClient) {}

  // existing APIs
  addToCart(userId: number | null, productId: number, quantity = 1) {
    if (userId) {
      return this.http.post<UserCart>(`${this.base}/api/cart/add`, { userId, productId, quantity })
        .pipe(
          tap(cart => this.updateCountFromCart(cart)),
          catchError(err => { throw err; })
        );
    } else {
      // guest cart in localStorage
      const cart = this.addToGuestCart(productId, quantity);
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  getCart(userId: number | null): Observable<UserCart> {
    if (userId) {
      return this.http.get<UserCart>(`${this.base}/api/cart/${userId}`)
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.getGuestCart();
      // ensure BehaviorSubject updated
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  // backend update item
  updateItem(userId: number | null, productId: number, quantity: number) {
    if (userId) {
      return this.http.put<UserCart>(`${this.base}/api/cart/update`, { userId, productId, quantity })
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.updateGuestItem(productId, quantity);
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  removeItem(userId: number | null, productId: number) {
    if (userId) {
      return this.http.delete<UserCart>(`${this.base}/api/cart/item?userId=${userId}&productId=${productId}`)
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.removeGuestItem(productId);
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  clearCart(userId: number | null) {
    if (userId) {
      return this.http.delete(`${this.base}/api/cart/${userId}`, { observe: 'response' })
        .pipe(tap(() => this.cartCountSubject.next(0)));
    } else {
      localStorage.removeItem(this.guestKey);
      this.cartCountSubject.next(0);
      return of(null);
    }
  }

  // helpers to update BehaviorSubject
  private updateCountFromCart(cart: UserCart | null) {
    if (!cart) { this.cartCountSubject.next(0); return; }
    const cnt = Array.isArray(cart.items) ? cart.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
    this.cartCountSubject.next(cnt);
  }

  // ------- Guest cart localStorage helpers (simple structure) -------
  // structure: { items: [{ productId, productName, quantity, unitPrice, totalPrice }], grandTotal }
  private getGuestCart(): UserCart {
    try {
      const raw = localStorage.getItem(this.guestKey);
      if (!raw) return { userId: 0, items: [], grandTotal: 0 } as UserCart;
      return JSON.parse(raw) as UserCart;
    } catch {
      return { userId: 0, items: [], grandTotal: 0 } as UserCart;
    }
  }

  private saveGuestCart(cart: UserCart) {
    localStorage.setItem(this.guestKey, JSON.stringify(cart));
  }

  private addToGuestCart(productId: number, quantity: number): UserCart {
    const cart = this.getGuestCart();
    const idx = cart.items.findIndex(i => i.productId === productId);
    // note: productName/unitPrice will be empty unless you fetch product details - that's fine for guest
    if (idx > -1) {
      cart.items[idx].quantity += quantity;
      cart.items[idx].totalPrice = cart.items[idx].unitPrice * cart.items[idx].quantity;
    } else {
      // minimal stub, you might want to fetch product details to fill name/price
      cart.items.push({ productId, productName: '', quantity, unitPrice: 0, totalPrice: 0 });
    }
    cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    this.saveGuestCart(cart);
    return cart;
  }

  private updateGuestItem(productId: number, quantity: number): UserCart {
    const cart = this.getGuestCart();
    const idx = cart.items.findIndex(i => i.productId === productId);
    if (idx > -1) {
      cart.items[idx].quantity = quantity;
      cart.items[idx].totalPrice = cart.items[idx].unitPrice * quantity;
    }
    cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    this.saveGuestCart(cart);
    return cart;
  }

  private removeGuestItem(productId: number): UserCart {
    const cart = this.getGuestCart();
    cart.items = cart.items.filter(i => i.productId !== productId);
    cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    this.saveGuestCart(cart);
    return cart;
  }
}