import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail {


images: string[] = [
    '/assets/Slim_belly_fit1.jpg',
    '/assets/Slim_belly_fit2.jpg',
    '/assets/Slim_belly_fit1.jpg',
    '/assets/Slim_belly_fit2.jpg',
    '/assets/Slim_belly_fit1.jpg',
    '/assets/Slim_belly_fit2.jpg'
  ];

  currentIndex: number = 0;

  setImage(index: number) {
    this.currentIndex = index;
  }

  prevImage() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  nextImage() {
    this.currentIndex =
      (this.currentIndex + 1) % this.images.length;
  }
  product = {
    name: "SLIM BELLY FIT, Lose Weight, Gain Balance",
    image: "/assets/Slim_belly_fit1.jpg",
    
    offerPrice: 1299,
    mrp: 2499,
    shortDescription: "Tired of stubborn belly fat holding you back? Slim Belly Fit is a natural herbal formula designed to support effective weight loss, boost metabolism, and bring balance to your body—without harsh chemicals or side effects. Take the first step today—Lose Weight, Gain Balance with Slim Belly Fit! ",
    orderNow: "Order now & get it delivered soon.",
    benefits: [
      "Burns stubborn belly fat naturally",
      "Boosts metabolism & energy levels",
      "Improves digestion and gut health",
      "Reduces bloating & water retention",
      "Promotes overall body balance and confidence"
    ],
    ingredients: [
      "Garcinia Cambogia – Suppresses appetite & prevents fat storage",
      "Green Tea Extract – Rich in antioxidants, boosts metabolism",
      "L-Carnitine – Enhances fat burning & energy",
      "Ayurvedic Herbs – Support digestion and body detox"
    ],
    usage: [
    "Take 2 capsules daily with water after meals, follow a balanced diet & light exercise for best results"],
    bundles: [
      { name: "1 Month Pack – Starter for new users", price: 899 },
      { name: "3 Month Pack – Best for visible results", price: 2499 },
      { name: "Combo Pack – Share with family or double your results", price: 2999 }
    ],
    testimonials: [
      { review: "Lost 5 kg in 1 month, feeling lighter and more active!", author: "Riya, 27" },
      { review: "Best product ever! No side effects, only results.", author: "Arjun, 32" }
    ]
  }

   quantity: number = 1;

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    console.log(`Added ${this.quantity} items to cart`);
    // Later: integrate with Cart Service
  }
}
