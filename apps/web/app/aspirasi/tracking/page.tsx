'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function TrackingIndexPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = code.trim().toUpperCase().replace(/_/g, '-');
    if (normalizedCode) {
      router.push(`/aspirasi/tracking/${normalizedCode}`);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6" /> Lacak Aspirasi
          </CardTitle>
          <CardDescription>
            Masukkan ID Aspirasi Anda untuk melihat status terkini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <Input 
              placeholder="Contoh: MPA-2026-001" 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              className="uppercase"
            />
            <Button type="submit" className="w-full">Cek Status</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
