import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PlaceOrderReq {
  userId: number;
  paymentMethod: 'COD' | 'ONLINE' | string;
  shippingAddress: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  placeOrder(payload: PlaceOrderReq): Observable<any> {
    return this.http.post<any>(`${this.base}/api/orders/place`, payload, { withCredentials: true });
  }

  // optionally a get order by id if backend supports it
  getOrder(orderId: number) {
    return this.http.get<any>(`${this.base}/api/orders/${orderId}`);
  }
}
