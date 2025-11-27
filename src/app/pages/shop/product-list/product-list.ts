import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../services/cart';
import { ProductService } from '../../../services/product';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = false;
  error = false;
  skeletons = Array(6);
  adding: Record<number, boolean> = {};

  features = [
    { icon: '/assets/Natural_Products.png', title: '100% Natural', text: 'Made with safe, herbal, and natural ingredients.' },
    { icon: '/assets/Expert_Approved.png', title: 'Expert Approved', text: 'Backed by nutritionists & fitness experts.' },
    { icon: '/assets/Happy_Customers.png', title: '10,000+ Customers', text: 'Trusted by thousands who transformed their lives.' },
    { icon: '/assets/Shipping_Service.png', title: 'Shipping Service', text: 'Fast & reliable delivery across India.' }
  ];

  // pagination & search
  page = 0;
  size = 12;
  totalPages = 0;
  totalElements = 0;
  searchQuery = '';

  private subs = new Subscription();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // listen to query params (search, page)
    const qSub = this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.page = params['page'] ? +params['page'] : 0;
      this.loadProducts();
    });
    this.subs.add(qSub);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  

  loadProducts() {
    this.loading = true;
    this.error = false;

    // your backend currently supports GET /api/products and ?search=
    this.productService.getAll(this.searchQuery).subscribe({
      next: (res: any) => {
        // If backend returns array, just slice for pagination client-side
        if (Array.isArray(res)) {
          // simple client-side paging:
          this.totalElements = res.length;
          this.totalPages = Math.ceil(this.totalElements / this.size);
          const start = this.page * this.size;
          this.products = res.slice(start, start + this.size);
        } else if (res && ((res as any).content || (res as any).data)) {
          // handle paged response if you later change backend to paging
          const pageObj: any = ((res as any).content ? res : (res as any).data);
          this.products = pageObj.content || pageObj;
          this.totalElements = pageObj.totalElements ?? this.products.length;
          this.totalPages = pageObj.totalPages ?? Math.ceil(this.totalElements / this.size);
        } else {
          this.products = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  applySearch(e: Event) {
    e.preventDefault();
    // update URL (keeps browser history)
    const qp: any = {};
    if (this.searchQuery) qp.search = this.searchQuery;
    qp.page = 0;
    this.router.navigate([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: 'merge' });
    // loadProducts will be triggered by queryParams subscription
  }

  gotoPage(p: number) {
    if (p < 0 || (this.totalPages && p >= this.totalPages)) return;
    this.router.navigate([], { relativeTo: this.route, queryParams: { page: p }, queryParamsHandling: 'merge' });
  }

  addToCart(productId: number) {
    this.adding[productId] = true;
    // get current userId if your CartService requires it — in our earlier code, addToCart accepts userId|null
    // Here we pass null so CartService uses AuthService internally (or you can pass actual userId)
    this.cartService.addToCart(productId, 1).subscribe({
      next: (cart) => {
        this.adding[productId] = false;
        // optionally show toast
        alert('Added to cart');
      },
      error: (err) => {
        console.error('Add to cart failed', err);
        this.adding[productId] = false;
        alert('Failed to add to cart');
      }
    });
  }

  imgUrl(path?: string) {
    if (!path) return '/assets/placeholder.png';
    if (/^https?:\/\//i.test(path)) return path;
    // return as-is (proxy configured) or prefix base in production
    return path.startsWith('/') ? path : '/' + path;
  }

  onImgError(event: any) {
    event.target.src = '/assets/placeholder.png';
  }
}
