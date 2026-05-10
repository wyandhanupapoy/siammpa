'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const surveySchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

interface SurveyFormProps {
  aspirationId: string;
  onSuccess: () => void;
}

export default function SurveyForm({ aspirationId, onSuccess }: SurveyFormProps) {
  const queryClient = useQueryClient();
  const [hoveredStar, setHoveredStar] = useState(0);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      score: 5,
      comment: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: SurveyFormValues) => {
      return api.post(`/aspirations/${aspirationId}/survey`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspiration'] });
      toast.success('Terima kasih atas feedback Anda!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim survey');
    },
  });

  function onSubmit(values: SurveyFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center gap-2">
              <FormLabel className="text-lg font-bold">Bagaimana kepuasan Anda?</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-10 h-10 cursor-pointer transition-colors",
                        (hoveredStar || field.value) >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                      )}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => field.onChange(star)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan / Saran (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Apa yang bisa kami tingkatkan?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Mengirim...' : 'Kirim Feedback & Tutup Laporan'}
        </Button>
      </form>
    </Form>
  );
}
