import { Product, ProductFilter, AddOn } from '@/types/products';
import { getRecommendedCatalogProducts, getFeaturedCatalogProducts } from '@/lib/productCatalog';

export function filterProducts(products: Product[], filter: ProductFilter): Product[] {
  return products.filter(product => {
    // Category filter
    if (filter.category && product.category !== filter.category) {
      return false;
    }

    // Age range filter
    if (filter.ageRange && product.ageRange !== filter.ageRange) {
      return false;
    }

    // Location filter
    if (filter.location && product.location !== filter.location) {
      return false;
    }

    // Price range filter
    if (filter.priceRange) {
      if (product.price < filter.priceRange.min || product.price > filter.priceRange.max) {
        return false;
      }
    }

    // Search query filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = [
        product.name,
        product.description,
        product.shortDescription,
        ...product.features,
        ...product.tags
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => 
        product.tags.some(productTag => 
          productTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
}

export function getRecommendedProducts(products: Product[], currentProduct: Product, limit = 3): Product[] {
  return getRecommendedCatalogProducts(currentProduct, limit);
}

export function getProductsByAgeGroup(products: Product[], ageGroup: 'young' | 'middle' | 'teen'): Product[] {
  return products.filter(product => {
    const ageRange = product.ageRange.toLowerCase();
    
    switch (ageGroup) {
      case 'young': // 5-8 years
        return ageRange.includes('5') || ageRange.includes('6') || ageRange.includes('7') || ageRange.includes('8');
      case 'middle': // 9-12 years
        return ageRange.includes('9') || ageRange.includes('10') || ageRange.includes('11') || ageRange.includes('12');
      case 'teen': // 13+ years
        return ageRange.includes('13') || ageRange.includes('14') || ageRange.includes('15') || ageRange.includes('16');
      default:
        return true;
    }
  });
}

export function getFeaturedProducts(products: Product[], limit = 6): Product[] {
  return getFeaturedCatalogProducts(limit);
}

export function calculateTotalPrice(product: Product, addOns?: { id: string; quantity: number }[]): number {
  let total = product.price;
  
  if (addOns && product.addOns) {
    addOns.forEach(selectedAddOn => {
      const addOn = product.addOns!.find(ao => ao.id === selectedAddOn.id);
      if (addOn) {
        total += addOn.price * selectedAddOn.quantity;
      }
    });
  }
  
  return total;
}
