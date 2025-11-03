#!/usr/bin/env tsx

/**
 * Database validation utility
 * Checks data integrity and business rule compliance
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

async function validateProducts(): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] }
  
  console.log('🔍 Validating products...')
  
  const products = await prisma.product.findMany()
  
  for (const product of products) {
    // Check pricing
    if (Number(product.price) <= 0) {
      result.errors.push(`Product "${product.name}" has invalid price: ${product.price}`)
      result.valid = false
    }
    
    // Check age ranges
    if (product.ageMin >= product.ageMax) {
      result.errors.push(`Product "${product.name}" has invalid age range: ${product.ageMin}-${product.ageMax}`)
      result.valid = false
    }
    
    // Check duration for different types
    if (product.type === 'CAMP' && (!product.duration || product.duration < 60)) {
      result.warnings.push(`Camp "${product.name}" has very short duration: ${product.duration} minutes`)
    }
    
    if (product.type === 'BIRTHDAY' && (!product.duration || product.duration < 90)) {
      result.warnings.push(`Birthday party "${product.name}" duration may be too short: ${product.duration} minutes`)
    }
  }
  
  console.log(`✅ Validated ${products.length} products`)
  return result
}

async function validateEvents(): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] }
  
  console.log('🔍 Validating events...')
  
  const events = await prisma.event.findMany({
    include: {
      location: true,
      bookings: true,
    },
  })
  
  for (const event of events) {
    // Check capacity
    if (event.currentCount > event.maxCapacity) {
      result.errors.push(`Event "${event.title}" is overbooked: ${event.currentCount}/${event.maxCapacity}`)
      result.valid = false
    }
    
    // Check booking count matches currentCount
    if (event.bookings.length !== event.currentCount) {
      result.warnings.push(`Event "${event.title}" booking count mismatch: ${event.bookings.length} bookings vs ${event.currentCount} current count`)
    }
    
    // Check date logic
    if (event.endDateTime <= event.startDateTime) {
      result.errors.push(`Event "${event.title}" has invalid date range`)
      result.valid = false
    }
    
    // Check location capacity
    if (event.maxCapacity > event.location.capacity) {
      result.warnings.push(`Event "${event.title}" max capacity (${event.maxCapacity}) exceeds location capacity (${event.location.capacity})`)
    }
  }
  
  console.log(`✅ Validated ${events.length} events`)
  return result
}

async function validateBookings(): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] }
  
  console.log('🔍 Validating bookings...')
  
  const bookings = await prisma.booking.findMany({
    include: {
      student: true,
      product: true,
      event: true,
    },
  })
  
  for (const booking of bookings) {
    // Check age compatibility
    const studentAge = new Date().getFullYear() - booking.student.birthdate.getFullYear()
    if (studentAge < booking.product.ageMin || studentAge > booking.product.ageMax) {
      result.warnings.push(`Student "${booking.student.name}" age (${studentAge}) outside product range for "${booking.product.name}" (${booking.product.ageMin}-${booking.product.ageMax})`)
    }
    
    // Check price matches product
    if (Number(booking.totalPrice) !== Number(booking.product.price)) {
      result.warnings.push(`Booking price mismatch for "${booking.product.name}": booking ${booking.totalPrice} vs product ${booking.product.price}`)
    }
    
    // Check date consistency with event
    if (booking.event) {
      if (booking.startDate.getTime() !== booking.event.startDateTime.getTime()) {
        result.errors.push(`Booking date mismatch with event for student "${booking.student.name}"`)
        result.valid = false
      }
    }
  }
  
  console.log(`✅ Validated ${bookings.length} bookings`)
  return result
}

async function validateOrders(): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] }
  
  console.log('🔍 Validating orders...')
  
  const orders = await prisma.order.findMany({
    include: {
      orderItems: true,
    },
  })
  
  for (const order of orders) {
    // Check total amount calculation
    const calculatedTotal = order.orderItems.reduce((sum, item) => sum + Number(item.price), 0)
    const orderTotal = Number(order.totalAmount)
    
    if (Math.abs(calculatedTotal - orderTotal) > 0.01) {
      result.errors.push(`Order ${order.id} total mismatch: calculated ${calculatedTotal} vs stored ${orderTotal}`)
      result.valid = false
    }
    
    // Check for empty orders
    if (order.orderItems.length === 0) {
      result.warnings.push(`Order ${order.id} has no items`)
    }
  }
  
  console.log(`✅ Validated ${orders.length} orders`)
  return result
}

async function main() {
  console.log('🔍 TinkerTank Market Database Validation')
  console.log('='.repeat(40))
  
  try {
    const [productResult, eventResult, bookingResult, orderResult] = await Promise.all([
      validateProducts(),
      validateEvents(),
      validateBookings(),
      validateOrders(),
    ])
    
    const allResults = [productResult, eventResult, bookingResult, orderResult]
    const allValid = allResults.every(r => r.valid)
    const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = allResults.reduce((sum, r) => sum + r.warnings.length, 0)
    
    console.log('\n📊 Validation Summary')
    console.log('='.repeat(30))
    
    if (totalErrors > 0) {
      console.log('❌ ERRORS FOUND:')
      allResults.forEach(result => {
        result.errors.forEach(error => console.log(`  ${error}`))
      })
    }
    
    if (totalWarnings > 0) {
      console.log('⚠️  WARNINGS:')
      allResults.forEach(result => {
        result.warnings.forEach(warning => console.log(`  ${warning}`))
      })
    }
    
    console.log(`\nTotal Errors: ${totalErrors}`)
    console.log(`Total Warnings: ${totalWarnings}`)
    
    if (allValid && totalErrors === 0) {
      console.log('\n✅ All validations passed!')
    } else {
      console.log('\n❌ Some validations failed')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
