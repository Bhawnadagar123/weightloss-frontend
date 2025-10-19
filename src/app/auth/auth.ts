import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule ],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {
  isLogin: boolean = true;  // Default: Login mode

  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  toggleAuthMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit() {
    if (this.isLogin) {
      console.log('Logging in with', this.user.email, this.user.password);
      // 👉 Call Login API here
    } else {
      if (this.user.password !== this.user.confirmPassword) {
        alert("Passwords don't match!");
        return;
      }
      console.log('Signing up with', this.user);
      // 👉 Call Signup API here
    }
  }

}
