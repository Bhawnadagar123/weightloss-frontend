export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UserCart {
  userId: number;
  items: CartItem[];
  grandTotal: number;
}