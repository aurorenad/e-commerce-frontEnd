export type Category =
  | 'Smartphone'
  | 'Laptop'
  | 'Tablet'
  | 'Smartwatch'
  | 'Camera'
  | 'Gaming'
  | 'All';

export type Condition = 'Excellent' | 'Good' | 'Fair';

export interface Spec {
  label: string;
  value: string;
}

export interface Listing {
  id: string;
  deviceId: string;
  title: string;
  current_price: number;
  original_price: number;
  img: string;
  category: Category;
  condition: Condition;
  description: string;
  specs: Spec[];
  rating?: number;       // 1–5 star rating
  reviewCount?: number;  // number of reviews
}