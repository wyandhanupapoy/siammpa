'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Newspaper, Plus, Image as ImageIcon, Trash2, Globe, Lock } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublic: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const response = await api.get('/news');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/news', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Berita aspirasi berhasil diterbitkan');
    },
    onError: () => toast.error('Gagal menerbitkan berita'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('Berita berhasil dihapus');
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', isPublic: true });
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Harap upload gambar berita');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('isPublic', String(formData.isPublic));
    data.append('image', imageFile);

    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Berita Aspirasi</h1>
          <p className="text-muted-foreground text-sm">Kelola informasi publik terkait tindak lanjut aspirasi mahasiswa.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Buat Berita
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news?.map((item: any) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            <div className="relative h-48 bg-slate-100">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={item.isPublic ? 'default' : 'secondary'} className="gap-1">
                  {item.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {item.isPublic ? 'Publik' : 'Privat'}
                </Badge>
              </div>
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
              <CardDescription className="text-xs">
                Oleh {item.author.name} • {new Date(item.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 border-t flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 mt-4"
                onClick={() => confirm('Hapus berita ini?') && deleteMutation.mutate(item.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Hapus
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Buat Berita Aspirasi</DialogTitle>
            <DialogDescription>
              Informasikan progres atau hasil penanganan aspirasi kepada publik.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Judul Berita</label>
              <Input 
                placeholder="Contoh: Perbaikan WiFi JTK Tahap 1 Selesai"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Isi Berita</label>
              <Textarea 
                placeholder="Tuliskan detail informasi..."
                className="min-h-[150px]"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex flex-col gap-1">
                Gambar Cover
                <span className="text-[10px] font-normal text-muted-foreground italic">
                  * Ketentuan: Resolusi minimal 1200x800px, Rasio 16:9 disarankan agar tampilan bagus.
                </span>
              </label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Mengunggah...' : 'Terbitkan Sekarang'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
