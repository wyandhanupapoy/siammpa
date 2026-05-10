'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, MessageSquarePlus, CheckCircle2, XCircle, Clock, Link as LinkIcon, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function QuestionnaireDashboard() {
  const queryClient = useQueryClient();

  const { data: questionnaires, isLoading: isQLoading } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      const response = await api.get('/questionnaires');
      return response.data;
    },
  });

  const { data: requests, isLoading: isRLoading } = useQuery({
    queryKey: ['questionnaire-requests'],
    queryFn: async () => {
      const response = await api.get('/questionnaires/requests');
      return response.data;
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, formUrl }: { id: string; formUrl: string }) => {
      return api.put(`/questionnaires/${id}/link`, { formUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Link Google Form berhasil diperbarui');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.put(`/questionnaires/${id}`, { status: 'PUBLISHED', startDate: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Kuesioner dipublikasikan');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/questionnaires/requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-requests'] });
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Permintaan kuesioner disetujui');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.post(`/questionnaires/requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-requests'] });
      toast.success('Permintaan kuesioner ditolak');
    },
  });

  if (isQLoading || isRLoading) return <div className="p-8">Memuat data kuesioner...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Kuesioner</h1>
        <p className="text-muted-foreground text-sm">Sesuai SOP-MPA-KSR-2026: Kelola kuesioner resmi, evaluasi, dan permintaan data.</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Daftar Kuesioner
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4" /> Permintaan (KSR-F)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionnaires?.map((q: any) => (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{q.type}</Badge>
                    <div className="flex gap-1">
                      {q.isInternal ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[9px]">Internal</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-[9px]">Google Form</Badge>
                      )}
                      <Badge className="text-[9px]">{q.status}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{q.title}</CardTitle>
                  <CardDescription className="text-xs font-mono">{q.code}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {q.description || 'Tidak ada deskripsi.'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>PIC: {q.pic?.name || 'Belum ditunjuk'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {q.status === 'DRAFT' ? (
                      <Button size="sm" className="col-span-2 text-xs" onClick={() => publishMutation.mutate(q.id)} disabled={publishMutation.isPending}>
                        Publikasikan
                      </Button>
                    ) : q.formUrl ? (
                      <a 
                        href={q.formUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Buka Form
                      </a>
                    ) : q.isInternal ? (
                      <Button variant="outline" size="sm" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" /> Portal Isi
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => {
                          const url = prompt('Masukkan URL Google Form:');
                          if (url) updateLinkMutation.mutate({ id: q.id, formUrl: url });
                        }}
                      >
                        <LinkIcon className="w-3 h-3 mr-1" /> Set Link
                      </Button>
                    )}
                    <Link 
                      href={`/dashboard/kuesioner/${q.id}/analysis`}
                      className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), "text-xs", q.status === 'DRAFT' && "pointer-events-none opacity-50")}
                    >
                      Hasil & Analisis
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {questionnaires?.length === 0 && (
            <p className="text-center text-muted-foreground py-12 italic">Belum ada kuesioner yang dibuat.</p>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Pembuatan Kuesioner</CardTitle>
              <CardDescription>Daftar permintaan dari BPH atau internal MPA (KSR-F).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/50">
                      <th className="p-4 text-left font-bold">Pemohon</th>
                      <th className="p-4 text-left font-bold">Tujuan</th>
                      <th className="p-4 text-left font-bold">Target</th>
                      <th className="p-4 text-left font-bold">Deadline</th>
                      <th className="p-4 text-left font-bold">Status</th>
                      <th className="p-4 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests?.map((r: any) => (
                      <tr key={r.id} className="border-b transition-colors hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-medium">{r.requesterName}</div>
                          <div className="text-xs text-muted-foreground">{r.requesterRole}</div>
                        </td>
                        <td className="p-4 max-w-[200px]">
                          <div className="truncate" title={r.purpose}>{r.purpose}</div>
                        </td>
                        <td className="p-4">{r.targetRespondent}</td>
                        <td className="p-4 text-xs">{new Date(r.requestedDeadline).toLocaleDateString()}</td>
                        <td className="p-4">
                          <Badge variant={r.status === 'PENDING' ? 'secondary' : r.status === 'APPROVED' ? 'default' : 'destructive'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {r.status === 'PENDING' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-green-600 h-8 w-8"
                                onClick={() => approveMutation.mutate(r.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-600 h-8 w-8"
                                onClick={() => {
                                  const reason = prompt('Alasan penolakan:');
                                  if (reason) rejectMutation.mutate({ id: r.id, reason });
                                }}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground italic">Belum ada permintaan masuk.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
