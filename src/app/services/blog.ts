import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Blog } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private base = environment.apiBase;
  constructor(private http: HttpClient) {}

  list(page = 0, size = 3): Observable<any> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<any>(`${this.base}/api/blogs`, { params });
  }

  search(q: string, page = 0, size = 3) {
    const params = new HttpParams().set('q', q).set('page', String(page)).set('size', String(size));
    return this.http.get<any>(`${this.base}/api/blogs/search`, { params });
  }

  featured(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.base}/api/blogs/featured`);
  }
}
