export type Category = 'Fertilizer' | 'Seed' | 'Feed' | 'Other';

export interface Product {
  id: string;
  name: string;
  category: Category;
  stock: number;
  unit: string;
  purchasePrice: number;
  salePrice: number;
}

export interface Transaction {
  id: string;
  type: 'Sale' | 'Purchase';
  productId: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  customerName?: string;
  isCredit: boolean;
  paidAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive means they owe us
}
