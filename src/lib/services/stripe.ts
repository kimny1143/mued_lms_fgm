import { loadStripe } from '@stripe/stripe-js';
import type { BookingStatus } from '../types/booking';

// Stripeインスタンスを初期化
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// APIエンドポイント
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const stripeService = {
  /**
   * レッスン予約用のStripeチェックアウトセッションを作成
   * @param bookingId 予約ID
   * @param price 価格（円）
   * @param userEmail ユーザーのメールアドレス
   */
  async createCheckoutSession(bookingId: string, price: number, userEmail: string) {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          price,
          userEmail,
          successUrl: `${window.location.origin}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/bookings/cancel`,
        }),
      });

      const { sessionId } = await response.json();
      
      // Stripeチェックアウトにリダイレクト
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe checkout error:', error);
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  },

  /**
   * 支払い完了後の処理
   * @param sessionId Stripeセッションid
   */
  async handlePaymentSuccess(sessionId: string): Promise<{ bookingId: string; status: BookingStatus }> {
    try {
      const response = await fetch('/api/stripe/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process payment success: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  },

  /**
   * 予約のステータスを直接更新（開発用）
   * @param bookingId 予約ID
   * @param status 新しいステータス
   */
  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  }
}; 