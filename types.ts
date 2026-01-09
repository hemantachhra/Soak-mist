
export type Category = 'Raw Material' | 'Packaging' | 'Finished Good';

export interface StockItem {
  id: string;
  name: string;
  category: Category;
  currentStock: number; // in grams for chemicals, in units for pumps/boxes
  unit: string;
  bufferStock: number;
}

export interface RecipeItem {
  itemId: string;
  amountPerUnit: number; // grams or count per individual piece (e.g. 1 pump per mist)
}

export interface Product {
  id: 'mist' | 'soak';
  name: string;
  pcsPerBox: number;
  weightPerPc: number; // grams (e.g. 30g for mist)
  recipe: RecipeItem[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Purchase' | 'Production' | 'Sale';
  itemId?: string; // For purchase
  productId?: 'mist' | 'soak'; // For production and sale (since we sell by box now)
  quantity: number; // Always in Boxes for production/sale, or Raw Units for purchase
  timestamp: number;
}

export interface AppState {
  inventory: StockItem[];
  transactions: Transaction[];
  products: Product[];
}
