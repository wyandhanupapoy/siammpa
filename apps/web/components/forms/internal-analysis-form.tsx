'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface InternalAnalysisFormProps {
  aspirationId: string;
  initialData?: any;
  onSuccess: () => void;
  customSubmit?: (data: any) => Promise<void>;
}

export default function InternalAnalysisForm({ aspirationId, initialData, onSuccess, customSubmit }: InternalAnalysisFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    notulensi: '',
    rekomendasi: '',
    rencanaAksi: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        notulensi: initialData.notulensi || '',
        rekomendasi: initialData.rekomendasi || '',
        rencanaAksi: initialData.rencanaAksi || '',
      });
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (customSubmit) {
        return customSubmit(data);
      }
      return api.post(`/aspirations/${aspirationId}/analysis`, data);
    },
    onSuccess: () => {
      if (!customSubmit) {
        queryClient.invalidateQueries({ queryKey: ['aspiration', aspirationId] });
      }
      toast.success('Kajian internal berhasil disimpan');
      onSuccess();
    },
    onError: () => {
      toast.error('Gagal menyimpan kajian internal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="notulensi" className="font-bold text-xs uppercase text-muted-foreground">1. Notulensi Kajian / Rapat</Label>
        <Textarea 
          id="notulensi"
          placeholder="Tuliskan ringkasan hasil rapat atau poin-poin penting kajian tim..."
          className="min-h-[100px]"
          value={formData.notulensi}
          onChange={(e) => setFormData({...formData, notulensi: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rekomendasi" className="font-bold text-xs uppercase text-muted-foreground">2. Rekomendasi Tim</Label>
        <Textarea 
          id="rekomendasi"
          placeholder="Hasil kajian merekomendasikan untuk..."
          className="min-h-[80px]"
          value={formData.rekomendasi}
          onChange={(e) => setFormData({...formData, rekomendasi: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rencanaAksi" className="font-bold text-xs uppercase text-muted-foreground">3. Rencana Aksi (Action Plan)</Label>
        <Textarea 
          id="rencanaAksi"
          placeholder="Langkah konkret selanjutnya adalah..."
          className="min-h-[80px]"
          value={formData.rencanaAksi}
          onChange={(e) => setFormData({...formData, rencanaAksi: e.target.value})}
          required
        />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Hasil Kajian
        </Button>
      </div>
    </form>
  );
}
