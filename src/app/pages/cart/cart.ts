import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { CommonModule, DecimalPipe } from '@angular/common';
import { debounceTime, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  // fallback local asset
  if (!path) return '/assets/placeholder.png';

  // already absolute URL: use as-is
  if (/^https?:\/\//i.test(path)) return path;

  // strip leading slashes
  path = path.replace(/^\/+/, '');

  // ensure environment.apiBase exists and has no trailing slash
  const api = (environment.apiBase || '').replace(/\/+$/, '');

  // if caller passed something already starting with "files/"
  if (path.startsWith('files/')) {
    return `${api}/${path}`;    // http://localhost:8080/files/products/xxx.jpg
  }

  // if caller passed "products/..." or "uploads/..." assume files/ prefix
  if (path.startsWith('products/') || path.startsWith('uploads/')) {
    return `${api}/files/${path}`;
  }

  // if it's an Angular asset path
  if (path.startsWith('assets/')) {
    return `/${path}`;          // /assets/placeholder.png
  }

  // fallback: assume it's a file under /files
  return `${api}/files/${path}`;
}

  

  onImgError(ev: any) {
    ev.target.src = '/assets/Slim_belly_fit1.jpg';
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