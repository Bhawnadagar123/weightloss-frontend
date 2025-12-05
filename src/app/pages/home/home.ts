import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Blog } from '../../models/blog.model';
import { Product } from '../../models/product.model';
import { BlogService } from '../../services/blog';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';

// src/app/pages/home/home.ts (only the slides part shown)
interface SlideMobile {
  bgColor: string;
  productImage: string;
  caption: string;
  sub: string;
}

interface Slide {
  image: string;
  title?: string;      // used on desktop slide overlay
  subtitle?: string;   // used on desktop slide overlay
  mobile: SlideMobile; // used for mobile colored-card layout
}
@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {

  // Featured product slider state
fpIndex = 0;
fpAutoInterval: any = null;
fpAutoMs = 3500;
fpDragging = false;
fpTouchStartX: number | null = null;
fpTouchDelta = 0;
  
  slides: Slide[] = [
  {
    image: '/assets/banner3.PNG',
    title: '',
    subtitle: '',
    mobile: {
      bgColor: '#ff8a65',
      productImage: '/assets/combo1.jpeg',
      caption: 'Discover Our Natural',
      sub: 'Gentle, Effective Products'
    }
  },
  {
    image: '/assets/diwali-banner.png',
    title: '',
    subtitle: '',
    mobile: {
      bgColor: '#60ab6f',
      productImage: '/assets/combo2.jpeg',
      caption: 'Experience Unparalleled Comfort And Confidence Daily',
      sub: 'Prioritize Your Well-Being With Our Natural Products'
    }
  },
  {
    image: '/assets/banner2.png',
    title: 'EMBRACE CONFIDENCE WITH VISIBLE RESULTS',
    subtitle: 'ON BEST DISCOUNTED PACKAGES',
    mobile: {
      bgColor: '#1e88e5',
      productImage: '/assets/combo3.jpeg',
      caption: 'Embrace Confidence With Visible Results',
      sub: 'On Best Discounted Packages'
    }
  },
  {
    image: '/assets/medical-banner.png',
    title: '',
    subtitle: '',
    mobile: {
      bgColor: '#7e57c2',
      productImage: '/assets/combo4.jpg',
      caption: 'Exclusive Deal: Flat 40% Off On All Packages',
      sub: 'Limited Time Offer. Shop Now! To Avail The Discount'
    }
  }
];
  

  features = [
    { icon: '/assets/Natural_Products.png', title: '100% Natural', text: 'Made with safe, herbal, and natural ingredients.' },
    { icon: '/assets/Expert_Approved.png', title: 'Expert Approved', text: 'Backed by nutritionists & fitness experts.' },
    { icon: '/assets/Happy_Customers.png', title: '10,000+ Customers', text: 'Trusted by thousands who transformed their lives.' },
    { icon: '/assets/Shipping_Service.png', title: 'Shipping Service', text: 'Fast & reliable delivery across India.' }
  ];

  testimonials = [
    { img: '/assets/Girl_icon.png', quote: 'I lost 12kg in 3 months! The products are natural and easy to follow.', name: 'Bhawna D.', stars: '★★★★★' },
    { img: '/assets/Girl_icon.png', quote: 'Gained healthy weight and muscle in just 8 weeks. Highly recommend!', name: 'Sonia D.', stars: '★★★★★' },
    { img: '/assets/Girl_icon.png', quote: 'Finally achieved my dream body. Loved the support and diet tips!', name: 'Shikha D.', stars: '★★★★☆' }
  ];

  featuredProducts: Product[] = [];
  featuredBlogs: Blog[] = [];
  blogPlaceholder = '/assets/Fat_Burning.png';

  currentIndex = 0;
  interval: any;

  // placeholder userId until auth is integrated
  readonly userId = 101;

  constructor(
    private productService: ProductService,
    private blogService: BlogService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.startAutoSlide();
    this.loadFeaturedProducts();
    this.loadFeaturedBlogs();
    this.startFpAuto();
    // optional: refresh cart count in navbar by calling cartService.getCart(...)
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    this.stopFpAuto();
  }


// controls
nextFp() {
  if (!this.featuredProducts?.length) return;
  this.fpIndex = (this.fpIndex + 1) % this.featuredProducts.length;
}
prevFp() {
  if (!this.featuredProducts?.length) return;
  this.fpIndex = (this.fpIndex - 1 + this.featuredProducts.length) % this.featuredProducts.length;
}
goToFp(i: number) {
  if (!this.featuredProducts?.length) return;
  this.fpIndex = i % this.featuredProducts.length;
}
// autoplay
startFpAuto() {
  this.stopFpAuto();
  this.fpAutoInterval = setInterval(() => this.nextFp(), this.fpAutoMs);
}
stopFpAuto() {
  if (this.fpAutoInterval) {
    clearInterval(this.fpAutoInterval);
    this.fpAutoInterval = null;
  }
}

// touch handlers for swipe
fpTouchStart(ev: TouchEvent) {
  this.fpDragging = true;
  this.fpTouchStartX = ev.touches?.[0]?.clientX ?? null;
  this.fpTouchDelta = 0;
  this.stopFpAuto();
}
fpTouchMove(ev: TouchEvent) {
  if (!this.fpDragging || this.fpTouchStartX == null) return;
  const x = ev.touches?.[0]?.clientX ?? 0;
  this.fpTouchDelta = x - this.fpTouchStartX;
  // optional: you may apply transform while dragging for better feel
}
fpTouchEnd(_ev: TouchEvent) {
  if (!this.fpDragging) return;
  this.fpDragging = false;
  const delta = this.fpTouchDelta;
  this.fpTouchDelta = 0;
  this.fpTouchStartX = null;

  if (Math.abs(delta) > 40) {
    if (delta < 0) this.nextFp();
    else this.prevFp();
  }
  // restart autoplay
  this.startFpAuto();
}
  /* SLIDER */
  startAutoSlide() {
    this.interval = setInterval(() => this.nextSlide(), 4500);
  }
  nextSlide() { this.currentIndex = (this.currentIndex + 1) % this.slides.length; }
  prevSlide() { this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length; }
  goToSlide(index: number) { this.currentIndex = index; }

  /* DATA LOADERS */
  loadFeaturedProducts() {
    // fetch all products and pick top 6 for featured (or backend can support ?featured)
    this.productService.getAll().subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.featuredProducts = res.slice(0, 6);
        }
      },
      error: (err) => console.error('Failed to load products', err)
    });
  }

  loadFeaturedBlogs() {
    this.blogService.featured().subscribe({
      next: (res) => {
        this.featuredBlogs = Array.isArray(res) ? res.slice(0, 6) : [];
      },
      error: (err) => console.error('Failed to load blogs', err)
    });
  }

  /* CART */
  addToCart(productId: number) {
    this.cartService.addToCart(this.userId, productId, 1).subscribe({
      next: (cart) => {
        alert('Added to cart — Total ₹' + (cart?.grandTotal ?? '0'));
        // Optionally refresh navbar cart count via CartService or event bus
      },
      error: (err) => {
        console.error('Add to cart failed', err);
        alert('Failed to add to cart. Try again.');
      }
    });
  }

  /* helper to build image url when showing thumbnail */
imgUrl(path?: string) {
  // fallback
  if (!path) return '/assets/placeholder.png';

  // if full URL already
  if (path.startsWith('http')) return path;

  // ensure no leading slash problem
  path = path.replace(/^\//, '');

  // backend base URL from environment.ts
  const api = environment.apiBase; // example: "http://localhost:8080"

  // final: http://localhost:8080/files/products/xxxxx.jpg
  return `${api}/${path}`;
}

onImgError(event: any) {
  event.target.src = '/assets/Slim_belly_fit1.jpg';
}
  shorten(text?: string | null, max = 140) {
    if (!text) return '';
    const str = text.replace(/<\/?[^>]+(>|$)/g, ''); // strip HTML tags
    return str.length <= max ? str : str.slice(0, max).trim() + '...';
  }
}
