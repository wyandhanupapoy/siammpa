'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  FileText, 
  MessageSquare, 
  User, 
  Calendar,
  AlertCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import InternalAnalysisForm from '@/components/forms/internal-analysis-form';
import { toast } from 'sonner';

export default function TopicDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: async () => {
      const response = await api.get(`/topics/${id}`);
      return response.data;
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/topics/${id}/analysis`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
      toast.success('Kajian massal berhasil disimpan');
    },
  });

  if (isLoading) return <div className="p-8 space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-[500px] w-full" /></div>;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Button>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Kelompok Topik</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Topic Info & Aspirations List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-2xl">{topic.name}</CardTitle>
              <CardDescription>{topic.description || 'Tidak ada deskripsi.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                <MessageSquare className="w-4 h-4 text-primary" />
                Daftar Aspirasi ({topic.aspirations.length})
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {topic.aspirations.map((asp: any) => (
                  <Card key={asp.id} className="p-3 bg-slate-50 border-none hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => window.open(`/dashboard/aspirasi/${asp.id}`, '_blank')}>
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className="text-[9px] h-4">{asp.aspirationCode}</Badge>
                      <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs font-bold line-clamp-1">{asp.title}</p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground">
                      <User className="w-2.5 h-2.5" /> {asp.user.name}
                      <span>•</span>
                      <Calendar className="w-2.5 h-2.5" /> {new Date(asp.createdAt).toLocaleDateString()}
                    </div>
                  </Card>
                ))}
                {topic.aspirations.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8 italic">Belum ada aspirasi dihubungkan.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Mass Analysis Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-indigo-50/50 border-b">
              <div className="flex items-center gap-2 text-indigo-700">
                <FileText className="w-5 h-5" />
                <CardTitle>Kajian Massal (SOP-05)</CardTitle>
              </div>
              <CardDescription className="text-indigo-600/80">
                Lakukan satu kajian mendalam untuk seluruh aspirasi di dalam topik ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InternalAnalysisForm 
                aspirationId="dummy" // We use topic level analysis
                initialData={topic.internalAnalysis}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['topic', id] })}
                // Custom submit for topic level
                customSubmit={async (data) => {
                  await saveAnalysisMutation.mutateAsync(data);
                }}
              />
            </CardContent>
            {topic.internalAnalysis && (
              <CardFooter className="bg-emerald-50 border-t border-emerald-100 py-3">
                <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kajian ini akan menjadi landasan bagi {topic.aspirations.length} aspirasi terkait.
                </p>
              </CardFooter>
            )}
          </Card>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">Catatan Penting:</p>
              Kajian massal memudahkan Anda dalam merumuskan solusi untuk masalah sistemik. Setelah kajian selesai, Anda tetap perlu memperbarui status masing-masing aspirasi atau melakukan disposisi massal jika diperlukan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
