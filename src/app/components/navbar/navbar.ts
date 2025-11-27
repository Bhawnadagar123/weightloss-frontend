import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, fromEvent, switchMap, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  // UI state
  menuOpen = false;
  searchQuery = '';
  showSuggestions = false;
  suggestions: Product[] = [];

  // user menu state
  userMenuOpen = false;
  isLoggedIn = false;
  userAvatarUrl: string | null = null;
  userInitials = 'U'; // fallback

  // cart
  cartCount = 0;

  showAnnouncement = true;

  // Rx
  private search$ = new Subject<string>();
  private subs = new Subscription();

  // fallback/hardcoded userId kept (but we will use auth.getUserId() where needed)
  readonly userId = 101;

  // bound event handlers so we can remove them later
  private boundStorageHandler = () => this.updateAuthState();
  private boundAuthChangedHandler = () => this.updateAuthState();
  private clickOutsideSub: Subscription | null = null;
  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // search debounce
    const s = this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q: string) => this.productService.getAll(q || ''))
      )
      .subscribe({
        next: (res) => {
          this.suggestions = Array.isArray(res) ? res.slice(0, 6) : [];
          this.showSuggestions = true;
        },
        error: (err) => {
          console.error('Search failed', err);
          this.suggestions = [];
        }
      });
    this.subs.add(s);

    // Subscribe to the reactive cart count (keeps UI updated)
    const cartSub = this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
    });
    this.subs.add(cartSub);

    // ONE initial cart load only (avoid loops). Use real user id from auth if available.
    const uid = this.auth.getUserId() ?? this.userId;
    // call getCart once to populate server-side cart and BehaviorSubject
    this.cartService.getCart(uid ?? null).pipe(take(1)).subscribe({
      next: () => {
        // no-op: CartService.tap updates cartCount$
      },
      error: (err) => {
        // Non-fatal: keep UI working even if initial load fails
        console.warn('Initial cart load failed', err);
      }
    });

    // set initial auth state and attach listeners so other parts can notify navbar
    this.updateAuthState();

    // Listen custom event 'authChanged' (you should dispatch this in AuthService after setToken/removeToken)
    window.addEventListener('authChanged', this.boundAuthChangedHandler);
    // Listen storage (for other-tab login/logout)
    window.addEventListener('storage', this.boundStorageHandler);

    // close user menu when clicking outside - use a Rx subscription for easier unsubscribe
    this.clickOutsideSub = fromEvent<MouseEvent>(document, 'click')
      .pipe(filter(() => this.userMenuOpen))
      .subscribe((ev) => {
        const el = ev.target as HTMLElement;
        if (!el.closest('.user-wrap')) {
          this.userMenuOpen = false;
        }
      });
    this.subs.add(this.clickOutsideSub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    // remove listeners using the same function reference
    window.removeEventListener('authChanged', this.boundAuthChangedHandler);
    window.removeEventListener('storage', this.boundStorageHandler);
  }

  /** Update local auth/UI state from token */
  updateAuthState() {
    this.isLoggedIn = this.auth.isLoggedIn();
    const token = this.auth.getToken();
    if (token) {
      try {
        const raw = token.split('.')[1] || '';
        const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        const name = payload.name || payload.sub || payload.email || null;
        if (name) {
          const parts = String(name).split(/[.\s@_-]+/).filter(Boolean);
          this.userInitials = parts.length === 0 ? 'U' : (parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase());
        } else {
          this.userInitials = 'U';
        }
        this.userAvatarUrl = payload.avatar ? (payload.avatar.startsWith('http') ? payload.avatar : (environment.apiBase + payload.avatar)) : null;
      } catch (e) {
        this.userInitials = 'U';
        this.userAvatarUrl = null;
      }
    } else {
      this.userAvatarUrl = null;
      this.userInitials = 'U';
    }
  }

  toggleUserMenu(ev?: Event) {
    if (ev) ev.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  onLogin() {
    this.userMenuOpen = false;
    if (this.isLoggedIn) return;
    this.router.navigate(['/login']);
  }

  onRegister() {
    this.userMenuOpen = false;
    if (this.isLoggedIn) return;
    this.router.navigate(['/register']);
  }

  onLogout() {
    // capture uid first
    const uid = this.auth.getUserId();
    // clear server cart (if logged-in) or guest cart otherwise; this will emit cartCount=0 via CartService
    this.cartService.clearCart(uid ?? null).pipe(take(1)).subscribe({
      next: () => {
        // remove local token and refresh UI
        this.auth.removeToken();
        // ensure BehaviorSubject is zero (clearCart should have done that)
        // If your CartService exposes a set method, you could call it here.
        this.updateAuthState();
        // notify other components in same tab
        window.dispatchEvent(new Event('authChanged'));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Failed to clear cart on logout', err);
        // still remove token locally and move on
        this.auth.removeToken();
        this.updateAuthState();
        window.dispatchEvent(new Event('authChanged'));
        this.router.navigateByUrl('/');
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
    this.showSuggestions = false;
  }

  onQueryChanged(q: string) {
    this.search$.next(q.trim());
  }

  onSearch() {
    const q = (this.searchQuery || '').trim();
    if (!q) return;
    this.router.navigate(['/product-list'], { queryParams: { search: q } });
    this.showSuggestions = false;
    this.searchQuery = '';
    this.menuOpen = false;
  }

  selectSuggestion(p: Product) {
    this.router.navigate(['/products', p.id]);
    this.showSuggestions = false;
    this.searchQuery = '';
    this.menuOpen = false;
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 180);
  }

  // helper to build image url when showing thumbnail
  imgUrl(path: string | undefined) {
    if (!path) return 'assets/placeholder.png';
    if (path.startsWith('http')) return path;
    return environment.apiBase ? (environment.apiBase + path) : path;
  }

  goHome() {
  this.router.navigateByUrl('/');
  // close menus/popups for cleaner UX on mobile
  this.menuOpen = false;
  this.userMenuOpen = false;
  this.showSuggestions = false;
}

goCart() {
  this.router.navigateByUrl('/cart');
  // close menus/popups
  this.menuOpen = false;
  this.userMenuOpen = false;
  this.showSuggestions = false;
}
}
