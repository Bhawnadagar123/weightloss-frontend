import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from "./components/footer/footer";
import { FloatingContact } from "./floating-contact/floating-contact";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, FloatingContact, HttpClientModule,FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ayur-herbals-app');
  constructor(private auth: AuthService, private router: Router) {
  router.events.subscribe(() => {
    if (!auth.isLoggedIn()) {
      window.dispatchEvent(new Event('authChanged'));
    }
  });
}
}
