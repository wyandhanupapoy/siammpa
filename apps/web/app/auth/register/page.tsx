'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  nim: z.string().min(1, 'NIM wajib diisi'),
  email: z.string().email('Email tidak valid').endsWith('@polban.ac.id', 'Wajib menggunakan email @polban.ac.id'),
  phone: z.string().min(10, 'Nomor WhatsApp tidak valid (min. 10 digit)').regex(/^[0-9]+$/, 'Hanya boleh berisi angka'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      nim: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await api.post('/auth/register', values);
      toast.success('Registrasi berhasil! Silakan cek email untuk kode verifikasi.');
      router.push(`/auth/verify?email=${encodeURIComponent(values.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Registrasi Akun</CardTitle>
          <CardDescription>
            Gunakan email institusi untuk mulai menyampaikan aspirasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Sesuai KTM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIM</FormLabel>
                    <FormControl>
                      <Input placeholder="211524xxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Polban</FormLabel>
                    <FormControl>
                      <Input placeholder="user@polban.ac.id" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Kode verifikasi akan dikirim ke email ini.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="081234567890" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Gunakan format angka saja (08xx atau 62xx).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-slate-50/50">
          <div className="text-sm text-center text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Login di sini
            </Link>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="w-3 h-3" />
            Data Anda dienkripsi dan dilindungi.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
