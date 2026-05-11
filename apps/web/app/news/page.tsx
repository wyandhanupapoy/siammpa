'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, Calendar, User, ArrowRight, Image as ImageIcon, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function NewsPage() {
  const [search, setSearch] = useState('');

  const { data: news, isLoading } = useQuery({
    queryKey: ['public-news'],
    queryFn: async () => {
      const response = await api.get('/news');
      return response.data;
    },
  });

  const filteredNews = news?.filter((item: any) => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Berita & Informasi</h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
            Pantau progres penanganan aspirasi dan informasi terbaru dari Komisi Aspirasi MPA HIMAKOM POLBAN.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari berita..." 
            className="pl-10 h-12 rounded-2xl border-slate-200 shadow-sm focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredNews && filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item: any) => (
            <Card key={item.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all flex flex-col h-full bg-white">
              <div className="relative h-56 w-full overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 backdrop-blur-sm border-none">Informasi</Badge>
                </div>
              </div>
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.author?.name || 'Admin'}
                  </span>
                </div>
                <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-1">
                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-0 mt-auto">
                <Link href={`/news/${item.id}`} className="w-full">
                  <Button variant="ghost" className="w-full justify-between group/btn hover:bg-primary/5 text-primary p-0">
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Belum ada berita</h3>
          <p className="text-slate-500 mt-1">Kembali lagi nanti untuk informasi terbaru.</p>
        </div>
      )}
    </div>
  );
}
