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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const validationSchema = z.object({
  criteria1: z.boolean(),
  criteria2: z.boolean(),
  criteria3: z.boolean(),
  criteria4: z.boolean(),
  criteria5: z.boolean(),
  notes: z.string().optional(),
  decision: z.enum(['VERIFIED', 'REJECTED']),
});

type ValidationFormValues = z.infer<typeof validationSchema>;

interface ValidationFormProps {
  aspirationId: string;
  onSuccess: () => void;
}

export default function ValidationForm({ aspirationId, onSuccess }: ValidationFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      criteria1: false,
      criteria2: false,
      criteria3: false,
      criteria4: false,
      criteria5: false,
      notes: '',
      decision: 'VERIFIED',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ValidationFormValues) => {
      return api.post(`/aspirations/${aspirationId}/validation`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspiration', aspirationId] });
      toast.success('Validasi berhasil disimpan');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan validasi');
    },
  });

  function onSubmit(values: ValidationFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="criteria1"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Identitas pelapor valid</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criteria2"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Lokasi kejadian jelas</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criteria3"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Bukti pendukung cukup</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criteria4"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Deskripsi masalah jelas</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criteria5"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Relevansi dengan HIMAKOM/POLBAN</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan Validasi</FormLabel>
              <FormControl>
                <Textarea placeholder="Berikan alasan jika ditolak atau catatan tambahan..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="decision"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Keputusan</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="VERIFIED" />
                    </FormControl>
                    <FormLabel className="font-normal">Diterima (VERIFIED)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="REJECTED" />
                    </FormControl>
                    <FormLabel className="font-normal text-destructive">Ditolak (REJECTED)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Keputusan'}
        </Button>
      </form>
    </Form>
  );
}
