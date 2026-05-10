'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TopicsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });

  const { data: topics, isLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newTopic) => {
      return api.post('/topics', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      setIsAddOpen(false);
      setNewTopic({ name: '', description: '' });
      toast.success('Topik baru berhasil ditambahkan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topik berhasil dihapus');
    },
  });

  if (isLoading) return <div className="p-8 space-y-6"><Skeleton className="h-10 w-48" /><div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengelompokan Topik</h1>
          <p className="text-muted-foreground text-sm">Kelola topik untuk mengelompokkan aspirasi serupa (misal: Masalah Wifi, Fasilitas Kantin).</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger 
            render={
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Topik Baru
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kelompok Topik</DialogTitle>
              <DialogDescription>Topik ini akan digunakan untuk menyatukan banyak aspirasi serupa.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Topik</Label>
                <Input 
                  id="name" 
                  placeholder="Contoh: Perbaikan Wifi Jurusan" 
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Deskripsi Singkat</Label>
                <Textarea 
                  id="desc" 
                  placeholder="Kumpulan keluhan terkait koneksi wifi di gedung..." 
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button 
                onClick={() => createMutation.mutate(newTopic)}
                disabled={!newTopic.name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Topik'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics?.map((topic: any) => (
          <Card key={topic.id} className="group hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <FolderTree className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(topic.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl mt-3">{topic.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[32px]">{topic.description || 'Tidak ada deskripsi.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 flex gap-1 items-center">
                  <MessageSquare className="w-3 h-3" /> {topic._count.aspirations} Aspirasi
                </Badge>
                {topic.internalAnalysis ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 flex gap-1 items-center">
                    <CheckCircle2 className="w-3 h-3" /> Sudah Dikaji
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 flex gap-1 items-center">
                    <Clock className="w-3 h-3" /> Belum Dikaji
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t pt-4 p-4">
              <Link href={`/dashboard/topik/${topic.id}`} className="w-full">
                <Button variant="ghost" className="w-full justify-between text-primary hover:text-primary hover:bg-primary/5 text-xs font-bold p-0">
                  Detail & Kajian Massal
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {topics?.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed">
            <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Belum ada topik</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">Gunakan topik untuk mengelola aspirasi masal agar lebih mudah dikaji sekaligus.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return <label htmlFor={htmlFor} className={cn("text-sm font-semibold text-slate-700", className)}>{children}</label>;
}
