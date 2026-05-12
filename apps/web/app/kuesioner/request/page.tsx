'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Send, FileQuestion } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/protected-route';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

const formSchema = z.object({
  requesterName: z.string().min(1, 'Nama pemohon wajib diisi'),
  requesterRole: z.string().min(1, 'Jabatan/Divisi wajib diisi'),
  contactInfo: z.string().min(1, 'Kontak yang bisa dihubungi wajib diisi'),
  purpose: z.string().min(10, 'Tujuan kuesioner minimal 10 karakter'),
  targetRespondent: z.string().min(1, 'Target responden wajib diisi'),
  estimatedCount: z.string().optional(),
  requestedDeadline: z.string().min(1, 'Batas waktu wajib diisi'),
}).superRefine((values, ctx) => {
  if (values.estimatedCount && Number(values.estimatedCount) <= 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['estimatedCount'],
      message: 'Estimasi responden harus lebih besar dari 0',
    });
  }

  const deadline = new Date(values.requestedDeadline);
  if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
    ctx.addIssue({
      code: 'custom',
      path: ['requestedDeadline'],
      message: 'Batas waktu harus lebih besar dari hari ini',
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestQuestionnairePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requesterName: '',
      requesterRole: '',
      contactInfo: '',
      purpose: '',
      targetRespondent: '',
      estimatedCount: '',
      requestedDeadline: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset({
      requesterName: user.name || '',
      requesterRole: form.getValues('requesterRole'),
      contactInfo: user.email || '',
      purpose: form.getValues('purpose'),
      targetRespondent: form.getValues('targetRespondent'),
      estimatedCount: form.getValues('estimatedCount'),
      requestedDeadline: form.getValues('requestedDeadline'),
    });
  }, [form, user]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        estimatedCount: values.estimatedCount ? Number(values.estimatedCount) : undefined,
      };
      await api.post('/questionnaires/request', payload);
      toast.success('Permintaan kuesioner berhasil dikirim!');
      form.reset({
        requesterName: user?.name || '',
        requesterRole: '',
        contactInfo: user?.email || '',
        purpose: '',
        targetRespondent: '',
        estimatedCount: '',
        requestedDeadline: '',
      });
      router.push('/dashboard/kuesioner');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim permintaan.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FileQuestion className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-serif">Formulir Permintaan Kuesioner (KSR-F)</CardTitle>
            <CardDescription>
              Diajukan kepada Komisi Aspirasi MPA HIMAKOM POLBAN. 
              Sesuai SOP-MPA-KSR-2026 Bab III.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requesterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap Pemohon</FormLabel>
                        <FormControl>
                          <Input placeholder="Isi nama lengkap" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requesterRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan / Divisi</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Ketua BPH" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontak yang Bisa Dihubungi</FormLabel>
                      <FormControl>
                        <Input placeholder="No. WA aktif / Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tujuan Pengumpulan Data</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jelaskan untuk apa data ini akan digunakan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetRespondent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Responden</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Mahasiswa JTK" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestedDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batas Waktu</FormLabel>
                        <FormControl>
                          <Input type="date" min={minDate} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimatedCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimasi Jumlah Responden</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Contoh: 150"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? 'Mengirim...' : 'Kirim Permintaan'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
