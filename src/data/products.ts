import { 
  createProductCatalog, 
  getCatalogProductById, 
  getCatalogProductsByCategory, 
  searchCatalogProducts 
} from '@/lib/productCatalog';
import type { Product, ProductCategory } from '@/types/products';

export const products: Product[] = createProductCatalog();

export const getProductById = (id: string): Product | undefined => {
  return getCatalogProductById(id);
};

export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return getCatalogProductsByCategory(category);
};

export const searchProducts = (query: string): Product[] => {
  return searchCatalogProducts(query);
};
