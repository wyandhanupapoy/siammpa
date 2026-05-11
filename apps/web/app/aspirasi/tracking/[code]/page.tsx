'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, Info, MessageSquareHeart, Copy } from 'lucide-react';
import SurveyForm from '@/components/forms/survey-form';

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  LOGGED: 'bg-indigo-100 text-indigo-800',
  VALIDATING: 'bg-purple-100 text-purple-800',
  VERIFIED: 'bg-green-100 text-green-800',
  CLASSIFIED: 'bg-cyan-100 text-cyan-800',
  ASSIGNED: 'bg-orange-100 text-orange-800',
  IN_FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
  ESCALATED: 'bg-destructive text-destructive-foreground',
};

export default function TrackingDetailPage() {
  const { code } = useParams();
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const { data: aspiration, isLoading, error } = useQuery({
    queryKey: ['aspiration', code],
    queryFn: async () => {
      const response = await api.get(`/aspirations/track/${code}`);
      return response.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Aspirasi dengan kode {code} tidak ditemukan. Silakan periksa kembali kode Anda.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-3xl font-bold font-mono tracking-tight">{aspiration.aspirationCode}</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-500 hover:text-primary"
            onClick={() => {
              navigator.clipboard.writeText(aspiration.aspirationCode);
              toast.success('Kode aspirasi disalin ke clipboard!');
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Badge className={statusColors[aspiration.status] || ''}>
          {aspiration.status}
        </Badge>
      </div>

      {aspiration.status === 'RESOLVED' && !surveySubmitted && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <MessageSquareHeart className="w-6 h-6" /> Selesai! Mohon Berikan Feedback
            </CardTitle>
            <CardDescription>
              Aspirasi Anda telah ditindaklanjuti. Mohon isi survei singkat di bawah ini untuk menutup laporan secara resmi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SurveyForm aspirationId={aspiration.id} onSuccess={() => setSurveySubmitted(true)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{aspiration.title}</CardTitle>
          <CardDescription>
            Kategori: {aspiration.category.name} | Dikirim pada: {new Date(aspiration.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Deskripsi:</h3>
            <p className="text-sm whitespace-pre-wrap">{aspiration.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Riwayat Status
            </h3>
            <div className="relative border-l-2 border-muted ml-3 pl-6 space-y-6">
              {aspiration.statusLogs && aspiration.statusLogs.length > 0 ? (
                aspiration.statusLogs.map((log: any, index: number) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-primary border-4 border-white"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{log.toStatus}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.note && <p className="text-xs text-muted-foreground mt-1">{log.note}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-primary border-4 border-white"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">SUBMITTED</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(aspiration.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Aspirasi baru diterima sistem.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Informasi</AlertTitle>
        <AlertDescription>
          Simpan kode tracking ini untuk melihat perkembangan aspirasi Anda di masa mendatang.
        </AlertDescription>
      </Alert>
    </div>
  );
}
