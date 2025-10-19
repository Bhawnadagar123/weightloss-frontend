import { Routes } from '@angular/router';
import { Contact } from './pages/contact/contact';
import { About } from './pages/about/about';
import { SuccessStories } from './pages/success-stories/success-stories';
import { Blogs } from './pages/blogs/blogs';
import { Shop } from './pages/shop/shop';
import { Home } from './pages/home/home';
import { ProductDetail } from './pages/shop/product-detail/product-detail';
import { ProductList } from './pages/shop/product-list/product-list';
import { Auth } from './auth/auth';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'shop', component: Shop },
  { path: 'product-detail', component: ProductDetail },
  {path: 'product-list', component: ProductList},
  {path: 'auth', component: Auth},
  { path: 'blogs', component: Blogs },
  { path: 'success-stories', component: SuccessStories },
  { path: 'about', component: About },
  { path: 'contact', component: Contact},
];
