'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  ArrowRight, 
  ClipboardCheck, 
  BarChart3, 
  Send,
  User,
  Calendar,
  FileDown,
  Eye,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ValidationForm from '@/components/forms/validation-form';
import ClassificationForm from '@/components/forms/classification-form';
import DispositionForm from '@/components/forms/disposition-form';
import InternalAnalysisForm from '@/components/forms/internal-analysis-form';
import { MonitoringLogs } from '@/components/monitoring-logs';
import { HearingModule } from '@/components/hearing-module';
import { InternalComments } from '@/components/internal-comments';
import { useAuthStore } from '@/stores/auth-store';
import { useSocket } from '@/hooks/use-socket';
import { useEffect } from 'react';

export default function AspirationDetailPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (socket && id) {
      socket.emit('subscribeToAspiration', id);
      socket.on('statusChanged', (data) => {
        toast.info(`Status aspirasi berubah menjadi ${data.toStatus}`);
        queryClient.invalidateQueries({ queryKey: ['aspiration', id] });
      });

      return () => {
        socket.off('statusChanged');
      };
    }
  }, [socket, id, queryClient]);

  const [modalOpen, setModalOpen] = useState<'validation' | 'classification' | 'disposition' | 'analysis' | null>(null);
  const [revealedIdentity, setRevealedIdentity] = useState<{ nim: string; name: string } | null>(null);

  const { data: aspiration, isLoading } = useQuery({
    queryKey: ['aspiration', id],
    queryFn: async () => {
      const response = await api.get(`/aspirations/${id}`);
      return response.data;
    },
  });

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/aspirations/${id}/disposition/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `disposisi-${aspiration.aspirationCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Gagal mengunduh PDF');
    }
  };

  const handleRevealIdentity = async () => {
    try {
      const response = await api.get(`/aspirations/${id}/reveal-identity`);
      setRevealedIdentity(response.data);
      toast.success('Identitas berhasil dibuka');
    } catch (error) {
      toast.error('Gagal membuka identitas');
    }
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ toStatus, note }: { toStatus: string; note?: string }) => {
      return api.post(`/aspirations/${id}/transition`, { toStatus, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspiration', id] });
      toast.success('Status berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui status');
    },
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-[500px] w-full" /></div>;

  const handleSimpleTransition = (toStatus: string, note: string) => {
    transitionMutation.mutate({ toStatus, note });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {aspiration.aspirationCode}
            <Badge variant="outline" className="text-lg py-1 px-3">
              {aspiration.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm">
            Kategori: {aspiration.category.name} | Dikirim: {new Date(aspiration.createdAt).toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          {aspiration.dispositions && aspiration.dispositions.length > 0 && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileDown className="w-4 h-4 mr-2" /> Unduh Disposisi
            </Button>
          )}
          {aspiration.status === 'SUBMITTED' && (
            <Button onClick={() => handleSimpleTransition('LOGGED', 'Aspirasi diakui penerimaannya oleh admin.')} disabled={transitionMutation.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Akui Penerimaan
            </Button>
          )}
          {aspiration.status === 'LOGGED' && (
            <Button onClick={() => handleSimpleTransition('VALIDATING', 'Memulai proses verifikasi keabsahan.')} disabled={transitionMutation.isPending}>
              <ArrowRight className="w-4 h-4 mr-2" /> Mulai Validasi
            </Button>
          )}
          {aspiration.status === 'VALIDATING' && (
            <Button variant="default" onClick={() => setModalOpen('validation')}>
              <ClipboardCheck className="w-4 h-4 mr-2" /> Isi Form Validasi
            </Button>
          )}
          {aspiration.status === 'VERIFIED' && (
            <Button variant="default" onClick={() => setModalOpen('classification')}>
              <BarChart3 className="w-4 h-4 mr-2" /> Klasifikasi & Scoring
            </Button>
          )}
          {aspiration.status === 'CLASSIFIED' && (
            <Button variant="default" onClick={() => setModalOpen('analysis')} className="bg-indigo-600 hover:bg-indigo-700">
              <FileText className="w-4 h-4 mr-2" /> Kajian Internal (SOP-05)
            </Button>
          )}
          {aspiration.status === 'CLASSIFIED' && aspiration.internalAnalysis && (
            <Button variant="default" onClick={() => setModalOpen('disposition')}>
              <Send className="w-4 h-4 mr-2" /> Buat Surat Disposisi
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{aspiration.title}</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3 h-3" /> 
                    {aspiration.isAnonymous ? (
                      revealedIdentity ? `${revealedIdentity.name} (${revealedIdentity.nim})` : 'Pelapor Anonim'
                    ) : aspiration.user.name}
                  </span>
                  {aspiration.isAnonymous && (currentUser?.roles.includes('ADMIN') || currentUser?.roles.includes('KETUA_KOMISI')) && !revealedIdentity && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={handleRevealIdentity}>
                      <Eye className="w-3 h-3 mr-1" /> Buka Identitas
                    </Button>
                  )}
                  {aspiration.priorityLevel && (
                    <Badge variant={aspiration.priorityLevel === 'CRITICAL' ? 'destructive' : 'secondary'}>
                      Prioritas: {aspiration.priorityLevel}
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-md border text-slate-800">
                <p className="whitespace-pre-wrap">{aspiration.description}</p>
              </div>

              {aspiration.attachments && aspiration.attachments.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-primary" />
                    Lampiran Bukti ({aspiration.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aspiration.attachments.map((file: any) => (
                      <a 
                        key={file.id} 
                        href={file.filePath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 bg-slate-100 rounded mr-3 group-hover:bg-primary/10 transition-colors">
                          <FileDown className="w-4 h-4 text-slate-600 group-hover:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{file.fileName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{file.fileType.split('/')[1]} • {(file.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {aspiration.validationForm && (
            <Card className="border-green-100 bg-green-50/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-green-600" /> Hasil Validasi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <div className="flex justify-between"><span>Identitas Valid:</span> <span className="font-bold">{aspiration.validationForm.criteria1 ? 'Ya' : 'Tidak'}</span></div>
                  <div className="flex justify-between"><span>Lokasi Jelas:</span> <span className="font-bold">{aspiration.validationForm.criteria2 ? 'Ya' : 'Tidak'}</span></div>
                  <div className="flex justify-between"><span>Bukti Cukup:</span> <span className="font-bold">{aspiration.validationForm.criteria3 ? 'Ya' : 'Tidak'}</span></div>
                  <div className="flex justify-between"><span>Masalah Jelas:</span> <span className="font-bold">{aspiration.validationForm.criteria4 ? 'Ya' : 'Tidak'}</span></div>
                  <div className="flex justify-between"><span>Relevan:</span> <span className="font-bold">{aspiration.validationForm.criteria5 ? 'Ya' : 'Tidak'}</span></div>
                </div>
                {aspiration.validationForm.notes && (
                  <div className="mt-2 pt-2 border-t border-green-100">
                    <span className="text-muted-foreground italic font-medium">Catatan: {aspiration.validationForm.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {aspiration.classificationForm && (
            <Card className="border-blue-100 bg-blue-50/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> Hasil Klasifikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-lg font-bold text-blue-700">Skor: {aspiration.priorityScore}</div>
                  <Badge>{aspiration.priorityLevel}</Badge>
                </div>
                {aspiration.classificationForm.notes && (
                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <span className="text-muted-foreground italic font-medium">Catatan: {aspiration.classificationForm.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {aspiration.internalAnalysis && (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700">
                  <FileText className="w-4 h-4" /> Hasil Kajian Internal (SOP-05)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-4">
                <div>
                  <h5 className="font-bold text-indigo-900 uppercase text-[10px] mb-1">Notulensi Rapat:</h5>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-indigo-50">{aspiration.internalAnalysis.notulensi}</p>
                </div>
                <div>
                  <h5 className="font-bold text-indigo-900 uppercase text-[10px] mb-1">Rekomendasi Tim:</h5>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-indigo-50">{aspiration.internalAnalysis.rekomendasi}</p>
                </div>
                <div>
                  <h5 className="font-bold text-indigo-900 uppercase text-[10px] mb-1">Rencana Aksi (Action Plan):</h5>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-indigo-50">{aspiration.internalAnalysis.rencanaAksi}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {aspiration.dispositions && aspiration.dispositions.length > 0 && (
            <Card className="border-orange-100 bg-orange-50/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-orange-600" /> Histori Disposisi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aspiration.dispositions.map((d: any) => (
                  <div key={d.id} className="text-xs border-b border-orange-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between font-bold text-orange-800">
                      <span>PIC: {d.sentTo}</span>
                      <span>DL: {new Date(d.deadline).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-slate-700"><strong>Ringkasan:</strong> {d.summary}</p>
                    <p className="mt-0.5 text-slate-700"><strong>Rekomendasi:</strong> {d.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <MonitoringLogs aspirationId={aspiration.id} />
          <HearingModule aspirationId={aspiration.id} />
          <InternalComments aspirationId={aspiration.id} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 font-bold"><Calendar className="w-4 h-4" /> Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-6 space-y-4">
                {aspiration.statusLogs?.map((log: any) => (
                  <div key={log.id} className="relative pl-6 border-l border-slate-200 pb-2 last:pb-0 last:border-l-transparent">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                    <div className="text-xs font-bold uppercase">{log.toStatus}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                    {log.note && <div className="text-[10px] mt-1 text-slate-600 italic font-medium leading-relaxed">{log.note}</div>}
                    <div className="text-[9px] text-muted-foreground mt-1">Oleh: {log.changedBy?.name || 'System'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={modalOpen === 'validation'} onOpenChange={(open) => !open && setModalOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Form Validasi & Verifikasi</DialogTitle>
            <DialogDescription>Pastikan aspirasi memenuhi kriteria keabsahan sebelum diproses lebih lanjut.</DialogDescription>
          </DialogHeader>
          <ValidationForm aspirationId={aspiration.id} onSuccess={() => setModalOpen(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'classification'} onOpenChange={(open) => !open && setModalOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Klasifikasi & Priority Scoring</DialogTitle>
            <DialogDescription>Tentukan tingkat urgensi dan dampak untuk menghitung skor prioritas otomatis.</DialogDescription>
          </DialogHeader>
          <ClassificationForm aspirationId={aspiration.id} onSuccess={() => setModalOpen(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'disposition'} onOpenChange={(open) => !open && setModalOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Surat Disposisi Digital</DialogTitle>
            <DialogDescription>Diteruskan kepada PIC terkait untuk tindak lanjut operasional.</DialogDescription>
          </DialogHeader>
          <DispositionForm aspirationId={aspiration.id} onSuccess={() => setModalOpen(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen === 'analysis'} onOpenChange={(open) => !open && setModalOpen(null)}>
        <DialogContent className="sm:max-w-lg font-serif">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Kajian Internal Aspirasi (SOP-05)
            </DialogTitle>
            <DialogDescription>
              Dokumentasikan hasil rapat kajian dan rencana aksi tim Komisi Aspirasi.
            </DialogDescription>
          </DialogHeader>
          <InternalAnalysisForm 
            aspirationId={aspiration.id} 
            initialData={aspiration.internalAnalysis}
            onSuccess={() => setModalOpen(null)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
