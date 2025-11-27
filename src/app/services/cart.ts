import { map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserCart } from '../models/cart.model';
import { AuthService } from './auth';
import { ProductService } from './product';

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

  constructor(private http: HttpClient, private auth: AuthService,private productService: ProductService) {}

  
  // helper: resolve userId from arg or auth
  private resolveUserId(userId?: number | null): number | null {
    if (userId != null) return userId;
    const uid = this.auth?.getUserId();
    return uid != null ? uid : null;
  }

  // ADD to cart: productId first, quantity next, optional userId last
  addToCart(productId: number, quantity = 1, userId?: number | null) {
  const uid = this.resolveUserId(userId);
  if (uid) {
    return this.http.post<any>(`${this.base}/api/cart/add`, { userId: uid, productId, quantity })
      .pipe(tap(cart => this.updateCountFromCart(cart)));
  } else {
    // Guest: fetch product details then persist
    return this.productService.getById(productId).pipe(
      map(p => {
        const unitPrice = p?.price ?? 0;
        const productName = p?.name ?? '';
        // read existing guest cart
        const cart = this.getGuestCart();
        const idx = cart.items.findIndex(i => i.productId === productId);
        if (idx > -1) {
          cart.items[idx].quantity += quantity;
          cart.items[idx].unitPrice = unitPrice;
          cart.items[idx].productName = productName || cart.items[idx].productName;
          cart.items[idx].totalPrice = cart.items[idx].unitPrice * cart.items[idx].quantity;
        } else {
          cart.items.push({
            productId,
            productName,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity
          });
        }
        cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
        this.saveGuestCart(cart);
        // update BehaviorSubject
        this.updateCountFromCart(cart);
        return cart;
      }),
      catchError(err => {
        // if product fetch fails, still add minimal entry (optional) or error out
        console.warn('Failed to fetch product for guest cart, adding minimal item', err);
        const cart = this.addToGuestCartFallback(productId, quantity);
        this.updateCountFromCart(cart);
        return of(cart);
      })
    );
  }
}

private addToGuestCartFallback(productId: number, quantity: number): UserCart {
  const cart = this.getGuestCart();
  const idx = cart.items.findIndex(i => i.productId === productId);
  if (idx > -1) {
    cart.items[idx].quantity += quantity;
    cart.items[idx].totalPrice = (cart.items[idx].unitPrice || 0) * cart.items[idx].quantity;
  } else {
    cart.items.push({ productId, productName: '', quantity, unitPrice: 0, totalPrice: 0 });
  }
  cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
  this.saveGuestCart(cart);
  return cart;
}

  // GET cart: optional userId last
  getCart(userId?: number | null): Observable<any> {
    const uid = this.resolveUserId(userId);
    if (uid) {
      return this.http.get<any>(`${this.base}/api/cart/${uid}`)
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.getGuestCart();
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  // UPDATE item: productId, quantity, optional userId last
  updateItem(productId: number, quantity: number, userId?: number | null) {
    const uid = this.resolveUserId(userId);
    if (uid) {
      return this.http.put<any>(`${this.base}/api/cart/update`, { userId: uid, productId, quantity })
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.updateGuestItem(productId, quantity);
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  // REMOVE item: productId, optional userId last
  removeItem(productId: number, userId?: number | null) {
    const uid = this.resolveUserId(userId);
    if (uid) {
      return this.http.delete<any>(`${this.base}/api/cart/item?userId=${uid}&productId=${productId}`)
        .pipe(tap(cart => this.updateCountFromCart(cart)));
    } else {
      const cart = this.removeGuestItem(productId);
      this.updateCountFromCart(cart);
      return of(cart);
    }
  }

  // CLEAR cart: optional userId last
  clearCart(userId?: number | null): Observable<null> {
    const uid = this.resolveUserId(userId);
    if (uid) {
      return this.http.delete(`${this.base}/api/cart/${uid}`, { observe: 'response' })
        .pipe(map(() => {
          this.cartCountSubject.next(0);
          return null;
        }));
    } else {
      localStorage.removeItem(this.guestKey);
      this.cartCountSubject.next(0);
      return of(null);
    }
  }

  // ----- helper methods for guest cart & count update below -----
  private updateCountFromCart(cart: any) {
    if (!cart) { this.cartCountSubject.next(0); return; }
    const cnt = Array.isArray(cart.items) ? cart.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0) : 0;
    this.cartCountSubject.next(cnt);
  }

  private getGuestCart(): UserCart {
  try {
    const raw = localStorage.getItem(this.guestKey);
    if (!raw) return { userId: 0, items: [], grandTotal: 0 } as UserCart;
    return JSON.parse(raw) as UserCart;
  } catch {
    return { userId: 0, items: [], grandTotal: 0 } as UserCart;
  }
}

  private saveGuestCart(cart: any) {
    localStorage.setItem(this.guestKey, JSON.stringify(cart));
  }

  private addToGuestCart(productId: number, quantity: number) {
    const cart = this.getGuestCart();
    const idx = cart.items.findIndex((i: any) => i.productId === productId);
    if (idx > -1) {
      cart.items[idx].quantity += quantity;
      cart.items[idx].totalPrice = cart.items[idx].unitPrice * cart.items[idx].quantity;
    } else {
      cart.items.push({ productId, productName: '', quantity, unitPrice: 0, totalPrice: 0 });
    }
    cart.grandTotal = cart.items.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    this.saveGuestCart(cart);
    return cart;
  }

  private updateGuestItem(productId: number, quantity: number): UserCart {
  const cart = this.getGuestCart();
  const idx = cart.items.findIndex(i => i.productId === productId);
  if (idx > -1) {
    // If unitPrice is missing, try to fetch it synchronously via productService? We must return Observable there.
    // To keep this synchronous helper simple, if unitPrice is 0 we keep it 0; but better to expose updateItem to return Observable and fetch product.
    cart.items[idx].quantity = quantity;
    cart.items[idx].totalPrice = (cart.items[idx].unitPrice || 0) * quantity;
  }
  cart.grandTotal = cart.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
  this.saveGuestCart(cart);
  return cart;
}

  private removeGuestItem(productId: number) {
    const cart = this.getGuestCart();
    cart.items = cart.items.filter((i: any) => i.productId !== productId);
    cart.grandTotal = cart.items.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    this.saveGuestCart(cart);
    return cart;
  }

  setCartCount(count: number) {
  this.cartCountSubject.next(count);
}
}