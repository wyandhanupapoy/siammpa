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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold italic">Halo, {user?.name}!</h1>
          <p className="text-muted-foreground text-sm">Selamat datang di portal aspirasi mahasiswa. Berikut adalah ringkasan laporan Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studentStats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aspirasi Saya Terbaru</CardTitle>
            <CardDescription>Status terkini dari laporan yang Anda kirimkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {personalSummary?.recentAspirations?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.aspirationCode} • {a.category?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                </div>
              ))}
              {personalSummary?.recentAspirations?.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-20 mb-2" />
                  <p className="text-sm text-muted-foreground">Anda belum pernah mengirim aspirasi.</p>
                  <Link href="/aspirasi/buat">
                    <Button size="sm" variant="link" className="mt-2 text-primary font-bold">Mulai buat aspirasi pertama Anda</Button>
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
    { name: 'Selesai', value: summary?.resolved || 0, icon: CheckCircle2, color: 'text-green-600', desc: `${summary?.percentageResolved?.toFixed(1)}% tingkat penyelesaian` },
    { name: 'Butuh Validasi', value: statusDist?.find((s: any) => s.status === 'SUBMITTED')?.count || 0, icon: Clock, color: 'text-red-600', desc: 'Segera periksa' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Overview Dashboard</h1>
          <p className="text-muted-foreground text-sm">Analisis data dan ringkasan pengelolaan aspirasi.</p>
        </div>
        <Button 
          onClick={handleExportExcel} 
          disabled={isExporting}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Unduh Laporan Semester (.xlsx)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
            <CardDescription>Persentase aspirasi berdasarkan tahapan saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-h-[300px]">
            {isMounted && statusDist ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusDist?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-md" />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Aspirasi Per Kategori</CardTitle>
            <CardDescription>Jumlah laporan berdasarkan kategori masalah.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full min-h-[300px]">
            {isMounted && categoryDist ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={categoryDist} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-md" />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Log perubahan status aspirasi terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities?.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{log.aspiration.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.aspiration.aspirationCode} • Diubah oleh {log.changedBy?.name || 'Sistem'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.fromStatus}</Badge>
                      <span className="text-xs">→</span>
                      <Badge className="text-[10px]">{log.toStatus}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {activities?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Belum ada aktivitas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
