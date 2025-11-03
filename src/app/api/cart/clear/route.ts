import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Since we're using Zustand with localStorage for cart state,
    // clearing happens on the client side after successful payment
    // This endpoint can be used for any server-side cleanup if needed
    
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    // Optional: Clean up any server-side cart sessions
    // This could be useful if you implement server-side cart storage later
    console.log(`Cart cleared for completed order: ${orderId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
