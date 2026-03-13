import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart,
  Pie,
  Cell,
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
  onAuthStateChanged, 
  User 
} from './firebase';

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
  appId: string;
  version?: string;
  createdAt?: string;
}

const ITAU_APPS = [
  { 
    name: 'íon Itaú', 
    google_play: 'com.itau.investimentos', 
    apple_store: '1531733746' 
  },
  { 
    name: 'Itaú', 
    google_play: 'com.itau', 
    apple_store: '474505665' 
  },
  { 
    name: 'Itaú Cartões', 
    google_play: 'com.itaucard.activity', 
    apple_store: '394401915' 
  },
  { 
    name: 'Itaú Personnalité', 
    google_play: 'com.itau.pers', 
    apple_store: '474507966' 
  },
  { 
    name: 'Itaú Empresas', 
    google_play: 'com.itau.empresas', 
    apple_store: '348274534' 
  },
];

interface AppInfo {
  package: string;
  title: string;
  version: string;
  score: number;
  ratings: number;
  icon_url: string;
  developer: string;
  genre: string;
  updated: string;
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-md w-full text-center shadow-sm">
            <AlertCircle className="w-16 h-16 text-[#FF6321] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-600 mb-6">
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
  const [selectedStore, setSelectedStore] = useState<'google_play' | 'apple_store'>('google_play');
  const [selectedApp, setSelectedApp] = useState(ITAU_APPS[0]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verbatims'>('dashboard');

  // Sync Logic
  const syncReviews = React.useCallback(async () => {
    if (!user) {
      console.log("Sync skipped: No user logged in");
      return;
    }
    console.log("Sync starting for app:", selectedApp.name, "store:", selectedStore);
    setSyncing(true);
    try {
      const appId = selectedApp[selectedStore];
      const response = await fetch('/api/proxy/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: appId,
          store: selectedStore,
          lang: "pt",
          country: "br",
          count: 40 // Increased count for better direct display
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao buscar reviews (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("API Data received:", data);
      
      if (!data.reviews || data.reviews.length === 0) {
        console.warn("API returned no reviews");
      }
      if (data.app_info) {
        // Handle Unix timestamp if updated is a string/number that looks like one
        let updatedDate = data.app_info.updated;
        if (updatedDate && !isNaN(Number(updatedDate)) && Number(updatedDate) > 1000000000) {
          updatedDate = Number(updatedDate) * 1000;
        }

        const info: AppInfo = {
          package: data.app_info.package,
          title: data.app_info.title,
          version: data.app_info.version,
          score: data.app_info.score,
          ratings: data.app_info.ratings,
          icon_url: data.app_info.icon_url,
          developer: data.app_info.developer,
          genre: data.app_info.genre,
          updated: updatedDate
        };
        setAppInfo(info);
      }

      const rawReviews = data.reviews || [];
      
      // Process each review locally
      const processedReviews: Review[] = rawReviews.map((raw: any) => {
        const reviewId = raw.review_id || raw.id || `${selectedStore}_${Date.now()}_${Math.random()}`;
        const reviewVersion = raw.app_version || raw.version || raw.review_version || raw.reviewVersion || null;
        
        // Use rating as sentiment proxy since AI is removed
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        const rating = Number(raw.rating);
        if (rating >= 4) sentiment = 'positive';
        else if (rating <= 2) sentiment = 'negative';

        return {
          id: reviewId,
          author: raw.user_name || raw.author || 'Anônimo',
          content: raw.content || '',
          rating: rating || 0,
          date: raw.date,
          sentiment: sentiment,
          summary: undefined, // No AI summary
          store: selectedStore,
          appId: appId,
          version: reviewVersion,
          createdAt: new Date().toISOString()
        };
      });

      setReviews(processedReviews);
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setSyncing(false);
    }
  }, [user, selectedStore, selectedApp]);

  const handleLogin = () => {
    setUser({ 
      uid: 'guest', 
      displayName: 'Usuário Itaú',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Itau'
    } as any);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Auth Listener (Simplified for local state)
  useEffect(() => {
    // Check if there's a "session" in localStorage if we want persistence, 
    // but for "direct entry" we can just start at login screen or auto-login.
    // User asked for "botao entrar direto", so we stay at login screen but with a simple button.
    setLoading(false);
  }, []);

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      // Use a small delay or check to avoid immediate double-sync if state is settling
      const timer = setTimeout(() => {
        if (isMounted) syncReviews();
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setReviews([]);
      setAppInfo(null);
    }
  }, [user, selectedStore, selectedApp, syncReviews]);

  // Sync Logic
  // (Moved up)

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

  const sentimentDistribution = useMemo(() => {
    return [
      { name: 'Positivo', value: stats.positive, color: '#10b981' },
      { name: 'Neutro', value: stats.neutral, color: '#3b82f6' },
      { name: 'Negativo', value: stats.negative, color: '#f43f5e' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return Object.entries(counts).map(([rating, count]) => ({
      rating: `${rating} ★`,
      count
    }));
  }, [reviews]);

  const versionComparisonData = useMemo(() => {
    const versions: Record<string, { version: string, avgRating: number, total: number, positive: number, negative: number }> = {};
    
    reviews.forEach(r => {
      if (!r.version) return;
      if (!versions[r.version]) {
        versions[r.version] = { version: r.version, avgRating: 0, total: 0, positive: 0, negative: 0 };
      }
      const v = versions[r.version];
      v.total++;
      v.avgRating += r.rating;
      if (r.sentiment === 'positive') v.positive++;
      if (r.sentiment === 'negative') v.negative++;
    });

    return Object.values(versions)
      .map(v => ({
        ...v,
        avgRating: Number((v.avgRating / v.total).toFixed(2)),
        positiveRate: Number(((v.positive / v.total) * 100).toFixed(1)),
        negativeRate: Number(((v.negative / v.total) * 100).toFixed(1))
      }))
      .sort((a, b) => {
        // Simple version sorting (could be improved for semver)
        return a.version.localeCompare(b.version, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6321] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#FF6321] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#FF6321]/20">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Itaú Verbatins</h1>
          <p className="text-gray-600 mb-8 text-lg">Verbatins Lojas - Análise de sentimento dos usuários.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-[#FF6321] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#FF6321]/20 hover:bg-[#e5591e] transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Entrar no Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FF6321] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900">Itaú Verbatins</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Verbatins Lojas</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-gray-200">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
              <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-2xl mb-8 w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'dashboard' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('verbatims')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'verbatims' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Verbatims
          </button>
        </div>

        {/* App Info Highlight */}
        {appInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-200 mb-8 shadow-sm flex flex-col md:flex-row gap-6 items-center"
          >
            <img 
              src={appInfo.icon_url} 
              alt={appInfo.title} 
              className="w-24 h-24 rounded-2xl shadow-lg border border-gray-100"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{appInfo.title}</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  v{appInfo.version}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-700">{appInfo.score.toFixed(2)}</span>
                  <span>({appInfo.ratings.toLocaleString()} avaliações)</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <span>{appInfo.developer}</span>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <span>{appInfo.genre}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Última atualização: {appInfo.updated && !isNaN(new Date(appInfo.updated).getTime()) 
                  ? format(new Date(appInfo.updated), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Data indisponível'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
                Oficial {selectedStore === 'google_play' ? 'Play Store' : 'App Store'}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' ? (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key="dashboard-tab"
          >
            {reviews.length === 0 && !syncing ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dado disponível. Clique em sincronizar ou verifique a conexão.</p>
              </div>
            ) : (
              <>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Sentiment Evolution */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF6321]" />
                    <h2 className="font-bold text-lg text-gray-900">Evolução de Sentimento</h2>
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
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#999" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#999" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

              {/* Sentiment Distribution Pie */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-[#FF6321]" />
                  <h2 className="font-bold text-lg text-gray-900">Distribuição de Sentimento</h2>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Version Comparison - Rating */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF6321]" />
                    <h2 className="font-bold text-lg text-gray-900">Rating por Versão</h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comparativo</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={versionComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="version" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px' }}
                      />
                      <Bar dataKey="avgRating" name="Rating Médio" fill="#FF6321" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Version Comparison - Sentiment */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF6321]" />
                    <h2 className="font-bold text-lg text-gray-900">Sentimento por Versão (%)</h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evolução</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={versionComparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="version" type="category" axisLine={false} tickLine={false} width={60} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px' }}
                      />
                      <Legend />
                      <Bar dataKey="positiveRate" name="% Positivo" fill="#10b981" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="negativeRate" name="% Negativo" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rating Distribution Bar */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-[#FF6321]" />
                  <h2 className="font-bold text-lg text-gray-900">Distribuição de Notas</h2>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="rating" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px' }}
                      />
                      <Bar dataKey="count" fill="#FF6321" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Summary / App Info */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FF6321]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-[#FF6321]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Resumo Geral</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    O app {selectedApp.name} possui um rating médio de {stats.avgRating} estrelas com um sentimento predominante {stats.positive > stats.negative ? 'positivo' : 'negativo'}.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">NPS Estimado</span>
                      <span className={cn("font-bold", stats.positive - stats.negative > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {((stats.positive - stats.negative) / (stats.total || 1) * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Engajamento</span>
                      <span className="font-bold text-blue-600">Alto</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          key="verbatims-tab"
        >
            {/* Actions & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-full md:w-auto shadow-sm">
                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
                <FilterButton active={filter === 'positive'} onClick={() => setFilter('positive')} label="Positivos" color="emerald" />
                <FilterButton active={filter === 'neutral'} onClick={() => setFilter('neutral')} label="Neutros" color="blue" />
                <FilterButton active={filter === 'negative'} onClick={() => setFilter('negative')} label="Negativos" color="rose" />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <select 
                  value={selectedApp.name}
                  onChange={(e) => {
                    const app = ITAU_APPS.find(a => a.name === e.target.value);
                    if (app) setSelectedApp(app);
                  }}
                  className="bg-white border border-gray-200 rounded-xl py-2 px-4 text-sm font-bold focus:outline-none focus:border-[#FF6321]/50 shadow-sm"
                >
                  {ITAU_APPS.map(app => (
                    <option key={app.name} value={app.name}>{app.name}</option>
                  ))}
                </select>
                <select 
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value as any)}
                  className="bg-white border border-gray-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-[#FF6321]/50 shadow-sm"
                >
                  <option value="google_play">Android (Google Play)</option>
                  <option value="apple_store">iOS (App Store)</option>
                </select>
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar em verbatims..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF6321]/50 transition-colors shadow-sm"
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
                    className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
                  >
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum verbatim encontrado.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

// Sub-components
const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-[#FF6321]/30 transition-all shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-xl bg-opacity-10", {
        'bg-blue-500': color === 'blue',
        'bg-yellow-500': color === 'yellow',
        'bg-emerald-500': color === 'emerald',
        'bg-rose-500': color === 'rose',
      })}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live</span>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
  </div>
);

const FilterButton = ({ active, onClick, label, color = 'orange' }: { active: boolean, onClick: () => void, label: string, color?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
      active 
        ? color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
          color === 'rose' ? "bg-rose-500/10 text-rose-600" :
          color === 'blue' ? "bg-blue-500/10 text-blue-600" :
          "bg-[#FF6321] text-white shadow-md shadow-[#FF6321]/20"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    )}
  >
    {label}
  </button>
);

const ReviewCard = ({ review }: { review: Review }) => {
  const sentimentColor = {
    positive: 'text-emerald-600 bg-emerald-500/10',
    neutral: 'text-blue-600 bg-blue-500/10',
    negative: 'text-rose-600 bg-rose-500/10'
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
      className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col md:flex-row gap-6 hover:border-[#FF6321]/20 transition-all group shadow-sm"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
              {review.author.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  {format(new Date(review.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {review.version && (
                  <>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      v{review.version}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn("w-3 h-3", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} 
              />
            ))}
          </div>
        </div>
        
        <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
          "{review.content}"
        </p>
      </div>

      <div className="md:w-32 flex flex-col justify-center items-end gap-2">
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", sentimentColor)}>
          <SentimentIcon className="w-3 h-3" />
          {review.sentiment}
        </div>
        <div className="text-[10px] text-gray-400 font-mono">
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
