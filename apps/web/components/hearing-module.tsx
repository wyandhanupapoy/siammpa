'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, Calendar, MapPin, ListTodo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HearingModuleProps {
  aspirationId: string;
}

export function HearingModule({ aspirationId }: HearingModuleProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    scheduledAt: '',
    location: '',
    agenda: '',
    participants: '',
  });

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings', aspirationId],
    queryFn: async () => {
      const response = await api.get(`/aspirations/${aspirationId}/hearings`);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/aspirations/${aspirationId}/hearings`, {
        ...data,
        participants: data.participants.split(',').map((p: string) => p.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hearings', aspirationId] });
      setIsAdding(false);
      setFormData({ scheduledAt: '', location: '', agenda: '', participants: '' });
      toast.success('Jadwal dengar pendapat berhasil dibuat');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card className="border-emerald-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" /> Dengar Pendapat (Hearing)
        </CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Batal' : 'Jadwalkan Hearing'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-3 bg-emerald-50/30 p-3 rounded-md border border-emerald-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold">Waktu</label>
                <Input 
                  type="datetime-local" 
                  className="h-8 text-xs" 
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold">Lokasi</label>
                <Input 
                  placeholder="Gedung/Ruang/Zoom" 
                  className="h-8 text-xs"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold">Peserta (Pisahkan dengan koma)</label>
              <Input 
                placeholder="Ketua MPA, Kajur, Pelapor" 
                className="h-8 text-xs"
                value={formData.participants}
                onChange={(e) => setFormData({...formData, participants: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold">Agenda</label>
              <Textarea 
                placeholder="Bahasan pertemuan..." 
                className="text-xs min-h-[60px]"
                value={formData.agenda}
                onChange={(e) => setFormData({...formData, agenda: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full h-8 text-xs" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground italic">Memuat data hearing...</p>
          ) : hearings?.length > 0 ? (
            hearings.map((h: any) => (
              <div key={h.id} className="bg-slate-50 p-3 rounded-md border text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Calendar className="w-3 h-3 text-primary" />
                    {new Date(h.scheduledAt).toLocaleString()}
                  </div>
                  <Badge variant="secondary" className="text-[9px]">{h.location}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="flex items-start gap-2">
                    <ListTodo className="w-3 h-3 text-muted-foreground mt-0.5" />
                    <span className="text-slate-700">{h.agenda}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground italic">
                      Peserta: {Array.isArray(h.participants) ? h.participants.join(', ') : h.participants}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-muted-foreground py-2 italic">Belum ada jadwal hearing.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
