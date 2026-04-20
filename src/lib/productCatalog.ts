import { Product as LegacyProduct, ProductType, CampType, BirthdayPackageType, SubscriptionType } from '@/types/product';
import { formatPrice } from '@/lib/utils';

// Simplified product catalog for display and basic operations
export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  category: 'camps' | 'birthdays' | 'subscriptions' | 'ignite';
  ageRange: string;
  duration: string;
  location: string;
  features: string[];
  images: string[];
  maxCapacity?: number;
  availability: {
    type: 'weekdays' | 'any-day' | 'weekly' | 'flexible';
    timeSlots?: { start: string; end: string }[];
    weekDays?: number[];
  };
  addOns?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    maxQuantity?: number;
  }>;
  tags: string[];
  isSubscription?: boolean;
  studentInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    school?: string;
    medicalInfo?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
}

// Create TinkerTank product catalog
export const createProductCatalog = (): CatalogProduct[] => [
  // Day Camp
  {
    id: 'day-camp',
    name: 'Day Camp',
    description: 'Join us for an exciting day of coding, robotics, and tech adventures! Our day camps provide the perfect introduction to STEAM learning in a fun, engaging environment.',
    shortDescription: 'Daily tech adventures for young innovators',
    price: 109.99,
    category: 'camps',
    ageRange: '6-16 years',
    duration: '6 hours',
    location: 'Neutral Bay',
    availability: {
      type: 'weekdays',
      timeSlots: [{ start: '09:00', end: '15:00' }],
      weekDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    features: [
      'Hands-on coding projects',
      'Robot building and programming',
      '3D design challenges',
      'Team collaboration games',
      'Take-home projects',
      'Healthy snacks included'
    ],
    images: ['/images/camps1.jpeg', '/images/camps2.jpeg'],
    maxCapacity: 20,
    tags: ['coding', 'robotics', '3d-design', 'beginner-friendly']
  },

  // All Day Camp
  {
    id: 'all-day-camp',
    name: 'All Day Camp',
    description: 'Extended learning with our comprehensive all-day program! Includes everything from day camp plus additional project time, advanced challenges, and extended care.',
    shortDescription: 'Extended tech learning with advanced projects',
    price: 149.99,
    category: 'camps',
    ageRange: '6-16 years',
    duration: '8 hours',
    location: 'Neutral Bay',
    availability: {
      type: 'weekdays',
      timeSlots: [{ start: '09:00', end: '17:00' }],
      weekDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    features: [
      'All Day Camp benefits',
      'Extended project time',
      'Advanced coding challenges',
      'Individual mentoring',
      'Flexible pickup times',
      'Portfolio building'
    ],
    images: ['/images/camps3.jpeg', '/images/camps4.jpeg'],
    maxCapacity: 16,
    tags: ['coding', 'robotics', '3d-design', 'advanced', 'extended-care']
  },

  // Birthday Parties
  {
    id: 'robotics-party',
    name: 'Robotics Party',
    description: 'Fantastic builds and exciting challenges! Kids will design, build and program their own robots in this hands-on birthday celebration.',
    shortDescription: 'Fantastic builds and exciting challenges',
    price: 450,
    category: 'birthdays',
    ageRange: '6+ years',
    duration: '2 hours',
    location: 'In-home or your venue',
    availability: {
      type: 'any-day',
      timeSlots: [
        { start: '10:00', end: '12:00' },
        { start: '14:00', end: '16:00' },
        { start: '16:30', end: '18:30' }
      ]
    },
    features: [
      'Hands-on robot building',
      'Exciting challenges and competitions',
      'Age-appropriate for 6+',
      '10 students included (inc. birthday child)',
      'We come to your home or venue',
      'Expert party host provided',
      'All materials included'
    ],
    images: ['/images/battle.jpg', '/images/workshop.jpg'],
    maxCapacity: 10,
    addOns: [
      {
        id: 'extra-kids',
        name: 'Extra Kids',
        description: 'Add additional kids to your party',
        price: 225,
        maxQuantity: 1
      }
    ],
    tags: ['robotics', 'building', 'challenges', 'hands-on']
  },

  {
    id: 'coding-party',
    name: 'Coding Party',
    description: 'Explore the world of AI, Minecraft and Scratch in this interactive coding birthday party! Kids will create, play and learn together.',
    shortDescription: 'Explore AI, Minecraft and Scratch',
    price: 450,
    category: 'birthdays',
    ageRange: '6+ years',
    duration: '2 hours',
    location: 'In-home or your venue',
    availability: {
      type: 'any-day',
      timeSlots: [
        { start: '10:00', end: '12:00' },
        { start: '14:00', end: '16:00' },
        { start: '16:30', end: '18:30' }
      ]
    },
    features: [
      'AI, Minecraft and Scratch adventures',
      'Creative coding challenges',
      'Age-appropriate for 6+',
      '10 students included (inc. birthday child)',
      'We come to your home or venue',
      'Expert party host provided',
      'All materials included'
    ],
    images: ['/images/dropin.jpg', '/images/code-1.jpg'],
    maxCapacity: 10,
    addOns: [
      {
        id: 'extra-kids',
        name: 'Extra Kids',
        description: 'Add additional kids to your party',
        price: 225,
        maxQuantity: 1
      }
    ],
    tags: ['coding', 'AI', 'minecraft', 'scratch']
  },

  // Ignite Subscriptions
  {
    id: 'in-school-ignite',
    name: 'In-School Ignite Program',
    description: 'Weekly tech education delivered directly at your school! Our certified instructors bring engaging STEAM activities right to the classroom.',
    shortDescription: 'Weekly tech education at your school',
    price: 25,
    category: 'subscriptions',
    ageRange: '5-16 years',
    duration: '1.5 hours weekly',
    location: 'Your school',
    availability: {
      type: 'weekly',
      weekDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    features: [
      'Certified instructor visits',
      'Age-appropriate curriculum',
      'Classroom-ready activities',
      'Progress tracking',
      'No equipment needed',
      'Flexible scheduling',
      'Term-based programs'
    ],
    images: ['/images/memberships.jpg', '/images/after-schoolers-3.png'],
    maxCapacity: 20,
    tags: ['weekly', 'in-school', 'curriculum', 'beginner-friendly']
  },

  {
    id: 'drop-off-ignite',
    name: 'Drop-Off Studio Ignite',
    description: 'Weekly hands-on sessions at our purpose-built studio! Kids explore advanced projects with access to professional equipment and small group instruction.',
    shortDescription: 'Weekly studio sessions with pro equipment',
    price: 39.99,
    category: 'subscriptions',
    ageRange: '5-16 years',
    duration: '2 hours weekly',
    location: 'Neutral Bay Studio',
    availability: {
      type: 'weekly',
      timeSlots: [
        { start: '15:30', end: '17:30' },
        { start: '10:00', end: '12:00' }
      ],
      weekDays: [1, 2, 3, 4, 5, 6] // Monday to Saturday
    },
    features: [
      'Small group sessions',
      'Professional equipment access',
      'Project-based learning',
      'Individual skill progression',
      '3D printers and robotics kits',
      'Portfolio development',
      'Showcase opportunities'
    ],
    images: ['/images/dropin.jpg', '/images/tinkerers1.jpg'],
    maxCapacity: 20,
    tags: ['weekly', 'studio', 'advanced', 'small-groups']
  },

  {
    id: 'school-pickup-ignite',
    name: 'School Pickup Ignite',
    description: 'Convenient after-school program with pickup service! We collect kids from participating schools and bring them to our studio for immersive tech learning.',
    shortDescription: 'After-school pickup + studio learning',
    price: 54.99,
    category: 'subscriptions',
    ageRange: '5-16 years',
    duration: '2.5 hours weekly',
    location: 'Selected schools → Neutral Bay Studio',
    availability: {
      type: 'weekly',
      timeSlots: [{ start: '15:00', end: '17:30' }],
      weekDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    features: [
      'Safe school pickup service',
      'Extended learning time',
      'Homework support included',
      'Healthy snack provided',
      'Small group instruction',
      'Progress reports for parents',
      'Holiday program access'
    ],
    images: ['/images/after-schoolers-3.png', '/images/tinkerers2.jpg'],
    maxCapacity: 20,
    tags: ['weekly', 'pickup', 'after-school', 'extended-care']
  }
];

// Utility functions for the catalog
export const getCatalogProductById = (id: string): CatalogProduct | undefined => {
  return createProductCatalog().find(product => product.id === id);
};

export const getCatalogProductsByCategory = (category: 'camps' | 'birthdays' | 'subscriptions' | 'ignite'): CatalogProduct[] => {
  return createProductCatalog().filter(product => product.category === category);
};

export const searchCatalogProducts = (query: string): CatalogProduct[] => {
  const products = createProductCatalog();
  const lowercaseQuery = query.toLowerCase();
  
  return products.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.shortDescription.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getRecommendedCatalogProducts = (currentProduct: CatalogProduct, limit = 3): CatalogProduct[] => {
  const allProducts = createProductCatalog();
  const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);
  
  // Score products based on similarity
  const scoredProducts = otherProducts.map(product => {
    let score = 0;
    
    // Same category gets higher score
    if (product.category === currentProduct.category) score += 10;
    
    // Similar age range
    if (product.ageRange === currentProduct.ageRange) score += 5;
    
    // Same location
    if (product.location === currentProduct.location) score += 3;
    
    // Shared tags
    const sharedTags = product.tags.filter(tag => currentProduct.tags.includes(tag));
    score += sharedTags.length * 2;
    
    // Similar price range (within 50% of current product price)
    const priceDiff = Math.abs(product.price - currentProduct.price);
    const priceRange = currentProduct.price * 0.5;
    if (priceDiff <= priceRange) score += 2;
    
    return { product, score };
  });

  // Sort by score and return top products
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
};

export const getFeaturedCatalogProducts = (limit = 6): CatalogProduct[] => {
  const products = createProductCatalog();
  const categories = ['camps', 'birthdays', 'subscriptions'] as const;
  const featured = [];
  
  for (const category of categories) {
    const categoryProducts = products
      .filter(p => p.category === category)
      .sort((a, b) => {
        // Prioritize products with more features and reasonable pricing
        const scoreA = a.features.length + (a.price < 200 ? 2 : 0);
        const scoreB = b.features.length + (b.price < 200 ? 2 : 0);
        return scoreB - scoreA;
      });
    
    // Add up to 2 products from each category
    featured.push(...categoryProducts.slice(0, 2));
  }
  
  return featured.slice(0, limit);
};
