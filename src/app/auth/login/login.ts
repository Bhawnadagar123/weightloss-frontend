import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router, private cartService: CartService, private route:ActivatedRoute) {}


// inside your class
onSubmit(e: Event) {
  e.preventDefault();

  // start fresh
  this.error = null;
  this.loading = true;

  if (!this.email || !this.password) {
    this.loading = false;
    this.error = 'Email and password required';
    return;
  }

  this.auth.login(this.email, this.password)
    .pipe(finalize(() => { this.loading = false; }))
    .subscribe({
      next: (res) => {
  console.debug('login response', res);
  this.error = null;

  // token saved by AuthService.login -> tap()
  // broadcast already handled by AuthService.setToken()

  // refresh cart for new logged-in user (and update navbar cart count)
  // using cartService.getCart() without userId lets CartService resolve uid
  this.cartService.getCart().subscribe({
    next: () => {
      // optionally navigate after cart refreshed
      const next = this.route.snapshot.queryParams['next'] || '/';
      this.router.navigateByUrl(next);
      // this.router.navigateByUrl('/');
    },
    error: () => {
      // still navigate home even if cart fetch fails
      this.router.navigateByUrl('/');
    }
  });
},
      error: (err) => {
        console.error('Login error ->', err.text);
        // parse error message robustly
        const msg =
          err?.error?.message ||
          err?.error ||
          err?.message ||
          'Login failed. Check credentials.';
        this.error = msg;
      }
    });
}

// called from (input) on login fields:
clearMessages() {
  this.error = null;
}

}