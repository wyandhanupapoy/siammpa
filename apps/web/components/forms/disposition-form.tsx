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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const dispositionSchema = z.object({
  sentTo: z.string().min(1, 'PIC wajib diisi'),
  summary: z.string().min(10, 'Ringkasan minimal 10 karakter'),
  recommendation: z.string().min(10, 'Rekomendasi minimal 10 karakter'),
  deadline: z.string().min(1, 'Batas waktu wajib diisi'),
});

type DispositionFormValues = z.infer<typeof dispositionSchema>;

interface DispositionFormProps {
  aspirationId: string;
  onSuccess: () => void;
}

export default function DispositionForm({ aspirationId, onSuccess }: DispositionFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<DispositionFormValues>({
    resolver: zodResolver(dispositionSchema),
    defaultValues: {
      sentTo: '',
      summary: '',
      recommendation: '',
      deadline: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: DispositionFormValues) => {
      return api.post(`/aspirations/${aspirationId}/disposition`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspiration', aspirationId] });
      toast.success('Disposisi berhasil dikirim');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim disposisi');
    },
  });

  function onSubmit(values: DispositionFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sentTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diteruskan Ke (PIC)</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: BPH HIMAKOM / Nama Staf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Waktu (Deadline)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ringkasan Isu</FormLabel>
              <FormControl>
                <Textarea placeholder="Ringkasan singkat masalah untuk PIC..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recommendation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rekomendasi Tindakan</FormLabel>
              <FormControl>
                <Textarea placeholder="Apa yang harus dilakukan oleh PIC?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Mengirim Disposisi...' : 'Kirim Disposisi Digital'}
        </Button>
      </form>
    </Form>
  );
}
