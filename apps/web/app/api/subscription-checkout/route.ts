import { NextRequest, NextResponse } from 'next/server';

import { getPlanByPriceId, validatePriceIds } from '@/app/stripe-config';
import { getSessionFromRequest } from '@/lib/session';
import { createOrUpdateSubscriptionCheckout, getOrCreateStripeCustomer } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getBaseUrl } from '@/lib/utils/url';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // デバッグ: 価格ID設定を確認
    validatePriceIds();
    
    // リクエストボディを取得
    const { priceId, successUrl, cancelUrl, userId } = await req.json();

    console.log('サブスクリプション決済開始:', {
      priceId,
      successUrl,
      cancelUrl,
      userId,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // FREEプランの場合は決済不要
    if (priceId === 'free') {
      return NextResponse.json({ 
        message: 'Free plan selected - no payment required',
        redirectUrl: successUrl || '/dashboard'
      });
    }

    // プラン情報を確認
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('不明な価格ID:', priceId);
      return NextResponse.json({ 
        error: `Invalid price ID: ${priceId}. Available plans should be checked.` 
      }, { status: 400 });
    }

    console.log('決済するプラン:', plan);

    // セッション取得を試行（複数の方法でフォールバック）
    let sessionUserId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    try {
      // 方法1: getSessionFromRequestを使用
      const sessionInfo = await getSessionFromRequest(req);
      if (sessionInfo?.user) {
        sessionUserId = sessionInfo.user.id;
        userEmail = sessionInfo.user.email || null;
        // user.nameは存在しない可能性があるため、user_metadataから取得
        const userMetadata = sessionInfo.user as { user_metadata?: { name?: string } };
        userName = userMetadata.user_metadata?.name || null;
        console.log('セッション取得成功（getSessionFromRequest）:', sessionUserId);
      }
    } catch (sessionErr) {
      console.warn('getSessionFromRequest失敗:', sessionErr);
    }

    // 方法2: リクエストで送信されたuserIdを使用（一時的フォールバック）
    if (!sessionUserId && userId) {
      console.log('フォールバック: リクエストのuserIdを使用:', userId);
      sessionUserId = userId;
      
      // userIdからユーザー情報を取得
      try {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', userId)
          .single();
        
        if (userData) {
          userEmail = userData.email;
          userName = userData.name;
        }
      } catch (userErr) {
        console.warn('ユーザー情報取得失敗:', userErr);
      }
    }

    // 最終的に認証情報が取得できない場合はエラー
    if (!sessionUserId || !userEmail) {
      console.error('セッション取得失敗: 認証が必要です');
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'ユーザーセッションが見つかりません。再ログインしてください。'
      }, { status: 401 });
    }

    // Stripe顧客を取得または作成
    let stripeCustomerId: string;
    try {
      stripeCustomerId = await getOrCreateStripeCustomer(
        sessionUserId,
        userEmail,
        userName || undefined
      );
      console.log('Stripe顧客情報:', stripeCustomerId);
    } catch (error) {
      console.error('Stripe顧客作成エラー:', error);
      return NextResponse.json(
        { error: 'Stripe顧客の作成に失敗しました' },
        { status: 500 }
      );
    }

    // ベースURLを動的に取得
    const baseUrl = getBaseUrl(req);
    
    // サブスクリプションチェックアウトセッションを作成
    const session = await createOrUpdateSubscriptionCheckout({
      priceId,
      successUrl: successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${baseUrl}/dashboard?canceled=true`,
      customerId: stripeCustomerId,
      metadata: {
        userId: sessionUserId,
        planName: plan.name,
        environment: process.env.NODE_ENV || 'development',
      },
    });

    console.log('チェックアウトセッション作成成功:', session.id);

    // 通貨移行で新しい顧客が作成された場合の処理
    if (session.metadata?.new_customer_id && session.metadata.new_customer_id !== stripeCustomerId) {
      console.log('🔄 新しい顧客IDをデータベースに更新:', session.metadata.new_customer_id);
      
      try {
        // データベースの顧客IDを更新
        await supabaseAdmin
          .from('stripe_customers')
          .upsert({
            userId: sessionUserId,
            customerId: session.metadata.new_customer_id,
            updatedAt: new Date().toISOString(),
          });
        
        console.log('✅ データベースの顧客ID更新完了');
      } catch (dbError) {
        console.warn('データベース更新エラー（処理は続行）:', dbError);
      }
    }

    // プラン更新完了の場合は成功メッセージを返す
    if (session.id.startsWith('updated_')) {
      console.log('✅ プラン更新完了:', session.id);
      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        type: 'plan_updated',
        message: 'プランが正常に更新されました',
        metadata: session.metadata
      });
    }

    // Billing Portalの場合は直接URLを返す
    if (session.id.startsWith('portal_')) {
      console.log('🔄 Billing Portalへリダイレクト:', session.url);
      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        type: 'billing_portal'
      });
    }

    // 通常のCheckout Sessionの場合
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      type: 'checkout_session'
    });

  } catch (error) {
    console.error('サブスクリプション決済API エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: errorMessage,
      details: 'サブスクリプション決済の処理中にエラーが発生しました。'
    }, { status: 500 });
  }
} 