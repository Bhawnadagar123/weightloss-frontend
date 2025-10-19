import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Blog } from '../../models/blog.model';
import { Product } from '../../models/product.model';
import { BlogService } from '../../services/blog';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, OnDestroy {
  slides = [
    { image: '/assets/banner1.png', title: '🔥 Flat 20% Off', subtitle: 'On all weight loss products' },
    { image: '/assets/banner2.png', title: '🌿 100% Natural', subtitle: 'Safe and effective weight loss solutions' },
    { image: '/assets/banner3.PNG', title: '🚚 Free Shipping', subtitle: 'On orders above Rs. 2600' }
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
  blogPlaceholder = '/assets/blog_placeholder.jpg';

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
    // optional: refresh cart count in navbar by calling cartService.getCart(...)
  }

  ngOnDestroy() {
    clearInterval(this.interval);
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

  /* HELPERS */
  imgUrl(path?: string) {
    if (!path) return '/assets/placeholder.png';
    return path.startsWith('http') ? path : `${environment.apiBase}${path}`;
  }

  shorten(text?: string | null, max = 140) {
    if (!text) return '';
    const str = text.replace(/<\/?[^>]+(>|$)/g, ''); // strip HTML tags
    return str.length <= max ? str : str.slice(0, max).trim() + '...';
  }
}
