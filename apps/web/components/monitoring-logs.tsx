'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Activity, Plus, History } from 'lucide-react';

interface MonitoringLogsProps {
  aspirationId: string;
}

export function MonitoringLogs({ aspirationId }: MonitoringLogsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['monitoring-logs', aspirationId],
    queryFn: async () => {
      const response = await api.get(`/aspirations/${aspirationId}/monitoring`);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newLog: { content: string }) => {
      return api.post(`/aspirations/${aspirationId}/monitoring`, newLog);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-logs', aspirationId] });
      setContent('');
      setIsAdding(false);
      toast.success('Log tindak lanjut berhasil ditambahkan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate({ content });
  };

  return (
    <Card className="border-indigo-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" /> Monitoring Tindak Lanjut
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-3 bg-indigo-50/30 p-3 rounded-md border border-indigo-100">
            <Textarea 
              placeholder="Catat progres tindak lanjut..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Batal</Button>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Log'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground italic">Memuat log...</p>
          ) : logs?.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="relative pl-4 border-l-2 border-indigo-200">
                <p className="text-xs text-slate-700 leading-relaxed">{log.content}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span className="font-bold">{log.loggedBy}</span>
                  <span>•</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 space-y-1">
              <History className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
              <p className="text-xs text-muted-foreground">Belum ada log tindak lanjut.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
