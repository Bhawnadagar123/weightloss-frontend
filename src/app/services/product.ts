import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  getAll(search?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Product[]>(`${this.base}/api/products`, { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/api/products/${id}`);
  }
}