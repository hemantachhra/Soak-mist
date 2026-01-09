
import { StockItem, Product } from './types';

export const INITIAL_INVENTORY: StockItem[] = [
  // Finished Goods (Stored in Boxes) - Must appear first in list
  { id: 'mist_finished', name: 'Mist Boxes (Finished)', category: 'Finished Good', currentStock: 0, unit: 'boxes', bufferStock: 10 },
  { id: 'soak_finished', name: 'Soak Boxes (Finished)', category: 'Finished Good', currentStock: 0, unit: 'boxes', bufferStock: 10 },

  // Shared Raw Materials
  { id: 'citric_acid', name: 'Citric Acid (Common)', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 5000 },
  
  // Mist Specific Raw Materials
  { id: 'water', name: 'Water', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 50000 },
  { id: 'colour_mist', name: 'Colour Mist (Orange/Yellow)', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 500 },
  { id: 'perfume_mist', name: 'Perfume (Mist)', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'rh40', name: 'RH40', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'phenoxytol', name: 'Phenoxytol', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'dmdm', name: 'DMDM', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'pps', name: 'PPS', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'mps', name: 'MPS', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  
  // Soak Specific Raw Materials
  { id: 'sodium_bicarb', name: 'Sodium Bi Carbonate', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 10000 },
  { id: 'starch', name: 'Starch', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 5000 },
  { id: 'salt', name: 'Salt', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 10000 },
  { id: 'colour_soak', name: 'Colour Soak (Red)', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 500 },
  { id: 'perfume_soak', name: 'Perfume Soak (Rose)', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 1000 },
  { id: 'rose_petals', name: 'Rose Petals', category: 'Raw Material', currentStock: 0, unit: 'g', bufferStock: 500 },

  // Packaging
  { id: 'mist_pump', name: 'Mist Pump', category: 'Packaging', currentStock: 0, unit: 'pcs', bufferStock: 5000 },
  { id: 'bottles', name: 'Bottles', category: 'Packaging', currentStock: 0, unit: 'pcs', bufferStock: 5000 },
  { id: 'labels', name: 'Labels', category: 'Packaging', currentStock: 0, unit: 'pcs', bufferStock: 5000 },
  { id: 'pouch', name: 'Pouch', category: 'Packaging', currentStock: 0, unit: 'pcs', bufferStock: 5000 },
  { id: 'boxes', name: 'Corrugated Outer Boxes', category: 'Packaging', currentStock: 0, unit: 'pcs', bufferStock: 100 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'mist',
    name: 'Mist',
    pcsPerBox: 260,
    weightPerPc: 30,
    recipe: [
      { itemId: 'water', amountPerUnit: 25 },
      { itemId: 'colour_mist', amountPerUnit: 0.1 },
      { itemId: 'perfume_mist', amountPerUnit: 1 },
      { itemId: 'rh40', amountPerUnit: 1 },
      { itemId: 'phenoxytol', amountPerUnit: 0.5 },
      { itemId: 'dmdm', amountPerUnit: 0.5 },
      { itemId: 'pps', amountPerUnit: 0.5 },
      { itemId: 'mps', amountPerUnit: 0.5 },
      { itemId: 'citric_acid', amountPerUnit: 0.9 },
      { itemId: 'mist_pump', amountPerUnit: 1 },
      { itemId: 'bottles', amountPerUnit: 1 },
      { itemId: 'labels', amountPerUnit: 1 },
    ]
  },
  {
    id: 'soak',
    name: 'Soak',
    pcsPerBox: 1040,
    weightPerPc: 5,
    recipe: [
      { itemId: 'sodium_bicarb', amountPerUnit: 1.5 },
      { itemId: 'starch', amountPerUnit: 1.0 },
      { itemId: 'citric_acid', amountPerUnit: 1.0 },
      { itemId: 'salt', amountPerUnit: 1.0 },
      { itemId: 'colour_soak', amountPerUnit: 0.1 },
      { itemId: 'perfume_soak', amountPerUnit: 0.2 },
      { itemId: 'rose_petals', amountPerUnit: 0.2 },
      { itemId: 'pouch', amountPerUnit: 1 },
    ]
  }
];
