'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Phone, Mail, Shield, Save, Loader2, Key } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        phone: profile.phone || ''
      }));
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Basic validation for password change
      if (data.password && data.password !== data.confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok');
      }
      
      const payload = {
        name: data.name,
        phone: data.phone,
        ...(data.password ? { password: data.password } : {})
      };

      return api.put('/users/me', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      // Update local store name if changed
      if (authUser) {
        setUser({ ...authUser, name: formData.name });
      }
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success('Profil berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui profil');
    }
  });

  if (isLoading) return <div className="p-8 space-y-4"><Loader2 className="animate-spin" /> Memuat profil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Profil</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                <CardDescription>Detail identitas Anda di sistem SIAM MPA.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {profile.roles?.map((r: any) => (
                <Badge key={r.role.id} variant="outline" className="bg-white">{r.role.name}</Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Institusi
              </Label>
              <Input value={profile.email} disabled className="bg-slate-50 italic" />
              <p className="text-[10px] text-muted-foreground">Email tidak dapat diubah.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                <Shield className="w-3 h-3" /> NIM / ID
              </Label>
              <Input value={profile.nim || '-'} disabled className="bg-slate-50 italic" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase font-bold text-muted-foreground">Nama Lengkap</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
              <Phone className="w-3 h-3" /> Nomor WhatsApp
            </Label>
            <Input 
              id="phone" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Contoh: 08123456789"
            />
            <p className="text-[10px] text-emerald-600 font-medium italic">
              * Pastikan nomor aktif untuk menerima update status aspirasi.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-full text-orange-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Keamanan</CardTitle>
              <CardDescription>Ubah kata sandi Anda secara berkala.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs uppercase font-bold text-muted-foreground">Password Baru</Label>
              <Input 
                id="pass" 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs uppercase font-bold text-muted-foreground">Konfirmasi Password</Label>
              <Input 
                id="confirm" 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/30 border-t p-6 flex justify-end">
          <Button 
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending || !formData.name}
            className="w-full sm:w-auto px-8"
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
