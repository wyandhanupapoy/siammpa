'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip 
} from 'recharts';
import { useEffect, useState } from 'react';

export function PublicStats() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const response = await api.get('/analytics/public');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { 
      name: 'Total Aspirasi Masuk', 
      value: data.summary.total, 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      desc: 'Sejak sistem diluncurkan' 
    },
    { 
      name: 'Aspirasi Terselesaikan', 
      value: data.summary.resolved, 
      icon: CheckCircle2, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      desc: `${data.summary.percentageResolved.toFixed(1)}% tingkat keberhasilan` 
    },
    { 
      name: 'Aspirasi Bulan Ini', 
      value: data.summary.thisMonth, 
      icon: TrendingUp, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      desc: 'Tren aspirasi terbaru' 
    },
  ];

  return (
    <div className="space-y-4 md:space-y-10 py-4 md:py-10 px-2 md:px-0">
      <div className="text-center space-y-1 md:space-y-3">
        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Transparansi Kinerja</h2>
        <p className="text-[10px] md:text-sm text-slate-500 font-medium px-4">Statistik real-time pengelolaan aspirasi mahasiswa.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl md:rounded-[2rem] bg-white group overflow-hidden first:col-span-2 lg:first:col-span-1">
            <div className={`absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 ${stat.bg} rounded-full -mr-4 -mt-4 md:-mr-8 md:-mt-8 opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 relative z-10 p-3 md:p-6">
              <CardTitle className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</CardTitle>
              <div className={`p-1.5 md:p-3 rounded-lg md:rounded-2xl ${stat.bg} shadow-sm group-hover:rotate-12 transition-transform`}>
                <stat.icon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-4xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[7px] md:text-[10px] font-bold text-slate-400 mt-1 md:mt-2 uppercase tracking-tight line-clamp-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white mx-0">
        <CardHeader className="bg-slate-900 border-none px-4 py-3 md:px-8 md:py-6">
          <CardTitle className="text-xs md:text-base font-bold text-white flex items-center gap-2 md:gap-3">
            <div className="bg-primary/20 p-1 md:p-2 rounded-lg md:rounded-xl">
              <BarChart3 className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
            </div>
            Kategori Dominan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-8">
          <div className="h-[200px] md:h-[350px] w-full min-h-[200px] md:min-h-[350px]">
            {isMounted && data.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12, fontWeight: 700 }} 
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="oklch(0.205 0 0)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <BarChart3 className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">Belum ada data kategori yang tersedia.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
