import { Routes } from '@angular/router';
import { Contact } from './pages/contact/contact';
import { About } from './pages/about/about';
import { SuccessStories } from './pages/success-stories/success-stories';
import { Blogs } from './pages/blogs/blogs';
import { Shop } from './pages/shop/shop';
import { Home } from './pages/home/home';
import { ProductDetail } from './pages/shop/product-detail/product-detail';
import { ProductList } from './pages/shop/product-list/product-list';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { OrderConfirmation } from './pages/order-confirmation/order-confirmation';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'shop', component: Shop },
  { path: 'product-detail', component: ProductDetail },
  { path: 'products/:id', component: ProductDetail },
  {path: 'product-list', component: ProductList},
  { path: 'blogs', component: Blogs },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'cart', component: Cart },
  { path: 'success-stories', component: SuccessStories },
  { path: 'about', component: About },
  { path: 'contact', component: Contact},
  { path: 'checkout', component: Checkout },
{ path: 'order-confirmation/:id', component: OrderConfirmation },
];
