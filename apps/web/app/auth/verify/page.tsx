'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, Timer } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Kode verifikasi harus 6 digit');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-email', { email, code });
      toast.success('Email berhasil diverifikasi! Silakan login.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verifikasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Kode verifikasi baru telah dikirim!');
      setCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim ulang kode.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Verifikasi Email</CardTitle>
        <CardDescription>
          Masukkan 6 digit kode yang dikirim ke <span className="font-bold text-slate-900">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center">
            <Input 
              className="text-center text-2xl tracking-[1em] font-bold h-14"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memverifikasi...' : 'Verifikasi Akun'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-slate-50/50">
        <div className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
          Tidak menerima kode?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto font-bold" 
            onClick={handleResend}
            disabled={isLoading || cooldown > 0}
          >
            {cooldown > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Timer className="w-3 h-3" /> Tunggu {cooldown}s
              </span>
            ) : (
              'Kirim ulang'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
