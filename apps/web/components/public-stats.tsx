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
    <div className="space-y-10 py-10">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Transparansi Kinerja</h2>
        <p className="text-slate-500 font-medium">Statistik real-time pengelolaan aspirasi mahasiswa oleh MPA HIMAKOM POLBAN.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white group overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-8 -mt-8 opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</CardTitle>
              <div className={`p-3 rounded-2xl ${stat.bg} shadow-sm group-hover:rotate-12 transition-transform`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 border-none px-8 py-6">
          <CardTitle className="text-base font-bold text-white flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            Kategori Aspirasi Dominan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 h-[350px] w-full">
          {isMounted && data.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  width={140} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="oklch(0.205 0 0)" 
                  radius={[0, 10, 10, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <BarChart3 className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Belum ada data kategori yang tersedia.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
