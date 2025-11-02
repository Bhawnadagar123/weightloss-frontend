import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../services/cart';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit, OnDestroy {
share() {
throw new Error('Method not implemented.');
}
  product: Product | null = null;
  loading = true;
  error = false;

  // image gallery state
  currentIndex = 0;
  // store currently loaded product id so retry can work without args
  currentProductId: number | null = null;
  get currentImage() {
    return this.product?.images?.[this.currentIndex] || this.product?.images?.[0] || '/assets/placeholder.png';
  }

  // qty + adding state
  qty = 1;
  adding = false;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadProduct(id);
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadProduct(id?: number|string) {
    const pid = (id ?? this.currentProductId) as number | null;
    if (!pid) {
      console.warn('No product id to load');
      return;
    }

    // ensure currentProductId is updated
    this.currentProductId = +pid;
    this.loading = true;
    this.error = false;
    this.product = null;
    this.productService.getById(+pid).subscribe({
      next: (res) => {
        this.product = res;
        this.currentIndex = 0;
        this.qty = (this.product?.stock && this.product.stock > 0) ? 1 : 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // gallery controls
  goToImage(i: number) {
    if (!this.product?.images?.length) return;
    this.currentIndex = i;
  }
  prevImage() {
    if (!this.product?.images?.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.product.images.length) % this.product.images.length;
  }
  nextImage() {
    if (!this.product?.images?.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.product.images.length;
  }

 increaseQty() {
  if (!this.product) return;
  const max = (this.product.stock && this.product.stock > 0) ? this.product.stock : Number.MAX_SAFE_INTEGER;
  if (this.qty < max) this.qty++;
}

decreaseQty() {
  if (this.qty > 1) this.qty--;
}

onQtyInput(e: any) {
  let v = Number(e.target.value);
  if (isNaN(v) || v < 1) v = 1;
  if (this.product?.stock && v > this.product.stock) v = this.product.stock;
  this.qty = Math.floor(v);
}

  onAddToCart() {
    if (!this.product) return;
    this.adding = true;
    // safe, using component properties
const pid = this.product?.id;
if (!pid) {
  alert('Product not loaded yet.');
  return;
}
this.cartService.addToCart(pid, this.qty).subscribe({
      next: (cart) => {
        this.adding = false;
        // Optionally show toast / snackbar instead of alert
        alert('Product added to cart');
      },
      error: (err) => {
        console.error('Add to cart failed - status', err?.status, 'body', err?.error);
        this.adding = false;
         alert('Failed to add to cart: ' + (err?.error?.message || 'server error'));
      }
    });
  }

  onBuyNow() {
    // Add to cart then navigate to checkout (simple flow)
    if (!this.product) return;
    this.adding = true;
    // safe, using component properties
const pid = this.product?.id;
if (!pid) {
  alert('Product not loaded yet.');
  return;
}
this.cartService.addToCart(pid, this.qty).subscribe({
      next: (cart) => {
        this.adding = false;
        // navigate to /cart or /checkout as per your routing
        window.location.href = '/cart';
      },
      error: (err) => {
        console.error('Buy now failed', err);
        this.adding = false;
        alert('Failed to process Buy Now.');
      }
    });
  }

  // utils
  imgUrl(path?: string) {
    if (!path) return '/assets/placeholder.png';
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith('/') ? path : '/' + path;
  }

  onImgError(event: any) {
    event.target.src = '/assets/placeholder.png';
  }

  calcDiscount(mrp: number, price: number) {
    if (!mrp || mrp <= price) return 0;
    const d = Math.round(((mrp - price) / mrp) * 100);
    return d;
  }

  formatDescription(text?: string|null) {
    if (!text) return '';
    // If backend sends Markdown/HTML you may want to sanitize here.
    return text;
  }
}