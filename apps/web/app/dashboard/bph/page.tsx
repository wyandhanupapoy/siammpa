'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function BphDispositionPage() {
  const queryClient = useQueryClient();

  const { data: dispositions, isLoading } = useQuery({
    queryKey: ['bph-dispositions'],
    queryFn: async () => {
      // In a real app, the backend would filter by "sentTo" for the current user/role.
      // For MVP, we'll fetch all dispositions and the BPH can see them.
      const response = await api.get('/aspirations');
      // Filter aspirations that have at least one disposition
      return response.data.filter((asp: any) => asp.dispositions && asp.dispositions.length > 0);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disposisi BPH</h1>
          <p className="text-muted-foreground">Daftar aspirasi yang didisposisikan kepada BPH untuk ditindaklanjuti.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {dispositions && dispositions.length > 0 ? (
          dispositions.map((aspiration: any) => (
            <Card key={aspiration.id} className="overflow-hidden">
              <div className="border-l-4 border-primary h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{aspiration.aspirationCode}</Badge>
                        <Badge>{aspiration.status}</Badge>
                      </div>
                      <CardTitle className="text-xl pt-2">{aspiration.title}</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      render={<a href={`/dashboard/aspirasi/${aspiration.id}`} target="_blank" rel="noopener noreferrer" />}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Detail Aspirasi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-primary" />
                      Instruksi Disposisi
                    </h4>
                    {aspiration.dispositions.map((disp: any, idx: number) => (
                      <div key={disp.id} className={idx > 0 ? 'mt-4 pt-4 border-t border-slate-200' : ''}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Ringkasan:</p>
                            <p className="font-medium">{disp.summary}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Rekomendasi Tindakan:</p>
                            <p className="font-medium">{disp.recommendation}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>Batas Waktu: <strong>{new Date(disp.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                          </div>
                          {disp.documentPath && (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto justify-start" 
                              render={<a href={disp.documentPath} target="_blank" rel="noopener noreferrer" />}
                            >
                              Lihat Surat Disposisi (PDF)
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground italic">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Diterima: {new Date(aspiration.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Tidak ada disposisi aktif</h3>
            <p className="text-slate-500">Semua tugas Anda telah selesai dikerjakan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
