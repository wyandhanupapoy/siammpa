'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, FileText, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function MyAspirationsPage() {
  const { user } = useAuthStore();

  const { data: aspirations, isLoading } = useQuery({
    queryKey: ['my-aspirations'],
    queryFn: async () => {
      const response = await api.get('/analytics/personal-summary');
      return response.data.recentAspirations;
    },
  });

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-[400px] w-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Aspirasi Saya</h1>
          <p className="text-muted-foreground text-sm">Daftar aspirasi yang telah Anda sampaikan melalui sistem.</p>
        </div>
        <Link href="/aspirasi/buat">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Buat Aspirasi Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/50">
                  <th className="p-4 text-left font-bold">Kode</th>
                  <th className="p-4 text-left font-bold">Judul Aspirasi</th>
                  <th className="p-4 text-left font-bold">Kategori</th>
                  <th className="p-4 text-left font-bold">Tanggal Kirim</th>
                  <th className="p-4 text-center font-bold">Status</th>
                  <th className="p-4 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {aspirations?.map((a: any) => (
                  <tr key={a.id} className="border-b transition-colors hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-xs font-bold">{a.aspirationCode}</td>
                    <td className="p-4 font-medium">{a.title}</td>
                    <td className="p-4">{a.category?.name}</td>
                    <td className="p-4 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">{a.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/aspirasi/tracking/${a.aspirationCode}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Eye className="w-4 h-4 mr-2" /> Detail & Tracking
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {aspirations?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-20 mb-4" />
                      <p className="text-muted-foreground">Anda belum memiliki aspirasi yang tercatat.</p>
                      <Link href="/aspirasi/buat">
                        <Button variant="link" className="mt-2 text-primary font-bold">Kirim aspirasi sekarang</Button>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
