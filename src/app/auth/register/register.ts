import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-register',
  imports: [FormsModule,RouterModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}


// inside class
onSubmit(e: Event) {
  e.preventDefault();
  this.error = null;
  this.success = null;
  this.loading = true;

  if (!this.name || !this.email || !this.password) {
    this.loading = false;
    this.error = 'All fields required';
    return;
  }

  this.auth.register(this.name, this.email, this.password)
    .pipe(finalize(() => { this.loading = false; }))
    .subscribe({
      next: (res) => {
        console.debug('register response', res);
        // your backend returns plain text like "User registered" or "Email already in use"
        // many backends return a string in res (not JSON). Handle both.
        let msg = 'Account created. Please login.';
        if (typeof res === 'string') {
          msg = res;
        } else if (res && (res.message || res.msg)) {
          msg = (res.message || res.msg);
        }
        // if msg indicates email already exists, show error instead
        if (/email already/i.test(msg)) {
          this.error = msg;
          return;
        }

        this.success = msg || 'Account created. Please login.';
        // auto-redirect after a short delay
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        console.error('Register error ->', err.error.text);
        const msg = err?.error?.text || err?.error || err?.message || 'Registration failed';
        this.error = msg;
      }
    });
}

clearMessages() {
  this.error = null;
  this.success = null;
}

}