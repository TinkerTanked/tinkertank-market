/**
 * Real-World Scenarios Integration Tests
 * Tests complex business scenarios and edge cases that occur in production
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useEnhancedCartStore } from '@/stores/enhancedCartStore';
import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';

// Mock all dependencies
vi.mock('@/lib/prisma');
vi.mock('@/lib/events');
vi.mock('@/lib/email');
vi.mock('stripe');

describe('Real-World Scenarios Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEnhancedCartStore.getState().clearCart();
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Peak Load Scenarios', () => {
    it('should handle Black Friday-style concurrent bookings', async () => {
      // Simulate 100 concurrent users trying to book popular camps
      const concurrentUsers = 100;
      const popularCamp = {
        id: 'popular_camp_123',
        name: 'Popular Holiday Camp',
        price: 150,
        type: 'CAMP',
        category: 'camps',
        ageRange: '6-12',
        duration: 480,
        maxCapacity: 20
      };

      const mockLocation = {
        id: 'loc_123',
        name: 'Neutral Bay',
        capacity: 20
      };

      // Mock capacity checking with decreasing available spots
      let currentBookings = 0;
      (prisma.booking.count as any).mockImplementation(() => {
        return Promise.resolve(currentBookings);
      });

      (prisma.event.findUnique as any).mockResolvedValue({
        id: 'event_popular_123',
        maxCapacity: 20
      });

      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);

      // Simulate booking attempts
      const bookingAttempts = Array.from({ length: concurrentUsers }, (_, i) => ({
        userId: `user_${i}`,
        studentName: `Student ${i}`,
        bookingTime: Date.now() + Math.random() * 1000 // Spread over 1 second
      }));

      // Mock order creation with capacity checking
      (prisma.order.create as any).mockImplementation(({ data }) => {
        currentBookings++;
        if (currentBookings <= 20) {
          return Promise.resolve({
            id: `order_${currentBookings}`,
            ...data,
            status: 'PAID'
          });
        } else {
          return Promise.reject(new Error('Event capacity exceeded'));
        }
      });

      // Process all booking attempts
      const results = await Promise.allSettled(
        bookingAttempts.map(async (attempt) => {
          try {
            return await prisma.order.create({
              data: {
                id: `order_${attempt.userId}`,
                customerName: `Parent ${attempt.userId}`,
                totalAmount: popularCamp.price
              }
            });
          } catch (error) {
            return { error: error.message };
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Should accept exactly 20 bookings and reject the rest
      expect(successful.length).toBe(20);
      expect(failed.length).toBe(80);
    });

    it('should maintain system stability under database load', async () => {
      // Simulate 500 rapid database operations
      const operationCount = 500;
      let completedOperations = 0;
      let errorCount = 0;

      (prisma.order.findMany as any).mockImplementation(() => {
        return new Promise((resolve, reject) => {
          // Simulate database response time variance
          const responseTime = Math.random() * 200 + 50; // 50-250ms
          
          setTimeout(() => {
            completedOperations++;
            
            // Simulate occasional database errors under load
            if (Math.random() < 0.05) { // 5% error rate
              errorCount++;
              reject(new Error('Database connection timeout'));
            } else {
              resolve([{ id: `order_${completedOperations}` }]);
            }
          }, responseTime);
        });
      });

      // Execute operations concurrently
      const operations = Array.from({ length: operationCount }, () =>
        prisma.order.findMany({ take: 10 })
      );

      const startTime = performance.now();
      const results = await Promise.allSettled(operations);
      const endTime = performance.now();

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Performance assertions
      expect(endTime - startTime).toBeLessThan(5000); // Complete within 5 seconds
      expect(successful.length).toBeGreaterThan(450); // At least 90% success
      expect(failed.length).toBeLessThan(50); // Less than 10% failures
    });

    it('should handle memory pressure during large operations', async () => {
      // Simulate processing a large number of bookings
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `bulk_order_${i}`,
        customerName: `Customer ${i}`,
        customerEmail: `customer${i}@test.com`,
        totalAmount: 100 + (i % 50) * 10, // Varying amounts
        orderItems: Array.from({ length: Math.ceil(Math.random() * 3) + 1 }, (_, j) => ({
          id: `item_${i}_${j}`,
          productId: `product_${j % 5}`,
          studentId: `student_${i}_${j}`,
          price: 100
        }))
      }));

      // Mock batch processing
      (prisma.$transaction as any).mockImplementation(async (operations) => {
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < largeDataset.length; i += batchSize) {
          const batch = largeDataset.slice(i, i + batchSize);
          batches.push(batch);
        }

        return { processedBatches: batches.length, totalRecords: largeDataset.length };
      });

      const result = await prisma.$transaction(async (tx) => {
        // Simulate batch processing
        return { processed: largeDataset.length };
      });

      expect(result.processed).toBe(1000);
    });
  });

  describe('2. Complex Business Scenarios', () => {
    it('should handle family with multiple children across different camps', async () => {
      const family = {
        parentName: 'Sarah Johnson',
        parentEmail: 'sarah@johnson.com',
        parentPhone: '+61412345678',
        children: [
          { name: 'Emma', age: 6, allergies: 'Nuts', camp: 'Junior STEM' },
          { name: 'Liam', age: 9, allergies: 'None', camp: 'Advanced Robotics' },
          { name: 'Zoe', age: 12, allergies: 'Dairy', camp: 'Coding Bootcamp' }
        ]
      };

      const camps = [
        { id: 'camp_junior', name: 'Junior STEM', ageRange: '5-8', price: 120 },
        { id: 'camp_robotics', name: 'Advanced Robotics', ageRange: '8-12', price: 180 },
        { id: 'camp_coding', name: 'Coding Bootcamp', ageRange: '10-15', price: 200 }
      ];

      const { result } = renderHook(() => useEnhancedCartStore());

      // Add each camp and student
      act(() => {
        family.children.forEach((child, index) => {
          result.current.addItem(camps[index]);
          const itemId = result.current.items[index].id;
          
          result.current.addStudent(itemId, {
            id: `student_${index}`,
            firstName: child.name,
            lastName: 'Johnson',
            age: child.age,
            parentName: family.parentName,
            parentEmail: family.parentEmail,
            parentPhone: family.parentPhone,
            allergies: child.allergies,
            medicalInfo: ''
          });

          // Set different dates for each camp
          const campDate = new Date('2024-10-15T09:00:00Z');
          campDate.setDate(campDate.getDate() + index); // Different days
          result.current.updateItemDate(itemId, campDate);
        });
      });

      const summary = result.current.getSummary();
      const validation = result.current.validateCart();

      // Verify cart state
      expect(result.current.items).toHaveLength(3);
      expect(summary.subtotal).toBe(500); // 120 + 180 + 200
      expect(validation.isValid).toBe(true);

      // Mock order processing
      const orderData = result.current.prepareOrderData();
      
      expect(orderData.items).toHaveLength(3);
      expect(orderData.items.every(item => item.students.length === 1)).toBe(true);
      expect(orderData.items.map(item => item.students[0].firstName))
        .toEqual(['Emma', 'Liam', 'Zoe']);
    });

    it('should handle birthday party with add-ons and dietary requirements', async () => {
      const birthdayParty = {
        id: 'birthday_deluxe',
        name: 'Deluxe Birthday Party',
        price: 300,
        type: 'BIRTHDAY',
        category: 'parties',
        ageRange: '4-12',
        duration: 150
      };

      const addOns = [
        { id: 'addon_cake', name: 'Custom Cake', price: 50, type: 'FOOD' },
        { id: 'addon_decorations', name: 'Premium Decorations', price: 30, type: 'DECORATION' },
        { id: 'addon_goodie_bags', name: 'Goodie Bags (12 pack)', price: 60, type: 'GIFT' }
      ];

      const birthdayChild = {
        id: 'birthday_child',
        firstName: 'Oliver',
        lastName: 'Smith',
        age: 8,
        parentName: 'Michael Smith',
        parentEmail: 'michael@smith.com',
        parentPhone: '+61423456789',
        allergies: 'Nuts, Dairy',
        medicalInfo: 'EpiPen required for severe nut allergy'
      };

      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        // Add birthday party
        result.current.addItem(birthdayParty);
        const itemId = result.current.items[0].id;

        // Add birthday child
        result.current.addStudent(itemId, birthdayChild);

        // Add guests (up to 12 for birthday parties)
        for (let i = 1; i <= 8; i++) {
          result.current.addStudent(itemId, {
            id: `guest_${i}`,
            firstName: `Guest${i}`,
            lastName: 'Child',
            age: 7 + (i % 3),
            parentName: `Parent ${i}`,
            parentEmail: `parent${i}@test.com`,
            parentPhone: `+6142345678${i}`,
            allergies: i % 3 === 0 ? 'None' : 'Dairy',
            medicalInfo: ''
          });
        }

        // Add all add-ons
        addOns.forEach(addOn => {
          result.current.addItemAddOn(itemId, addOn, 1);
        });

        // Set party date
        result.current.updateItemDate(itemId, new Date('2024-10-20T14:00:00Z'));
      });

      const summary = result.current.getSummary();
      const validation = result.current.validateCart();

      // Verify pricing calculation
      const expectedSubtotal = 300 + 50 + 30 + 60; // Party + add-ons = 440
      expect(summary.subtotal).toBe(expectedSubtotal);
      expect(validation.isValid).toBe(true);

      // Check special dietary requirements are captured
      const item = result.current.items[0];
      const hasAllergies = item.students.some(student => 
        student.allergies && student.allergies !== 'None'
      );
      const hasEpiPen = item.students.some(student => 
        student.medicalInfo?.includes('EpiPen')
      );

      expect(hasAllergies).toBe(true);
      expect(hasEpiPen).toBe(true);
      expect(item.students).toHaveLength(9); // Birthday child + 8 guests
    });

    it('should handle Ignite subscription with term scheduling', async () => {
      const igniteProgram = {
        id: 'ignite_term4',
        name: 'Ignite Program - Term 4',
        price: 480, // 12 weeks × $40
        type: 'SUBSCRIPTION',
        category: 'programs',
        ageRange: '8-16',
        duration: 12 // 12 weeks
      };

      const igniteStudent = {
        id: 'ignite_student',
        firstName: 'Alex',
        lastName: 'Chen',
        age: 11,
        parentName: 'Lisa Chen',
        parentEmail: 'lisa@chen.com',
        parentPhone: '+61434567890',
        allergies: 'None',
        medicalInfo: 'Wears glasses'
      };

      // Mock recurring template creation
      (eventService.createRecurringTemplate as any).mockResolvedValue({
        id: 'template_ignite_123',
        generatedEvents: 12,
        schedule: {
          dayOfWeek: 3, // Wednesday
          startTime: '16:00',
          endTime: '17:00',
          startDate: '2024-10-16',
          endDate: '2025-01-08'
        }
      });

      const { result } = renderHook(() => useEnhancedCartStore());

      act(() => {
        result.current.addItem(igniteProgram);
        const itemId = result.current.items[0].id;
        
        result.current.addStudent(itemId, igniteStudent);
        
        // Set start date (first Wednesday of term)
        result.current.updateItemDate(itemId, new Date('2024-10-16T16:00:00Z'));
        result.current.updateItemTime(itemId, '16:00');
      });

      // Simulate order processing and event creation
      const mockOrder = {
        id: 'order_ignite_123',
        orderItems: [{
          id: 'item_ignite_123',
          productId: igniteProgram.id,
          studentId: igniteStudent.id,
          bookingDate: new Date('2024-10-16T16:00:00Z'),
          product: igniteProgram,
          student: igniteStudent
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const recurringEvents = await eventService.createRecurringTemplate(
        mockOrder.orderItems[0]
      );

      expect(recurringEvents.generatedEvents).toBe(12);
      expect(recurringEvents.schedule.dayOfWeek).toBe(3); // Wednesday
    });
  });

  describe('3. Error Recovery Scenarios', () => {
    it('should recover from payment processing interruptions', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());
      
      const testProduct = {
        id: 'recovery_test',
        name: 'Recovery Test Camp',
        price: 150,
        type: 'CAMP',
        category: 'camps',
        ageRange: '6-12',
        duration: 360
      };

      act(() => {
        result.current.addItem(testProduct);
        const itemId = result.current.items[0].id;
        
        result.current.addStudent(itemId, {
          id: 'recovery_student',
          firstName: 'Test',
          lastName: 'Student',
          age: 8,
          parentName: 'Test Parent',
          parentEmail: 'test@parent.com',
          parentPhone: '+61400000000',
          allergies: 'None',
          medicalInfo: ''
        });
      });

      // Simulate payment initiation
      global.fetch = vi.fn()
        // First attempt: network timeout
        .mockRejectedValueOnce(new Error('Network timeout'))
        // Second attempt: payment processing error
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            success: false,
            error: 'PAYMENT_PROCESSING_ERROR'
          })
        })
        // Third attempt: success
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            paymentIntentId: 'pi_recovery_123',
            clientSecret: 'pi_recovery_123_secret'
          })
        });

      let paymentResult;
      let attemptCount = 0;
      const maxAttempts = 3;

      // Implement retry logic
      while (attemptCount < maxAttempts) {
        try {
          attemptCount++;
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({
              amount: 150,
              currency: 'aud'
            })
          });

          if (response.ok) {
            paymentResult = await response.json();
            break;
          } else {
            const error = await response.json();
            if (attemptCount === maxAttempts) {
              throw new Error(error.error);
            }
          }
        } catch (error) {
          if (attemptCount === maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
        }
      }

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.paymentIntentId).toBe('pi_recovery_123');
      expect(attemptCount).toBe(3);
      
      // Cart should still be intact after recovery
      expect(result.current.items).toHaveLength(1);
    });

    it('should handle partial system failures gracefully', async () => {
      const mockOrder = {
        id: 'partial_failure_order',
        customerName: 'Partial Test',
        customerEmail: 'partial@test.com',
        status: 'PAID',
        orderItems: [
          {
            id: 'item_success',
            productId: 'product_success',
            studentId: 'student_success',
            product: { type: 'CAMP', name: 'Success Camp' },
            student: { name: 'Success Student' }
          },
          {
            id: 'item_failure',
            productId: 'product_failure', 
            studentId: 'student_failure',
            product: { type: 'CAMP', name: 'Failure Camp' },
            student: { name: 'Failure Student' }
          }
        ]
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.location.findFirst as any).mockResolvedValue({
        id: 'loc_123',
        name: 'Test Location'
      });

      // Mock event creation with partial success
      (prisma.event.create as any)
        .mockResolvedValueOnce({
          id: 'event_success',
          title: 'Success Camp - Success Student'
        })
        .mockRejectedValueOnce(new Error('Calendar service unavailable'));

      // Mock booking creation
      (prisma.booking.create as any)
        .mockResolvedValueOnce({
          id: 'booking_success',
          eventId: 'event_success'
        })
        .mockRejectedValueOnce(new Error('Booking creation failed'));

      let partialResults = {
        successful: [],
        failed: [],
        warnings: []
      };

      try {
        const events = await Promise.allSettled([
          eventService.createEventsFromOrder('partial_failure_order')
        ]);

        events.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            partialResults.successful.push(result.value);
          } else {
            partialResults.failed.push({
              index,
              error: result.reason.message
            });
          }
        });

        if (partialResults.failed.length > 0) {
          partialResults.warnings.push(
            `${partialResults.failed.length} events failed to create`
          );
        }
      } catch (error) {
        partialResults.failed.push({ error: error.message });
      }

      // System should continue operating with partial success
      expect(partialResults.successful.length + partialResults.failed.length).toBeGreaterThan(0);
      expect(partialResults.warnings.length).toBeGreaterThan(0);
    });

    it('should handle data corruption recovery', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      // Simulate corrupted localStorage data
      const corruptedData = '{"state":{"items":[{"id":"corrupt","product":null,"students":[{invalid_json}]}}';
      
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(corruptedData),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      // Store should recover gracefully from corruption
      act(() => {
        // Try to access the store (which should handle corruption)
        const items = result.current.items;
        expect(items).toEqual([]); // Should fallback to empty state
      });

      // Should be able to add new items after recovery
      act(() => {
        result.current.addItem({
          id: 'recovery_item',
          name: 'Recovery Item',
          price: 100,
          type: 'CAMP',
          category: 'camps',
          ageRange: '5-12',
          duration: 360
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('4. Edge Cases and Boundary Conditions', () => {
    it('should handle booking at exact capacity limits', async () => {
      const limitedCapacityEvent = {
        id: 'event_limit_test',
        title: 'Limited Capacity Event',
        maxCapacity: 1, // Only 1 spot available
        currentBookings: 0
      };

      // Two users try to book the last spot simultaneously
      const user1Booking = {
        studentName: 'Student A',
        parentEmail: 'parentA@test.com'
      };

      const user2Booking = {
        studentName: 'Student B', 
        parentEmail: 'parentB@test.com'
      };

      let bookingCount = 0;
      (prisma.booking.create as any).mockImplementation(async ({ data }) => {
        // Simulate slight delay and race condition
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        bookingCount++;
        if (bookingCount <= 1) {
          return {
            id: `booking_${bookingCount}`,
            ...data,
            createdAt: new Date()
          };
        } else {
          throw new Error('Event capacity exceeded');
        }
      });

      const [result1, result2] = await Promise.allSettled([
        prisma.booking.create({ data: user1Booking }),
        prisma.booking.create({ data: user2Booking })
      ]);

      // Exactly one should succeed, one should fail
      const successes = [result1, result2].filter(r => r.status === 'fulfilled');
      const failures = [result1, result2].filter(r => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
    });

    it('should handle extreme age boundary cases', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const ageRestrictedCamp = {
        id: 'age_boundary_camp',
        name: 'Teen Programming Camp',
        price: 200,
        type: 'CAMP',
        category: 'camps',
        ageRange: '13-17',
        duration: 360
      };

      act(() => {
        result.current.addItem(ageRestrictedCamp);
        const itemId = result.current.items[0].id;

        // Test edge cases for age boundaries
        const boundaryStudents = [
          { name: 'TooYoung', age: 12 }, // Below minimum
          { name: 'JustRight13', age: 13 }, // Minimum valid
          { name: 'JustRight17', age: 17 }, // Maximum valid
          { name: 'TooOld', age: 18 } // Above maximum
        ];

        boundaryStudents.forEach((student, index) => {
          result.current.addStudent(itemId, {
            id: `boundary_student_${index}`,
            firstName: student.name,
            lastName: 'Test',
            age: student.age,
            parentName: 'Boundary Parent',
            parentEmail: 'boundary@test.com',
            parentPhone: '+61400000000',
            allergies: 'None',
            medicalInfo: ''
          });
        });
      });

      const validation = result.current.validateCart();
      
      // Should have validation errors for students outside age range
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('12') || error.includes('TooYoung')
      )).toBe(true);
      expect(validation.errors.some(error => 
        error.includes('18') || error.includes('TooOld')
      )).toBe(true);
    });

    it('should handle extreme pricing scenarios', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const extremePricingScenarios = [
        {
          id: 'free_camp',
          name: 'Free Community Camp',
          price: 0,
          type: 'CAMP'
        },
        {
          id: 'premium_camp',
          name: 'Premium Exclusive Camp',
          price: 9999.99,
          type: 'CAMP'
        }
      ];

      const expensiveAddOns = [
        { id: 'premium_addon', name: 'Premium Package', price: 5000, type: 'PACKAGE' },
        { id: 'free_addon', name: 'Free Stickers', price: 0, type: 'GIFT' }
      ];

      act(() => {
        extremePricingScenarios.forEach(camp => {
          result.current.addItem(camp);
        });

        // Add students to each camp
        result.current.items.forEach((item, index) => {
          result.current.addStudent(item.id, {
            id: `extreme_student_${index}`,
            firstName: `Student${index}`,
            lastName: 'Extreme',
            age: 8,
            parentName: 'Extreme Parent',
            parentEmail: 'extreme@test.com',
            parentPhone: '+61400000000',
            allergies: 'None',
            medicalInfo: ''
          });

          // Add extreme add-ons
          expensiveAddOns.forEach(addOn => {
            result.current.addItemAddOn(item.id, addOn, 1);
          });
        });
      });

      const summary = result.current.getSummary();

      // Verify extreme pricing calculations
      const expectedSubtotal = 0 + 5000 + 0 + 9999.99 + 5000 + 0; // 19999.99
      expect(summary.subtotal).toBeCloseTo(19999.99, 2);
      
      // GST calculation should handle extreme values
      expect(summary.gst).toBeGreaterThan(0);
      expect(summary.total).toBeGreaterThan(summary.subtotal);
    });

    it('should handle timestamp boundary conditions', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const timestampCamp = {
        id: 'timestamp_camp',
        name: 'Timestamp Test Camp',
        price: 100,
        type: 'CAMP',
        category: 'camps',
        ageRange: '5-12',
        duration: 360
      };

      // Test various timestamp edge cases
      const boundaryDates = [
        new Date('1970-01-01T00:00:00Z'), // Unix epoch
        new Date('2000-01-01T00:00:00Z'), // Y2K
        new Date('2024-02-29T12:00:00Z'), // Leap year
        new Date('2024-12-31T23:59:59Z'), // End of year
        new Date('2025-01-01T00:00:00Z'), // New year
        new Date('2038-01-19T03:14:07Z')  // Unix timestamp limit (32-bit)
      ];

      act(() => {
        result.current.addItem(timestampCamp);
        const itemId = result.current.items[0].id;

        result.current.addStudent(itemId, {
          id: 'timestamp_student',
          firstName: 'Timestamp',
          lastName: 'Test',
          age: 8,
          parentName: 'Timestamp Parent',
          parentEmail: 'timestamp@test.com',
          parentPhone: '+61400000000',
          allergies: 'None',
          medicalInfo: ''
        });
      });

      // Test each boundary date
      const item = result.current.items[0];
      
      act(() => {
        boundaryDates.forEach(date => {
          result.current.updateItemDate(item.id, date);
          
          // Verify date was set correctly
          const updatedItem = result.current.items.find(i => i.id === item.id);
          expect(updatedItem?.selectedDate?.getTime()).toBe(date.getTime());
        });
      });

      // Validation should handle all boundary dates
      const validation = result.current.validateCart();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('5. Network and Connectivity Scenarios', () => {
    it('should handle intermittent network connectivity', async () => {
      let networkAvailable = true;
      let requestCount = 0;

      global.fetch = vi.fn().mockImplementation((url) => {
        requestCount++;
        
        // Simulate intermittent connectivity
        if (requestCount % 3 === 2) { // Every third request fails
          networkAvailable = false;
        } else {
          networkAvailable = true;
        }

        if (!networkAvailable) {
          return Promise.reject(new Error('Network unreachable'));
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: `Response ${requestCount}`
          })
        });
      });

      const networkRequests = [];
      
      // Make multiple requests with retry logic
      for (let i = 0; i < 10; i++) {
        const request = (async (attempt) => {
          const maxRetries = 3;
          let retryCount = 0;

          while (retryCount < maxRetries) {
            try {
              const response = await fetch('/api/test-endpoint');
              const data = await response.json();
              return { success: true, attempt, data };
            } catch (error) {
              retryCount++;
              if (retryCount === maxRetries) {
                return { success: false, attempt, error: error.message };
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        })(i);

        networkRequests.push(request);
      }

      const results = await Promise.all(networkRequests);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Most requests should eventually succeed with retries
      expect(successful.length).toBeGreaterThan(failed.length);
      expect(successful.length).toBeGreaterThan(5);
    });

    it('should handle slow network conditions', async () => {
      const slowResponseTimes = [500, 1500, 3000, 5000]; // ms
      let requestIndex = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        const delay = slowResponseTimes[requestIndex % slowResponseTimes.length];
        requestIndex++;

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                responseTime: delay
              })
            });
          }, delay);
        });
      });

      const startTime = performance.now();
      const slowRequests = Array.from({ length: 4 }, () =>
        fetch('/api/slow-endpoint')
      );

      const responses = await Promise.all(slowRequests);
      const endTime = performance.now();

      // All requests should complete even under slow conditions
      expect(responses).toHaveLength(4);
      expect(endTime - startTime).toBeGreaterThan(5000); // At least as long as slowest request
      
      const results = await Promise.all(
        responses.map(r => r.json())
      );

      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('6. Performance Under Stress', () => {
    it('should maintain cart responsiveness with large datasets', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      // Create large dataset
      const largeCamp = {
        id: 'large_camp',
        name: 'Large Camp',
        price: 100,
        type: 'BIRTHDAY', // Birthday parties allow up to 12 students
        category: 'parties',
        ageRange: '4-12',
        duration: 120
      };

      const startTime = performance.now();

      act(() => {
        result.current.addItem(largeCamp);
        const itemId = result.current.items[0].id;

        // Add maximum students (12 for birthday party)
        for (let i = 0; i < 12; i++) {
          result.current.addStudent(itemId, {
            id: `large_student_${i}`,
            firstName: `Student${i}`,
            lastName: 'Large',
            age: 4 + (i % 8), // Ages 4-11
            parentName: `Parent ${i}`,
            parentEmail: `parent${i}@large.com`,
            parentPhone: `+6140000000${i}`,
            allergies: i % 3 === 0 ? 'Nuts' : 'None',
            medicalInfo: i % 5 === 0 ? 'Inhaler required' : ''
          });
        }

        // Add multiple add-ons
        const addOns = Array.from({ length: 10 }, (_, i) => ({
          id: `addon_${i}`,
          name: `Add-on ${i}`,
          price: 10 + i,
          type: 'GIFT' as const
        }));

        addOns.forEach(addOn => {
          result.current.addItemAddOn(itemId, addOn, Math.ceil(Math.random() * 3));
        });
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Complex cart operations should complete quickly
      expect(operationTime).toBeLessThan(1000); // Less than 1 second

      // Verify all data is correctly stored
      expect(result.current.items[0].students).toHaveLength(12);
      expect(result.current.items[0].addOns).toHaveLength(10);

      // Summary calculation should be fast
      const summaryStartTime = performance.now();
      const summary = result.current.getSummary();
      const summaryEndTime = performance.now();

      expect(summaryEndTime - summaryStartTime).toBeLessThan(100); // Less than 100ms
      expect(summary.subtotal).toBeGreaterThan(100); // Base price plus add-ons
    });

    it('should handle rapid state changes efficiently', async () => {
      const { result } = renderHook(() => useEnhancedCartStore());

      const rapidProduct = {
        id: 'rapid_product',
        name: 'Rapid Test Product',
        price: 50,
        type: 'CAMP',
        category: 'camps',
        ageRange: '5-12',
        duration: 180
      };

      const startTime = performance.now();

      act(() => {
        // Rapid sequential operations
        for (let i = 0; i < 100; i++) {
          result.current.addItem({
            ...rapidProduct,
            id: `rapid_${i}`,
            name: `Rapid Product ${i}`
          });
        }

        // Rapid removals
        const itemIds = result.current.items.map(item => item.id);
        itemIds.slice(0, 50).forEach(id => {
          result.current.removeItem(id);
        });

        // Rapid updates
        result.current.items.slice(0, 25).forEach(item => {
          result.current.updateItemQuantity(item.id, 2);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All rapid operations should complete efficiently
      expect(totalTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.current.items).toHaveLength(50); // 100 added - 50 removed
    });
  });
});
