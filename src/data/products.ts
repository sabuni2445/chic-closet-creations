
import dress1 from "@/assets/dress1.jpg";
import dress2 from "@/assets/dress2.jpg";
import dress3 from "@/assets/dress3.jpg";
import dress4 from "@/assets/dress4.jpg";
import dress5 from "@/assets/dress5.jpg";
import dress6 from "@/assets/dress6.jpg";
import dress7 from "@/assets/dress7.jpg";
import dress8 from "@/assets/dress8.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  tag?: string;
  featured?: boolean;
  description: string;
  category: string;
  modelUrl?: string; // Placeholder for 3D model path
}

export const products: Product[] = [
  { 
    id: "1", 
    name: "Blush Evening Gown", 
    price: 289, 
    image: dress1, 
    tag: "New", 
    featured: true,
    category: "Evening",
    description: "A breathtaking blush evening gown featuring delicate lace detailing and a flowing silk skirt. Perfect for gala events and formal celebrations."
  },
  { 
    id: "2", 
    name: "Ivory Satin Dress", 
    price: 199, 
    image: dress2,
    category: "Cocktail",
    description: "Elegant ivory satin dress with a sophisticated silhouette and subtle sheen. A timeless piece for any cocktail party."
  },
  { 
    id: "3", 
    name: "Gold Champagne Maxi", 
    price: 349, 
    image: dress3, 
    tag: "Best Seller",
    category: "Evening",
    description: "Radiant gold champagne maxi dress designed to turn heads. Features a plunging neckline and exquisite beadwork."
  },
  { 
    id: "4", 
    name: "Dusty Rose Midi", 
    price: 179, 
    image: dress4,
    category: "Casual",
    description: "Charming dusty rose midi dress with a flattering wrap design and floral accents. Ideal for garden parties and brunch."
  },
  { 
    id: "5", 
    name: "Noir Velvet Gown", 
    price: 399, 
    image: dress5, 
    tag: "Exclusive", 
    featured: true,
    category: "Evening",
    description: "Luxurious noir velvet gown that exudes elegance and mystery. Features a high slit and structured bodice."
  },
  { 
    id: "6", 
    name: "Lavender Floral", 
    price: 159, 
    image: dress6,
    category: "Summer",
    description: "Lightweight lavender floral dress perfect for warm summer days. Breathable fabric and vibrant print."
  },
  { 
    id: "7", 
    name: "Emerald Silk Gown", 
    price: 329, 
    image: dress7,
    category: "Evening",
    description: "Stunning emerald silk gown with a rich color and smooth texture. A masterpiece of modern haute couture."
  },
  { 
    id: "8", 
    name: "Coral Wrap Dress", 
    price: 189, 
    image: dress8,
    category: "Summer",
    description: "Vibrant coral wrap dress that offers both comfort and style. A versatile addition to your summer wardrobe."
  },
];
