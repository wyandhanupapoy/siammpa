'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, BellOff, CheckCircle2, Clock, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      return api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Semua notifikasi ditandai telah dibaca');
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'RESOLVED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'ESCALATION': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  if (isLoading) return <div className="p-8">Memuat notifikasi...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center px-2 md:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pusat Notifikasi</h1>
          <p className="text-muted-foreground">Pantau update terbaru mengenai aspirasi dan sistem.</p>
        </div>
        {notifications?.some((n: any) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={() => readAllMutation.mutate()}>
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications?.length > 0 ? (
          notifications.map((n: any) => (
            <Card 
              key={n.id} 
              className={cn(
                "transition-all cursor-pointer hover:shadow-md",
                !n.isRead ? "border-l-4 border-l-primary bg-primary/5" : "opacity-80"
              )}
              onClick={() => !n.isRead && readMutation.mutate(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                    {!n.isRead && (
                      <Badge variant="secondary" className="text-[8px] font-black uppercase mt-2">Baru</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
            <BellOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Belum ada notifikasi</h3>
            <p className="text-sm text-slate-400">Update terbaru akan muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
