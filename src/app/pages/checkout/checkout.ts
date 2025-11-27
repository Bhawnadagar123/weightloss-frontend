import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
  cart: any = { items: [], grandTotal: 0 };

  // contact / address fields
  firstName = '';
  lastName = '';
  mobile = '';
  pincode = '';
  flat = '';
  area = '';
  landmark = '';
  city = '';
  state = '';

  // final shipping address (textarea)
  shippingAddress = '';

  paymentMethod: 'COD' | 'ONLINE' | string = 'COD';
  placing = false;
  loading = true;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    // require login for checkout
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { next: '/checkout' }});
      return;
    }
    this.loadCart();
  }

  loadCart() {
    this.loading = true;
    const uid = this.auth.getUserId();
    this.cartService.getCart(uid ?? null).pipe(finalize(() => this.loading = false)).subscribe({
      next: (c) => { this.cart = c || { items: [], grandTotal: 0 }; },
      error: (err) => { console.error(err); this.error = 'Failed to load cart'; }
    });
  }

  // Validation helpers
  validMobile(): boolean {
    // simple 10-digit numeric check
    return /^\d{10}$/.test(String(this.mobile || '').trim());
  }
  validPincode(): boolean {
    return /^\d{6}$/.test(String(this.pincode || '').trim());
  }

  canComposeAddress(): boolean {
    // require essential fields to compose an address
    return !!this.flat && !!this.area && !!this.city && !!this.state && this.validPincode() && this.validMobile() && !!this.firstName;
  }

  // Compose a readable shipping address string from fields
  composeAddress(): string {
    const lines: string[] = [];
    const name = [this.firstName && this.firstName.trim(), this.lastName && this.lastName.trim()].filter(Boolean).join(' ');
    if (name) lines.push(name);
    if (this.flat) lines.push(this.flat.trim());
    if (this.area) lines.push(this.area.trim());
    if (this.landmark) lines.push('Landmark: ' + this.landmark.trim());
    const cityLine = [this.city?.trim(), this.state?.trim(), this.pincode?.trim()].filter(Boolean).join(', ');
    if (cityLine) lines.push(cityLine);
    if (this.mobile) lines.push('Phone: ' + this.mobile.trim());
    return lines.join('\n');
  }

  // fill the shippingAddress textarea from the fields
  useThisAddress() {
    if (!this.canComposeAddress()) {
      this.error = 'Please fill First name, Mobile, Pincode(6) and main address fields before using this address.';
      return;
    }
    this.error = null;
    this.shippingAddress = this.composeAddress();
    // scroll to shipping textarea (optional)
    setTimeout(() => {
      const el = document.querySelector('textarea[name="addr"]') as HTMLTextAreaElement | null;
      if (el) el.focus();
    }, 50);
  }

  clearAddressFields() {
    this.flat = this.area = this.landmark = this.city = this.state = this.pincode = this.shippingAddress = '';
  }

  onPlaceOrder(e: Event) {
    e.preventDefault();
    this.error = null;

    if (!this.cart.items || this.cart.items.length === 0) { this.error = 'Cart is empty'; return; }

    // Require name + mobile + pincode + shipping address
    if (!this.firstName || !this.validMobile() || !this.validPincode()) {
      this.error = 'Enter valid name, 10-digit mobile and 6-digit pincode.';
      return;
    }

    // If user didn't click "Use this address", but filled fields, assemble automatically
    if (!this.shippingAddress || this.shippingAddress.trim().length < 10) {
      // only auto-compose if required fields provided
      if (this.canComposeAddress()) {
        this.shippingAddress = this.composeAddress();
      } else {
        this.error = 'Please provide a shipping address (or click "Use this address").';
        return;
      }
    }

    const uid = this.auth.getUserId();
    if (!uid) { this.router.navigate(['/login'], { queryParams: { next: '/checkout' }}); return; }

    const payload = {
      userId: uid,
      paymentMethod: this.paymentMethod || 'COD',
      shippingAddress: this.shippingAddress.trim()
    };

    this.placing = true;
    this.orderService.placeOrder(payload).pipe(finalize(() => this.placing = false)).subscribe({
      next: (res) => {
        const orderId = res?.id;
        // clear cart on server and navigate to confirmation
        this.cartService.clearCart(uid).subscribe({
          next: () => {
            if (orderId) {
              this.router.navigate(['/order-confirmation', orderId]);
            } else {
              this.router.navigate(['/']);
            }
          },
          error: () => {
            if (orderId) this.router.navigate(['/order-confirmation', orderId]); else this.router.navigate(['/']);
          }
        });
      },
      error: (err) => {
        console.error('Place order failed', err);
        this.error = err?.error?.message || err?.message || 'Failed to place order. Try again';
      }
    });
  }

  goBack() {
    this.router.navigate(['/cart']);
  }
}
