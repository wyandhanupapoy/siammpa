'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function NewsDetailPage() {
  const { id } = useParams();

  const { data: item, isLoading } = useQuery({
    queryKey: ['news-detail', id],
    queryFn: async () => {
      const response = await api.get(`/news/${id}`);
      return response.data;
    },
  });

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
      </article>
    </div>
  );
}
