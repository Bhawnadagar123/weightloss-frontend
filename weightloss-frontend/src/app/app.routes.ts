import { Routes } from '@angular/router';
import { Products } from './pages/products/products';
import { Blog } from './pages/blog/blog';
import { ContactUs } from './pages/contact-us/contact-us';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';

export const routes: Routes = [

     { path: '', component: Home },
     {path: 'products', component: Products},
     {path: 'blog', component: Blog},
     {path: 'contact-us', component: ContactUs},
     {path: 'login', component: Login},

];