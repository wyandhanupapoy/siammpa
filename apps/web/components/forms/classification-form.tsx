'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const classificationSchema = z.object({
  param1: z.string().transform(Number),
  param2: z.string().transform(Number),
  param3: z.string().transform(Number),
  param4: z.string().transform(Number),
  param5: z.string().transform(Number),
  param6: z.string().transform(Number),
  notes: z.string().optional(),
});

type ClassificationFormValues = z.infer<typeof classificationSchema>;

interface ClassificationFormProps {
  aspirationId: string;
  onSuccess: () => void;
}

const params = [
  { id: 'param1', label: 'Jumlah Terdampak', description: '1=Individu, 5=Seluruh Mahasiswa' },
  { id: 'param2', label: 'Urgensi Waktu', description: '1=Bisa Menunggu, 5=Sangat Mendesak' },
  { id: 'param3', label: 'Dampak Akademik', description: '1=Kecil, 5=Sangat Mengganggu' },
  { id: 'param4', label: 'Sensitivitas', description: '1=Umum, 5=Isu SARA/Kekerasan' },
  { id: 'param5', label: 'Kelengkapan Bukti', description: '1=Minim, 5=Sangat Lengkap' },
  { id: 'param6', label: 'Pengulangan', description: '1=Pertama Kali, 5=Sudah Sering' },
];

export default function ClassificationForm({ aspirationId, onSuccess }: ClassificationFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<any>({
    resolver: zodResolver(classificationSchema),
    defaultValues: {
      param1: "1",
      param2: "1",
      param3: "1",
      param4: "1",
      param5: "1",
      param6: "1",
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: any) => {
      // Ensure params are numbers
      const payload = {
        ...values,
        param1: Number(values.param1),
        param2: Number(values.param2),
        param3: Number(values.param3),
        param4: Number(values.param4),
        param5: Number(values.param5),
        param6: Number(values.param6),
      };
      return api.post(`/aspirations/${aspirationId}/classification`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspiration', aspirationId] });
      toast.success('Klasifikasi & Scoring berhasil');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan klasifikasi');
    },
  });

  function onSubmit(values: any) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {params.map((p) => (
            <FormField
              key={p.id}
              control={form.control}
              name={p.id as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold">{p.label}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px]">{p.description}</FormDescription>
                </FormItem>
              )}
            />
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan Klasifikasi</FormLabel>
              <FormControl>
                <Textarea placeholder="Alasan pemberian skor..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menghitung Skor...' : 'Submit & Hitung Prioritas'}
        </Button>
      </form>
    </Form>
  );
}
