'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Calendar, Newspaper, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export function NewsFeed() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['latest-news'],
    queryFn: async () => {
      const response = await api.get('/news');
      return response.data.slice(0, 5); // Menampilkan 5 berita terbaru
    },
  });

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible gap-6 no-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[400px] min-w-[280px] md:min-w-0 w-full rounded-[2rem] flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
        <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Belum ada berita terbaru saat ini.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible gap-4 md:gap-6 no-scrollbar">
      {news.map((item: any) => (
        <Link key={item.id} href={`/news/${item.id}`} className="group flex-shrink-0 min-w-[280px] md:min-w-0">
          <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-500 border-none shadow-lg flex flex-col rounded-[2rem] md:rounded-[2.5rem] bg-white border border-slate-100/50">
            <div className="relative h-40 md:h-56 w-full overflow-hidden bg-slate-100">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ objectPosition: 'center' }}
                  />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="w-10 h-10 md:w-12 md:h-12" />
                </div>
              )}
              <div className="absolute top-3 left-3 md:top-4 md:left-4">
                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-bold shadow-sm text-[10px] md:text-xs">
                  Berita
                </Badge>
              </div>
            </div>
            <CardHeader className="p-4 md:p-6 pb-1 md:pb-2">
              <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 md:mb-3">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <CardTitle className="text-lg md:text-xl font-black text-slate-900 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-1 md:pt-2 flex-1">
              <p className="text-xs md:text-sm text-slate-600 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed">
                {item.content}
              </p>
              <div className="mt-4 md:mt-6 flex items-center text-[10px] md:text-xs font-black text-primary uppercase tracking-wider group-hover:gap-2 transition-all">
                Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
