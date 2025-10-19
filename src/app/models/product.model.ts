export interface Product {
  id: number;
  name: string;
  description?: string;
  subDescription?: string;
  price: number;
  mrp?: number;
  stock?: number;
  images: string[]; // relative paths e.g. /files/products/xxx.jpg
  category?: string;
}