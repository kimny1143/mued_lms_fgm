import { Request, Response } from 'express';
import Stripe from 'stripe';
import { BookingStatus } from '../../../lib/types/booking';
import { prisma } from '../../../lib/prisma';

// Stripeインスタンスの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // リクエストボディの取得
    const rawBody = await getRawBody(req);
    
    // イベントの検証
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // イベントタイプに基づいて処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const bookingId = metadata.bookingId;

        if (bookingId) {
          // 予約ステータスを PAID に更新
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.PAID }
          });

          console.log(`Booking ${bookingId} status updated to PAID`);
        } else {
          console.warn('No booking ID found in session metadata');
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// リクエストからRAWボディを取得するヘルパー関数
async function getRawBody(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      resolve(data);
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
} 