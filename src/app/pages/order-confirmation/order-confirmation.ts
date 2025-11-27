import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order';

import { CommonModule, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css'
})
export class OrderConfirmation implements OnInit {
  orderId: number | null = null;
  order: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid order id';
      this.loading = false;
      return;
    }
    this.orderId = id;
    this.orderService.getOrder(id).subscribe({
      next: (res) => {
        this.order = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load order', err);
        this.error = 'Unable to load order details. You can check your orders later.';
        this.loading = false;
      }
    });
  }

  goHome() { this.router.navigate(['/']); }
  goOrders() { this.router.navigate(['/orders']); }
}