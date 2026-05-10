'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  BarChart3, 
  ChevronLeft, 
  Save, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export default function QuestionnaireAnalysisPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    summary: '',
    keyFindings: '',
    recommendations: '',
    reportFileUrl: ''
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ['questionnaire-results', id],
    queryFn: async () => {
      const response = await api.get(`/questionnaires/${id}/results`);
      return response.data;
    },
  });

  useEffect(() => {
    if (result?.questionnaire?.analysis) {
      const analysis = result.questionnaire.analysis;
      setFormData({
        summary: analysis.summary || '',
        keyFindings: analysis.keyFindings || '',
        recommendations: analysis.recommendations || '',
        reportFileUrl: analysis.reportFileUrl || ''
      });
    }
  }, [result]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post(`/questionnaires/${id}/analysis`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-results', id] });
      toast.success('Laporan kajian berhasil disimpan');
    },
    onError: () => {
      toast.error('Gagal menyimpan laporan kajian');
    }
  });

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-1/4" /><Skeleton className="h-[600px] w-full" /></div>;

  const { questionnaire, totalResponses, processedStats, needsUrgentAction } = result;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Button>
        <Badge variant="outline" className="font-mono">{questionnaire.code}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats & Charts Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Responden</CardTitle>
              <CardDescription className="text-3xl font-bold text-white">{totalResponses}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] opacity-70 italic font-medium">Data diperbarui otomatis dari sistem.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Rangkuman Skor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processedStats.length > 0 ? (
                processedStats.map((stat: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="truncate max-w-[150px]">Kriteria {idx + 1}</span>
                      <span className={stat.isBelowThreshold ? "text-destructive" : "text-emerald-600"}>
                        {stat.average.toFixed(2)} / 5.0
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${stat.isBelowThreshold ? "bg-destructive" : "bg-emerald-500"}`} 
                        style={{ width: `${(stat.average / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs italic">
                  Belum ada data respons yang masuk.
                </div>
              )}
            </CardContent>
            {needsUrgentAction && (
              <CardFooter className="bg-red-50 border-t border-red-100 py-3">
                <p className="text-[10px] text-red-700 flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> AMBANG BATAS PRIORITAS TERLEWATI (SOP 5.3)
                </p>
              </CardFooter>
            )}
          </Card>

          <Card className="bg-slate-50 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Komentar Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto px-6 pb-6 space-y-3">
                {questionnaire.responses.slice(0, 5).map((res: any, idx: number) => (
                  <div key={idx} className="text-[10px] bg-white p-2 rounded border italic text-slate-600">
                    "{res.answers.comment || 'Tanpa komentar'}"
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Analysis Form (SOP Lampiran M) */}
        <div className="lg:col-span-2">
          <Card className="h-full border-t-4 border-t-primary">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Laporan Kajian Kuesioner (Lampiran M)</CardTitle>
              </div>
              <CardDescription>
                Isi form ini sesuai hasil analisis tim Komisi Aspirasi untuk didokumentasikan secara digital.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="summary" className="font-bold flex items-center gap-2">
                  1. Ringkasan Eksekutif
                  {formData.summary === '' && <span className="text-[10px] font-normal text-red-500">*Wajib</span>}
                </Label>
                <Textarea 
                  id="summary"
                  placeholder="Gambaran umum mengenai tujuan kuesioner dan tingkat partisipasi..."
                  className="min-h-[100px]"
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="keyFindings" className="font-bold">2. Temuan Utama (Key Findings)</Label>
                <Textarea 
                  id="keyFindings"
                  placeholder="Poin-poin krusial yang didapat dari data, tren positif/negatif, dll..."
                  className="min-h-[150px]"
                  value={formData.keyFindings}
                  onChange={(e) => setFormData({...formData, keyFindings: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="recommendations" className="font-bold">3. Saran & Rekomendasi Perbaikan</Label>
                <Textarea 
                  id="recommendations"
                  placeholder="Langkah konkret yang direkomendasikan untuk menindaklanjuti temuan..."
                  className="min-h-[120px]"
                  value={formData.recommendations}
                  onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label htmlFor="fileUrl" className="font-bold text-xs uppercase text-muted-foreground">Link Laporan PDF (Opsional)</Label>
                <Input 
                  id="fileUrl"
                  placeholder="https://drive.google.com/..."
                  value={formData.reportFileUrl}
                  onChange={(e) => setFormData({...formData, reportFileUrl: e.target.value})}
                />
                <p className="text-[10px] text-muted-foreground italic">Gunakan link jika Anda mengunggah berkas kajian fisik ke Google Drive resmi.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-end">
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.summary}
                className="w-full sm:w-auto px-8"
              >
                {saveMutation.isPending ? 'Menyimpan...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Simpan Kajian
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
