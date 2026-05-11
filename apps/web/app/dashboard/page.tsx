'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isStaff = user?.roles.some(role => ['ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA'].includes(role));

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/reports/semester-excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Semester-SIAM-MPA-${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Staff Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    enabled: isStaff,
    queryFn: async () => {
      const response = await api.get('/analytics/summary');
      return response.data;
    },
  });

  const { data: statusDist, isLoading: isStatusLoading } = useQuery({
    queryKey: ['analytics-status'],
    enabled: isStaff,
    queryFn: async () => {
      const response = await api.get('/analytics/status-distribution');
      return response.data;
    },
  });

  const { data: categoryDist, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['analytics-category'],
    enabled: isStaff,
    queryFn: async () => {
      const response = await api.get('/analytics/category-distribution');
      return response.data;
    },
  });

  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['analytics-activities'],
    enabled: isStaff,
    queryFn: async () => {
      const response = await api.get('/analytics/recent-activities');
      return response.data;
    },
  });

  // Student Query
  const { data: personalSummary, isLoading: isPersonalLoading } = useQuery({
    queryKey: ['personal-summary'],
    enabled: !isStaff,
    queryFn: async () => {
      const response = await api.get('/analytics/personal-summary');
      return response.data;
    },
  });

  const isLoading = isStaff 
    ? (isSummaryLoading || isStatusLoading || isCategoryLoading || isActivitiesLoading)
    : isPersonalLoading;

  if (isLoading) {
    return <div className="p-8">Memuat dashboard...</div>;
  }

  if (!isStaff) {
    // Student View
    const studentStats = [
      { name: 'Total Aspirasi Saya', value: personalSummary?.total || 0, icon: FileText, color: 'text-blue-600', desc: 'Dikirim melalui portal' },
      { name: 'Sedang Diproses', value: personalSummary?.inProgress || 0, icon: Clock, color: 'text-orange-600', desc: 'Dalam tahap validasi/tindak lanjut' },
      { name: 'Selesai/Tuntas', value: personalSummary?.resolved || 0, icon: CheckCircle2, color: 'text-green-600', desc: 'Aspirasi terselesaikan' },
    ];

    return (
      <div className="space-y-4 md:space-y-8">
        <div className="px-2 md:px-0">
          <h1 className="text-2xl md:text-3xl font-bold italic text-slate-900 tracking-tight">Halo, {user?.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Berikut adalah ringkasan laporan Anda di portal MPA.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 px-2 md:px-0">
          {studentStats.map((stat) => (
            <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl md:rounded-[2rem] bg-white overflow-hidden first:col-span-2 md:first:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
                <CardTitle className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</CardTitle>
                <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg">
                  <stat.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</div>
                <p className="text-[8px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 font-medium line-clamp-1">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm md:shadow-md rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white mx-2 md:mx-0">
          <CardHeader className="p-5 md:p-8">
            <CardTitle className="text-lg md:text-xl font-black text-slate-900">Aspirasi Terbaru Saya</CardTitle>
            <CardDescription className="text-[10px] md:text-sm font-medium">Status terkini dari laporan yang Anda kirimkan.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              {personalSummary?.recentAspirations?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 group">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{a.title}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground font-medium uppercase tracking-tight">
                      {a.aspirationCode} • {a.category?.name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[8px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-md">{a.status}</Badge>
                </div>
              ))}
              {personalSummary?.recentAspirations?.length === 0 && (
                <div className="text-center py-10 md:py-12">
                  <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto opacity-10 mb-2" />
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Anda belum pernah mengirim aspirasi.</p>
                  <Link href="/aspirasi/buat">
                    <Button size="sm" variant="link" className="mt-2 text-primary font-black uppercase tracking-wider text-[10px] md:text-xs">Mulai buat aspirasi</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Staff View (Original Stats)
  const stats = [
    { name: 'Total Aspirasi', value: summary?.total || 0, icon: FileText, color: 'text-blue-600', desc: 'Semua waktu' },
    { name: 'Bulan Ini', value: summary?.thisMonth || 0, icon: TrendingUp, color: 'text-orange-600', desc: 'Aspirasi baru' },
    { name: 'Selesai', value: summary?.resolved || 0, icon: CheckCircle2, color: 'text-green-600', desc: `${summary?.percentageResolved?.toFixed(1)}% tuntas` },
    { name: 'Pending', value: statusDist?.find((s: any) => s.status === 'SUBMITTED')?.count || 0, icon: Clock, color: 'text-red-600', desc: 'Butuh validasi' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 md:px-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Analisis data dan ringkasan pengelolaan aspirasi.</p>
        </div>
        <Button 
          onClick={handleExportExcel} 
          disabled={isExporting}
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 md:h-12 rounded-xl shadow-lg shadow-slate-200"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Unduh Laporan Semester (.xlsx)
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-2 md:px-0">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl md:rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-4 md:p-6">
              <CardTitle className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</CardTitle>
              <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg">
                <stat.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[7px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 font-medium uppercase tracking-tight line-clamp-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 px-2 md:px-0">
        {/* Charts and Activities */}
        <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-5 md:p-8">
            <CardTitle className="text-base md:text-lg font-black text-slate-900">Status Aspirasi</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-8 pt-0 md:pt-0">
            <div className="h-[200px] md:h-[300px]">
              {isMounted && statusDist && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 768 ? 50 : 70}
                      outerRadius={window.innerWidth < 768 ? 70 : 100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusDist.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-5 md:p-8">
            <CardTitle className="text-base md:text-lg font-black text-slate-900">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0 md:pt-0">
            <div className="space-y-4 md:space-y-6">
              {activities?.map((activity: any, i: number) => (
                <div key={i} className="flex gap-3 md:gap-4 items-start group">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight">{activity.message}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground font-medium uppercase tracking-tight">
                      {new Date(activity.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {activities?.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs md:text-sm text-muted-foreground">Belum ada aktivitas.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
