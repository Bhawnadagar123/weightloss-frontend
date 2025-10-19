import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule,
    RouterModule, FormsModule, HttpClientModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  // UI state
  menuOpen = false;
  searchQuery = '';
  showSuggestions = false;
  suggestions: Product[] = [];

  // cart
  cartCount = 0;

  // Rx
  private search$ = new Subject<string>();
  private subs = new Subscription();

  // placeholder userId until auth is integrated
  readonly userId = 101;

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // listen for debounced search queries
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

    // initial cart load
    this.refreshCart();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
    // navigate to product-list page with search query param
    this.router.navigate(['/product-list'], { queryParams: { search: q } });
    this.showSuggestions = false;
    this.searchQuery = '';
    this.menuOpen = false;
  }

  selectSuggestion(p: Product) {
    // navigate to product detail page
    this.router.navigate(['/products', p.id]);
    this.showSuggestions = false;
    this.searchQuery = '';
    this.menuOpen = false;
  }

  onSearchBlur() {
    // small timeout so selectSuggestion (mousedown) registers before hiding
    setTimeout(() => {
      this.showSuggestions = false;
    }, 180);
  }

  refreshCart() {
    this.cartService.getCart(this.userId).subscribe({
      next: (cart) => {
        if (cart && Array.isArray(cart.items)) {
          this.cartCount = cart.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
        } else {
          this.cartCount = 0;
        }
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.cartCount = 0;
      }
    });
  }

  // helper to build image url when showing thumbnail
  imgUrl(path: string | undefined) {
    if (!path) return 'assets/placeholder.png';
    // if path already absolute (starts with http) return it
    if (path.startsWith('http')) return path;
    // otherwise prefix with API base (or rely on proxy)
    return environment.apiBase ? (environment.apiBase + path) : path;
  }
}
