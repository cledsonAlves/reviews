import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  LayoutDashboard, 
  MessageSquare, 
  TrendingUp, 
  Star, 
  RefreshCw, 
  LogOut, 
  LogIn,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged, 
  User 
} from './firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  limit 
} from 'firebase/firestore';
import { analyzeReview } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Review {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  store: string;
  createdAt?: string;
}

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] p-8 rounded-2xl max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-[#FF6321] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || "Ocorreu um erro inesperado."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#FF6321] text-white px-6 py-2 rounded-full font-medium hover:bg-[#e5591e] transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user) {
      setReviews([]);
      return;
    }

    const q = query(collection(db, 'reviews'), orderBy('date', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data() } as Review));
      setReviews(docs);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Logic
  const syncReviews = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/proxy/reviews');
      const data = await response.json();
      
      const rawReviews = data.reviews || [];
      
      // Process each review (analyze and save)
      for (const raw of rawReviews) {
        const reviewId = raw.id || raw.review_id || `google_play_${Date.now()}_${Math.random()}`;
        
        // Check if we already have this review to avoid re-analyzing
        const existing = reviews.find(r => r.id === reviewId);
        if (existing && existing.sentiment) continue;

        const analysis = await analyzeReview(raw.content);
        
        const reviewData: Review = {
          id: reviewId,
          author: raw.author || raw.user_name || 'Anônimo',
          content: raw.content,
          rating: raw.rating,
          date: raw.date,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          store: 'google_play',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'reviews', reviewId), reviewData);
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const positive = reviews.filter(r => r.sentiment === 'positive').length;
    const negative = reviews.filter(r => r.sentiment === 'negative').length;
    const neutral = reviews.filter(r => r.sentiment === 'neutral').length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '0';

    return { total, positive, negative, neutral, avgRating };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => filter === 'all' || r.sentiment === filter)
      .filter(r => r.content.toLowerCase().includes(searchTerm.toLowerCase()) || r.author.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [reviews, filter, searchTerm]);

  // Chart Data
  const chartData = useMemo(() => {
    const groups: Record<string, { date: string, positive: number, neutral: number, negative: number }> = {};
    
    // Sort reviews by date ascending for the chart
    const sortedReviews = [...reviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedReviews.forEach(r => {
      const dateKey = format(new Date(r.date), 'dd/MM');
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, positive: 0, neutral: 0, negative: 0 };
      }
      if (r.sentiment) {
        groups[dateKey][r.sentiment]++;
      }
    });

    return Object.values(groups);
  }, [reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6321] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#FF6321] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#FF6321]/20">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Itaú Investimentos</h1>
          <p className="text-gray-400 mb-8 text-lg">Dashboard de análise de verbatims e sentimento dos usuários.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#111] sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FF6321] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Itaú Investimentos</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Verbatim Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-white/10">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" />
              <span className="text-sm font-medium text-gray-300">{user.displayName}</span>
            </div>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-white transition-colors p-2"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total de Reviews" 
            value={stats.total} 
            icon={<MessageSquare className="w-5 h-5 text-blue-400" />} 
            color="blue"
          />
          <StatCard 
            title="Rating Médio" 
            value={stats.avgRating} 
            icon={<Star className="w-5 h-5 text-yellow-400" />} 
            color="yellow"
          />
          <StatCard 
            title="Sentimento Positivo" 
            value={`${((stats.positive / (stats.total || 1)) * 100).toFixed(0)}%`} 
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
            color="emerald"
          />
          <StatCard 
            title="Sentimento Negativo" 
            value={`${((stats.negative / (stats.total || 1)) * 100).toFixed(0)}%`} 
            icon={<AlertCircle className="w-5 h-5 text-rose-400" />} 
            color="rose"
          />
        </div>

        {/* Chart Section */}
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6321]" />
              <h2 className="font-bold text-lg">Evolução de Sentimento</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Positivo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Neutro</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span>Negativo</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPositive)" 
                  stackId="1"
                />
                <Area 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorNeutral)" 
                  stackId="1"
                />
                <Area 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorNegative)" 
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-[#1A1A1A] p-1 rounded-xl border border-white/5 w-full md:w-auto">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
            <FilterButton active={filter === 'positive'} onClick={() => setFilter('positive')} label="Positivos" color="emerald" />
            <FilterButton active={filter === 'neutral'} onClick={() => setFilter('neutral')} label="Neutros" color="blue" />
            <FilterButton active={filter === 'negative'} onClick={() => setFilter('negative')} label="Negativos" color="rose" />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar em verbatims..."
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF6321]/50 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={syncReviews}
              disabled={syncing}
              className={cn(
                "bg-[#FF6321] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
                syncing && "animate-pulse"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-white/10"
              >
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum verbatim encontrado.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// Sub-components
const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-[#111] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-xl bg-opacity-10", {
        'bg-blue-500': color === 'blue',
        'bg-yellow-500': color === 'yellow',
        'bg-emerald-500': color === 'emerald',
        'bg-rose-500': color === 'rose',
      })}>
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live</span>
    </div>
    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold tracking-tight">{value}</p>
  </div>
);

const FilterButton = ({ active, onClick, label, color = 'orange' }: { active: boolean, onClick: () => void, label: string, color?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
      active 
        ? color === 'emerald' ? "bg-emerald-500/20 text-emerald-400" :
          color === 'rose' ? "bg-rose-500/20 text-rose-400" :
          color === 'blue' ? "bg-blue-500/20 text-blue-400" :
          "bg-[#FF6321] text-white"
        : "text-gray-500 hover:text-gray-300"
    )}
  >
    {label}
  </button>
);

const ReviewCard = ({ review }: { review: Review }) => {
  const sentimentColor = {
    positive: 'text-emerald-400 bg-emerald-400/10',
    neutral: 'text-blue-400 bg-blue-400/10',
    negative: 'text-rose-400 bg-rose-400/10'
  }[review.sentiment || 'neutral'];

  const SentimentIcon = {
    positive: ArrowUpRight,
    neutral: Minus,
    negative: ArrowDownRight
  }[review.sentiment || 'neutral'];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#111] p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 hover:bg-[#151515] transition-colors group"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
              {review.author.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{review.author}</h4>
              <p className="text-xs text-gray-500">
                {format(new Date(review.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn("w-3 h-3", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700")} 
              />
            ))}
          </div>
        </div>
        
        <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
          "{review.content}"
        </p>

        {review.summary && (
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3 h-3 text-[#FF6321]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">AI Summary</span>
            </div>
            <p className="text-xs text-gray-400">{review.summary}</p>
          </div>
        )}
      </div>

      <div className="md:w-32 flex flex-col justify-center items-end gap-2">
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", sentimentColor)}>
          <SentimentIcon className="w-3 h-3" />
          {review.sentiment}
        </div>
        <div className="text-[10px] text-gray-600 font-mono">
          ID: {review.id.slice(0, 8)}...
        </div>
      </div>
    </motion.div>
  );
};

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
