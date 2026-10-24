export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year?: number;
  kmsDriven?: number;
  fuelType?: string;
  city?: string;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Session {
  token: string;
  user: User;
}

export interface InventoryHealth {
  models: number;
  units: number;
  value: number;
  lowStock: number;
  soldOut: number;
}

export interface PurchaseRecord {
  id: string;
  purchased_at: string;
  price: number;
  make: string;
  model: string;
  category?: string;
  fuelType?: string;
  city?: string;
  imageUrl?: string;
}

export interface FilterState {
  search: string;
  brand: string;
  category: string;
  fuel: string;
  maxPrice: string;
  modelYear: string;
  maxKm: string;
  sortBy: string;
}
