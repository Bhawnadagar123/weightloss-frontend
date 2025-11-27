import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { CommonModule, DecimalPipe } from '@angular/common';
import { debounceTime, Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  imports: [DecimalPipe,RouterModule, CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  cart: any = { userId: null, items: [], grandTotal: 0 };
  loading = true;
  error: string | null = null;
  productImageMap: Record<number, string> = {};
  private subs = new Subscription();

  constructor(
    private cartService: CartService,
    private auth: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
   this.loadCart();
    // subscribe to cartCount changes; when count changes, reload cart (debounced)
    // const s = this.cartService.cartCount$.pipe(debounceTime(150)).subscribe(() => {
      // reload cart to fetch latest items from server (or guest store)
    //   this.loadCart();
    // });
    // this.subs.add(s);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadCart() {
    this.loading = true;
    this.error = null;
    // NOTE: do NOT call auth.getUserId() here; let CartService resolve.
    this.cartService.getCart().subscribe({
      next: (c) => {
        // normalize defensively (ensure items array)
        this.cart = c ?? { items: [], grandTotal: 0 };
        this.loading = false;
        (this.cart.items || []).forEach((it: any) => {
          if (it.productId) this.fetchProductImage(it.productId);
        });
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.error = 'Unable to load cart. Please try again.';
        this.loading = false;
      }
    });
  }

  fetchProductImage(productId: number) {
    if (this.productImageMap[productId]) return;
    this.productService.getById(productId).subscribe({
      next: (p) => {
        // Use first image if exists, otherwise placeholder
        this.productImageMap[productId] = (p?.images && p.images[0]) ? p.images[0] : '/assets/placeholder.png';
      },
      error: () => {
        this.productImageMap[productId] = '/assets/placeholder.png';
      }
    });
  }

  imgUrl(path?: string) {
    if (!path) return '/assets/placeholder.png';
    if (/^https?:\/\//i.test(path)) return path;
    // rely on dev proxy or environment.apiBase
    return path.startsWith('/') ? path : '/' + path;
  }
  

  onImgError(ev: any) {
    ev.target.src = '/assets/placeholder.png';
  }

  // ... rest stays same but ensure calls to cartService use no userId param (or null)
  updateQty(productId: number, qty: number) {
    if (qty < 1) return;
    this.cartService.updateItem(productId, qty).subscribe({
      next: (c) => this.cart = c,
      error: (err) => { console.error(err); alert('Failed to update quantity'); }
    });
  }

  onQtyChange(productId: number, e: any) {
    const v = Number(e.target.value || 1);
    if (isNaN(v) || v < 1) return;
    this.updateQty(productId, v);
  }

  removeItem(productId: number) {
    if (!confirm('Remove this item from cart?')) return;
    this.cartService.removeItem(productId).subscribe({
      next: (c) => this.cart = c,
      error: (err) => { console.error(err); alert('Failed to remove item'); }
    });
  }

  clearCart() {
    if (!confirm('Clear your cart?')) return;
    this.cartService.clearCart(undefined).subscribe({
      next: () => this.cart = { items: [], grandTotal: 0 },
      error: (err) => { console.error(err); alert('Failed to clear cart'); }
    });
  }

  checkout() {
    // if you require login for checkout:
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { next: '/checkout' }});
      return;
    }
    // otherwise go to checkout
    this.router.navigate(['/checkout']);
  }

  continueShopping() {
    this.router.navigate(['/product-list']);
  }
}