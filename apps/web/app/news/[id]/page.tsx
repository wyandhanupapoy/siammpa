'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Image as ImageIcon, ThumbsUp, ThumbsDown, MessageCircle, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export default function NewsDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['news-detail', id],
    queryFn: async () => {
      const response = await api.get(`/news/${id}`);
      return response.data;
    },
  });

  const reactMutation = useMutation({
    mutationFn: async (type: 'LIKE' | 'DISLIKE') => {
      return api.post(`/news/${id}/react`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-detail', id] });
    },
    onError: () => {
      toast.error('Gagal memberikan reaksi');
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/news/${id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-detail', id] });
      setCommentContent('');
      toast.success('Komentar berhasil ditambahkan');
    },
    onError: () => {
      toast.error('Gagal menambahkan komentar');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return api.delete(`/news/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-detail', id] });
      toast.success('Komentar dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus komentar');
    }
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Silakan login untuk berkomentar');
      return;
    }
    if (!commentContent.trim()) return;
    commentMutation.mutate(commentContent);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 space-y-8 max-w-4xl">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Berita tidak ditemukan</h1>
        <Link href="/news">
          <Button variant="link">Kembali ke daftar berita</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Link href="/news" className="inline-flex items-center text-primary hover:underline mb-8 gap-2 group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Kembali ke Berita
      </Link>

      <article className="space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y py-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Oleh {item.author?.name || 'Admin'}
            </span>
          </div>
        </header>

        {item.imageUrl ? (
          <div className="relative h-[450px] w-full rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}

        <div className="prose prose-slate prose-lg max-w-none">
          {item.content.split('\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="mb-4 text-slate-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="border-t pt-10 space-y-10">
          {/* Reaksi */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className={cn("gap-2 rounded-full h-11 px-6 shadow-sm transition-all hover:shadow-md", reactMutation.isPending && "opacity-50")}
              onClick={() => isAuthenticated ? reactMutation.mutate('LIKE') : toast.error('Silakan login')}
            >
              <ThumbsUp className="w-5 h-5 text-blue-600" />
              <span className="font-bold">{item._count.reactions}</span>
              <span className="text-xs text-muted-foreground ml-1">Suka</span>
            </Button>
            <div className="text-sm text-muted-foreground italic flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {item._count.comments} Komentar
            </div>
          </div>

          {/* Kolom Komentar */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              Komentar Publik
              <Badge variant="secondary" className="text-xs font-bold">{item._count.comments}</Badge>
            </h3>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Textarea 
                  placeholder="Tulis pendapat Anda secara sopan..." 
                  className="min-h-[100px] rounded-xl border-slate-200 focus:ring-primary resize-none p-4 text-sm"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-muted-foreground italic">
                    * Komentar Anda akan terlihat oleh publik.
                  </p>
                  <Button type="submit" size="sm" className="rounded-xl px-6 gap-2" disabled={commentMutation.isPending || !commentContent.trim()}>
                    Kirim <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                <p className="text-sm text-muted-foreground mb-3">Silakan login untuk bergabung dalam diskusi.</p>
                <Link href="/auth/login">
                  <Button size="sm" variant="outline" className="rounded-xl">Login Sekarang</Button>
                </Link>
              </div>
            )}

            <div className="space-y-6">
              {item.comments?.map((comment: any) => (
                <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{comment.user?.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {(user?.id === comment.userId || user?.roles.includes('ADMIN')) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-700 leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
              {item.comments?.length === 0 && (
                <div className="text-center py-10">
                  <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">Belum ada komentar. Jadilah yang pertama!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
