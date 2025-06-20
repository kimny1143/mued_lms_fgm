import { User } from '@supabase/supabase-js';
import { ChevronRight, Music, Calendar, Brain, BookOpen, Star, Check, Menu, X, Play, Sparkles, Headphones, Radio, Mic2, Piano, Pause, SkipForward, Volume2, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';

import { getSubscriptionPlans } from '@/app/stripe-config';
import { supabaseBrowser } from '@/lib/supabase-browser';


const LandingPage = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setScrollY(window.scrollY);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ユーザー認証状態を確認
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    getUser();
    
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 波形ビジュアライザーのアニメーション
  const WaveformVisualizer = () => {
    const bars = Array.from({ length: 40 }, (_, i) => i);
    
    return (
      <div className="flex items-center justify-center space-x-1 h-16">
        {bars.map((i) => (
          <div
            key={i}
            className="w-1 bg-green-400 rounded-full transition-all duration-300"
            style={{
              height: isPlaying 
                ? `${Math.random() * 100}%` 
                : '20%',
              animation: isPlaying 
                ? `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite` 
                : 'none'
            }}
          />
        ))}
      </div>
    );
  };

  // 音楽プレーヤーコンポーネント
  const MusicPlayer = () => {
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/90 backdrop-blur-xl rounded-full px-8 py-4 border border-gray-700 shadow-2xl">
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-white transition">
              <SkipForward className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-green-500 text-black p-3 rounded-full hover:bg-green-400 transition transform hover:scale-110"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button className="text-gray-400 hover:text-white transition">
              <SkipForward className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center space-x-3 ml-8">
              <span className="text-sm text-gray-400">Now Playing:</span>
              <span className="text-sm font-semibold">Songs you'll create</span>
            </div>
            <button className="text-gray-400 hover:text-red-500 transition ml-6">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-green-400" />,
      title: "AIメンターマッチング",
      description: "あなたの音楽の好みと目標を理解し、最適な講師をマッチング",
      delay: 0
    },
    {
      icon: <BookOpen className="w-8 h-8 text-green-400" />,
      title: "パーソナライズ教材",
      description: "AIがあなただけの学習プレイリストを自動生成",
      delay: 100
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-400" />,
      title: "スマートスケジューリング",
      description: "音楽を学ぶ時間を、あなたのリズムに合わせて",
      delay: 200
    },
    {
      icon: <Headphones className="w-8 h-8 text-green-400" />,
      title: "リアルタイムセッション",
      description: "AIだけではありません。高音質オンラインレッスンで、どこからでも学習",
      delay: 300
    },
    {
      icon: <Radio className="w-8 h-8 text-green-400" />,
      title: "進捗トラッキング",
      description: "あなたの成長を可視化し、モチベーションをキープ",
      delay: 400
    },
    {
      icon: <Sparkles className="w-8 h-8 text-green-400" />,
      title: "AIフィードバック",
      description: "練習の質を向上させる、リアルタイムアドバイス",
      delay: 500
    }
  ];

  const instruments = [
    { 
      name: "作曲/編曲", 
      icon: <Piano className="w-12 h-12" />, 
      color: "from-purple-500 to-pink-500",
      sound: "🎹",
      description: "音楽の可能性"
    },
    { 
      name: "作詞", 
      icon: <Music className="w-12 h-12" />, 
      color: "from-blue-500 to-cyan-500",
      sound: "📓",
      description: "言葉の魔法"
    },
    { 
      name: "レコーディング", 
      icon: <Mic2 className="w-12 h-12" />, 
      color: "from-green-500 to-emerald-500",
      sound: "🎙️",
      description: "瞬間を掴む力"
    },
    { 
      name: "楽器レッスン", 
      icon: <Radio className="w-12 h-12" />, 
      color: "from-orange-500 to-red-500",
      sound: "🥁",
      description: "生楽器の魅力"
    },
  ];

  const plans = [
    {
      name: "FREE",
      price: "¥0",
      period: "/月",
      features: [
        "基本教材アクセス",
        "AI教材：月3本まで",
        "体験レッスン1回",
        "広告表示"
      ],
      recommended: false,
      gradient: "from-gray-700 to-gray-800"
    },
    {
      name: "Starter",
      price: "¥500",
      period: "/月",
      features: [
        "広告表示なし",
        "レッスン予約枠：1件/月",
        "教材アクセス",
        "AI教材：月3本まで",
        "AIカリキュラム",
      ],
      recommended: false,
      gradient: "from-green-600 to-green-700"
    },
    {
      name: "PRO",
      price: "¥2,480",
      period: "/月",
      features: [
        "広告表示なし",
        "レッスン予約枠：5件/月",
        "録画レッスン無制限",
        "教材アクセス無制限",
        "AI教材：月5本まで",
        "AIカリキュラム",
        "チャットサポート",
      ],
      recommended: true,
      gradient: "from-green-600 to-green-700"
    },
    {
      name: "Premium",
      price: "¥5,980",
      period: "/月",
      features: [
        "Basicの全機能",
        "AI教材無制限",
        "メンターマッチング優先",
        "グループ／個別レッスン枠：無制限",
      ],
      recommended: false,
      gradient: "from-purple-600 to-purple-700"
    }
  ];


  // プラン選択と決済処理
  const handlePlanSelect = async (planName: string) => {
    // 実際のStripe設定からプランを取得
    const subscriptionPlans = getSubscriptionPlans();
    const selectedPlan = subscriptionPlans.find(plan => plan.name === planName);
    
    if (!selectedPlan) {
      console.error('プランが見つかりません:', planName);
      return;
    }

    // FREEプランの場合は直接ログインページへ
    if (selectedPlan.priceId === 'free') {
      router.push('/login');
      return;
    }

    // 認証されていない場合はログインページへ
    if (!user) {
      // プラン情報をローカルストレージに保存してログイン後に使用
      const planData = {
        ...selectedPlan,
        selectedAt: new Date().toISOString(),
        source: 'landing-page'
      };
      localStorage.setItem('selectedPlan', JSON.stringify(planData));
      console.log('プラン選択情報を保存:', planData);
      router.push('/login');
      return;
    }

    // 認証済みユーザーの場合は直接決済処理
    setIsLoading(true);
    setProcessingPlan(planName);

    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('認証トークンが見つかりません。再度ログインしてください。');
      }

      const response = await fetch('/api/subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          userId: user.id,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/new-landing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'サブスクリプション処理に失敗しました');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('リダイレクトURLが取得できませんでした');
      }
    } catch (err) {
      console.error('サブスクリプション処理エラー:', err);
      alert(err instanceof Error ? err.message : 'サブスクリプション処理に失敗しました');
    } finally {
      setIsLoading(false);
      setProcessingPlan(null);
    }
  };

  // ナビゲーション関数
  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToOldDesign = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* カーソル追従エフェクト */}
      <div 
        className="fixed w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none z-0 transition-all duration-1000 ease-out"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
        }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <img src="/gw_crow_black2x.png" alt="MUED Logo" className="w-8 h-8.5" />
              </div>
              <span className="font-bold text-2xl">MUED</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">機能</a>
              <a href="#instruments" className="text-gray-300 hover:text-white transition">コース</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">プラン</a>
              <span className="text-gray-500">|</span>
              <button 
                onClick={handleLogin}
                className="text-gray-300 hover:text-white transition"
              >
                ログイン
              </button>
              <button 
                onClick={handleSignUp}
                className="bg-green-500 text-black px-6 py-2 rounded-full font-semibold hover:bg-green-400 transition transform hover:scale-105"
              >
                無料で始める
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800">
            <div className="px-4 py-2 space-y-1">
              <a href="#features" className="block py-2 text-gray-300 hover:text-white">機能</a>
              <a href="#instruments" className="block py-2 text-gray-300 hover:text-white">コース</a>
              <a href="#pricing" className="block py-2 text-gray-300 hover:text-white">プラン</a>
              <button 
                onClick={handleLogin}
                className="block py-2 text-gray-300 hover:text-white"
              >
                ログイン
              </button>
              <button 
                onClick={handleSignUp}
                className="w-full bg-green-500 text-black px-6 py-2 rounded-full font-semibold hover:bg-green-400 transition mt-2"
              >
                無料で始める
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* パララックス背景 */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        
        {/* アニメーション背景要素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20"
            style={{ transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)` }}
          >
            <div className="w-full h-full rounded-full border border-green-500/20 animate-spin-slow"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold animate-fade-in">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 animate-gradient">
              Learn Anytime, Anywhere
              </span>
              <br />
              <span className="text-white">
                with MUED
              </span>
            </h1>
            <p className="text-l lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-delay">
              あなたの音楽ジャーニーをパーソナライズ。
              自然に寄り添い、自然に上達。
            </p>
            
            {/* 波形ビジュアライザー */}
            <div className="my-8">
              <WaveformVisualizer />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
              <button 
                onClick={handleSignUp}
                className="bg-green-500 text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-green-400 transition transform hover:scale-105 flex items-center justify-center group"
              >
                <Play className="mr-2 w-5 h-5" />
                無料で始める
              </button>
            </div>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-12 animate-fade-in-delay-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 flex items-center space-x-2 hover:bg-white/20 transition cursor-pointer">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-sm">AI搭載</span>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 flex items-center space-x-2 hover:bg-white/20 transition cursor-pointer">
                <Star className="w-5 h-5 text-green-400" />
                <span className="text-sm">4.9/5 評価</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instruments Section */}
      <section id="instruments" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">
              様々なジャンルの講師
            </h2>
            <p className="text-xl text-gray-400">
              現役のクリエイターがマンツーマンでサポートします。
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {instruments.map((instrument, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedInstrument === index ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => setSelectedInstrument(index)}
                onMouseEnter={() => {
                  // 楽器にホバーしたときの効果音をシミュレート
                  const audio = new Audio();
                  audio.volume = 0.3;
                  // 実際の実装では音声ファイルを使用
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${instrument.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative p-8 text-center">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {instrument.sound}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{instrument.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{instrument.description}</p>
                  <p className="text-gray-500 text-xs">プロ講師 多数+</p>
                  {selectedInstrument === index && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with stagger animation */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">
              音楽学習を再発明
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              最新のAIテクノロジーで、あなただけの音楽学習体験を
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${feature.delay}ms forwards`,
                  opacity: 0
                }}
              >
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">
              料金プラン
            </h2>
            <p className="text-xl text-gray-400">
              あなたのペースで、あなたのスタイルで
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-105 ${
                  plan.recommended 
                    ? 'border-2 border-green-100 scale-105 shadow-2xl shadow-green-500/20' 
                    : 'border border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className={`bg-gradient-to-br ${plan.gradient} p-8`}>
                  {plan.recommended && (
                    <div className="absolute top-4 right-4 bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={`w-full py-3 rounded-full font-semibold transition transform hover:scale-105 ${
                      plan.recommended 
                        ? 'bg-green-500 text-black hover:bg-green-400 shadow-lg' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    } ${processingPlan === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handlePlanSelect(plan.name)}
                    disabled={processingPlan !== null}
                  >
                    {processingPlan === plan.name ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        処理中...
                      </div>
                    ) : (
                      plan.name === 'FREE' ? '無料で始める' : 'プランを選択'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 mt-8">
            すべてのプランに14日間の無料トライアル付き。いつでもキャンセル可能。
          </p>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-purple-600/20 animate-gradient"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-12 relative overflow-hidden transition-transform duration-300">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                今すぐ音楽の旅を始めよう
              </h2>
              <p className="text-xl mb-8 text-green-100">
                14日間無料トライアル・クレジットカード不要
              </p>
              <button
                onClick={handleSignUp}
                className="bg-black text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-900 transition transform hover:scale-110 inline-flex items-center group shadow-2xl">
                <Play className="mr-2 w-5 h-5 animate-spin-slow" />
                無料で始める
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Music Player */}
      <MusicPlayer />

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <img src="/gw_crow_black2x.png" alt="MUED Logo" className="w-9 h-8.5" />
                </div>
                <span className="font-bold text-2xl">MUED</span>
              </div>
              <p className="text-gray-400 mb-4">
                音楽教育の未来を、AIと共に創る
              </p>
              <div className="flex space-x-4">
                <Volume2 className="w-5 h-5 text-gray-500 hover:text-green-400 cursor-pointer transition" />
                <Headphones className="w-5 h-5 text-gray-500 hover:text-green-400 cursor-pointer transition" />
                <Radio className="w-5 h-5 text-gray-500 hover:text-green-400 cursor-pointer transition" />
              </div>
              <p className="text-gray-500 text-sm mt-4">
                © 2025 株式会社グラスワークス
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">製品</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-white transition">機能</a></li>
                <li><a href="#" className="hover:text-white transition">料金</a></li>
                <li><a href="#" className="hover:text-white transition">デモ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">サポート</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-white transition">ヘルプ</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">会社</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-white transition">会社概要</a></li>
                <li><a href="#" className="hover:text-white transition">利用規約</a></li>
                <li><a href="#" className="hover:text-white transition">プライバシー</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes floatAnimation {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-fade-in {
          animation: fadeInUp 1s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fadeInUp 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeInUp 1s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-3 {
          animation: fadeInUp 1s ease-out 0.9s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;