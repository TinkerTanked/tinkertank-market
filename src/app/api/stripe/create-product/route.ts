import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION']),
  price: z.number().min(0),
  duration: z.number().optional(),
  ageMin: z.number().min(1),
  ageMax: z.number().min(1),
  maxCapacity: z.number().optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productData = CreateProductSchema.parse(body);

    // Create product in Stripe first
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      images: productData.images,
      metadata: {
        type: productData.type,
        duration: productData.duration?.toString() || '',
        ageMin: productData.ageMin.toString(),
        ageMax: productData.ageMax.toString(),
        maxCapacity: productData.maxCapacity?.toString() || '',
        ...productData.metadata,
      },
    });

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(productData.price * 100), // Convert to cents
      currency: 'aud',
      metadata: {
        type: productData.type,
      },
    });

    // Create product in our database
    const dbProduct = await prisma.product.create({
      data: {
        name: productData.name,
        type: productData.type,
        price: productData.price,
        duration: productData.duration,
        description: productData.description,
        ageMin: productData.ageMin,
        ageMax: productData.ageMax,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...dbProduct,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      },
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'CAMP' | 'BIRTHDAY' | 'SUBSCRIPTION' | null;

    // Get products from database
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each product, get the corresponding Stripe product and price info
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        try {
          // You'd store Stripe product/price IDs in your DB in production
          // For now, we'll just return the DB product
          return product;
        } catch (error) {
          console.error(`Error fetching Stripe data for product ${product.id}:`, error);
          return product;
        }
      })
    );

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
