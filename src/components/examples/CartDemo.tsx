'use client';

import { Cart } from '@/components/cart';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/Button';

// Sample products for demo
const sampleProducts: Product[] = [
  {
    id: 'camp-1',
    name: 'Summer Science Camp',
    description: 'A fun week-long science camp for curious minds',
    shortDescription: 'Week-long science camp',
    price: 350,
    category: 'camps',
    ageRange: '8-12',
    duration: '5 days',
    location: 'Neutral Bay',
    availability: {
      type: 'weekdays',
      timeSlots: [
        { start: '09:00', end: '15:00' }
      ]
    },
    features: ['Hands-on experiments', 'Science projects', 'Educational games'],
    images: ['/images/camps1.jpeg'],
    maxCapacity: 20,
    tags: ['science', 'education', 'hands-on']
  },
  {
    id: 'birthday-1',
    name: 'Robot Building Birthday Party',
    description: 'Build and program robots for an unforgettable birthday celebration',
    shortDescription: 'Robot building party',
    price: 450,
    category: 'birthdays',
    ageRange: '6-14',
    duration: '2 hours',
    location: 'Neutral Bay',
    availability: {
      type: 'any-day',
      timeSlots: [
        { start: '10:00', end: '12:00' },
        { start: '14:00', end: '16:00' }
      ]
    },
    features: ['Robot building', 'Programming basics', 'Take home robot'],
    images: ['/images/birthday-parties-1.jpg'],
    maxCapacity: 12,
    addOns: [
      {
        id: 'addon-1',
        name: 'Extra Robot Kit',
        description: 'Additional robot kit for party guest',
        price: 25,
        maxQuantity: 5
      }
    ],
    tags: ['robotics', 'programming', 'birthday']
  },
  {
    id: 'subscription-1',
    name: 'Ignite Weekly Classes',
    description: 'Weekly after-school STEAM classes to ignite creativity',
shortDescription: 'Weekly STEAM classes',
    price: 120,
    category: 'subscriptions',
    ageRange: '7-16',
    duration: '1.5 hours per week',
    location: 'Neutral Bay',
    availability: {
      type: 'weekly',
      weekDays: [1, 2, 3, 4], // Mon-Thu
      timeSlots: [
        { start: '16:00', end: '17:30' },
        { start: '17:45', end: '19:15' }
      ]
    },
    features: ['STEAM projects', 'Creative problem solving', 'Peer collaboration'],
    images: ['/images/memberships.jpg'],
    maxCapacity: 15,
    tags: ['subscription', 'weekly', 'steam']
  }
];

export const CartDemo = () => {
  const { addToCart, summary, items } = useCart();

  const handleAddToCart = (product: Product) => {
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + 7); // Next week
    
    const selectedTimeSlot = product.availability.timeSlots?.[0];
    
    addToCart(product, {
      quantity: 1,
      selectedDate: product.category === 'subscriptions' ? undefined : selectedDate,
      selectedTimeSlot: selectedTimeSlot,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TinkerTank Cart System Demo
        </h1>
        <p className="text-gray-600">
          Try adding products to cart and managing student details
        </p>
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Current Cart</h3>
          <p className="text-blue-800">
            {summary.itemCount} items • {summary.studentCount} students • ${summary.total.toFixed(2)}
          </p>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sampleProducts.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
              <span className="text-gray-400">Product Image</span>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {product.shortDescription}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>Ages {product.ageRange}</span>
              <span>{product.duration}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">
                ${product.price}
              </span>
              <Button
                onClick={() => handleAddToCart(product)}
                size="sm"
              >
                Add to Cart
              </Button>
            </div>
            
            {product.addOns && product.addOns.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Add-ons available
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cart Component */}
      <Cart />

      {/* Usage Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Add products to cart using the buttons above</li>
          <li>Click the cart icon (top right) to review your cart</li>
          <li>For camps and birthday parties, add student details</li>
          <li>Adjust quantities and manage students as needed</li>
          <li>View validation errors and checkout when ready</li>
        </ol>
      </div>
    </div>
  );
};
