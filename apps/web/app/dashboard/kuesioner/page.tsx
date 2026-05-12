'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileCheck2,
  Globe,
  Link as LinkIcon,
  MessageSquarePlus,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID');
}

function getStatusVariant(status: string) {
  if (status === 'PUBLISHED' || status === 'APPROVED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}

export default function QuestionnaireDashboard() {
  const queryClient = useQueryClient();

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
    queryClient.invalidateQueries({ queryKey: ['questionnaire-requests'] });
  };

  const { data: questionnaires = [], isLoading: isQLoading } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      const response = await api.get('/questionnaires');
      return response.data;
    },
  });

  const { data: requests = [], isLoading: isRLoading } = useQuery({
    queryKey: ['questionnaire-requests'],
    queryFn: async () => {
      const response = await api.get('/questionnaires/requests');
      return response.data;
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, formUrl }: { id: string; formUrl: string }) =>
      api.put(`/questionnaires/${id}/link`, { formUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Link Google Form berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal memperbarui link formulir.',
      );
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/questionnaires/${id}/submit-review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Kuesioner berhasil diajukan untuk review');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal mengajukan kuesioner ke review.',
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/questionnaires/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      toast.success('Kuesioner berhasil dipublikasikan');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal mempublikasikan kuesioner.',
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/questionnaires/requests/${id}/approve`),
    onSuccess: () => {
      invalidateData();
      toast.success('Permintaan kuesioner berhasil disetujui');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal menyetujui permintaan kuesioner.',
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/questionnaires/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-requests'] });
      toast.success('Permintaan kuesioner berhasil ditolak');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal menolak permintaan kuesioner.',
      );
    },
  });

  if (isQLoading || isRLoading) {
    return <div className="p-8">Memuat data kuesioner...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Kuesioner</h1>
        <p className="text-muted-foreground text-sm">
          Kelola permintaan, persiapan review, publikasi, respons, dan kajian
          kuesioner dalam satu alur yang konsisten.
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Daftar Kuesioner
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4" /> Permintaan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {questionnaires.map((q: any) => {
              const isDraft = q.status === 'DRAFT';
              const isUnderReview = q.status === 'UNDER_REVIEW';
              const hasExternalForm = Boolean(q.formUrl);

              return (
                <Card key={q.id} className="flex h-full flex-col">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="outline">{q.type}</Badge>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge variant="secondary">
                          {q.isInternal ? 'Internal' : 'Eksternal'}
                        </Badge>
                        <Badge variant={getStatusVariant(q.status)}>{q.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {q.code}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                    <div className="space-y-3 text-sm">
                      <p className="line-clamp-3 text-muted-foreground">
                        {q.description || 'Belum ada deskripsi kuesioner.'}
                      </p>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>PIC: {q.pic?.name || 'Belum ditentukan'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          <span>Respons masuk: {q._count?.responses || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>
                            Periode: {formatDate(q.startDate)} - {formatDate(q.endDate)}
                          </span>
                        </div>
                        {q.request && (
                          <div className="rounded-md border bg-slate-50 p-2 text-[11px]">
                            Request: {q.request.requesterName} / {q.request.targetRespondent}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {isDraft && !q.isInternal && !hasExternalForm && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={updateLinkMutation.isPending}
                          onClick={() => {
                            const url = window.prompt('Masukkan URL Google Form:');
                            if (url) {
                              updateLinkMutation.mutate({ id: q.id, formUrl: url });
                            }
                          }}
                        >
                          <LinkIcon className="mr-1 h-3.5 w-3.5" /> Set Link
                        </Button>
                      )}

                      {isDraft && (
                        <Button
                          size="sm"
                          className={cn(
                            'text-xs',
                            !q.isInternal && !hasExternalForm && 'col-span-1',
                            (q.isInternal || hasExternalForm) && 'col-span-2',
                          )}
                          disabled={submitReviewMutation.isPending}
                          onClick={() => submitReviewMutation.mutate(q.id)}
                        >
                          <FileCheck2 className="mr-1 h-3.5 w-3.5" /> Ajukan Review
                        </Button>
                      )}

                      {isUnderReview && (
                        <Button
                          size="sm"
                          className="col-span-2 text-xs"
                          disabled={publishMutation.isPending}
                          onClick={() => publishMutation.mutate(q.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Publikasikan
                        </Button>
                      )}

                      {!isDraft && !isUnderReview && hasExternalForm && (
                        <a
                          href={q.formUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            'text-xs',
                          )}
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka Form
                        </a>
                      )}

                      {!isDraft && !isUnderReview && q.isInternal && (
                        <Button variant="outline" size="sm" className="text-xs" disabled>
                          <Globe className="mr-1 h-3.5 w-3.5" /> Internal Form
                        </Button>
                      )}

                      <Link
                        href={`/dashboard/kuesioner/${q.id}/analysis`}
                        className={cn(
                          buttonVariants({ variant: 'secondary', size: 'sm' }),
                          'text-xs',
                          (isDraft || isUnderReview) && 'col-span-2',
                        )}
                      >
                        Hasil & Analisis
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {questionnaires.length === 0 && (
            <p className="py-12 text-center italic text-muted-foreground">
              Belum ada kuesioner yang dibuat.
            </p>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Pembuatan Kuesioner</CardTitle>
              <CardDescription>
                Tinjau permintaan, buat draft kuesioner, dan pantau hasil approval
                dalam satu tabel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/50">
                      <th className="p-4 text-left font-bold">Pemohon</th>
                      <th className="p-4 text-left font-bold">Tujuan</th>
                      <th className="p-4 text-left font-bold">Kontak</th>
                      <th className="p-4 text-left font-bold">Deadline</th>
                      <th className="p-4 text-left font-bold">Status</th>
                      <th className="p-4 text-left font-bold">Kuesioner</th>
                      <th className="p-4 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r: any) => (
                      <tr
                        key={r.id}
                        className="border-b transition-colors hover:bg-slate-50/50"
                      >
                        <td className="p-4 align-top">
                          <div className="font-medium">{r.requesterName}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.requesterRole}
                          </div>
                          {r.estimatedCount ? (
                            <div className="text-xs text-muted-foreground">
                              Estimasi responden: {r.estimatedCount}
                            </div>
                          ) : null}
                        </td>
                        <td className="max-w-[260px] p-4 align-top">
                          <div className="line-clamp-3" title={r.purpose}>
                            {r.purpose}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Target: {r.targetRespondent}
                          </div>
                        </td>
                        <td className="p-4 align-top text-xs">{r.contactInfo}</td>
                        <td className="p-4 align-top text-xs">
                          {formatDate(r.requestedDeadline)}
                        </td>
                        <td className="p-4 align-top">
                          <Badge variant={getStatusVariant(r.status)}>{r.status}</Badge>
                          {r.rejectionReason && (
                            <div className="mt-2 max-w-[200px] text-xs text-red-600">
                              {r.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-top text-xs">
                          {r.questionnaire ? (
                            <div className="space-y-1">
                              <div className="font-mono">{r.questionnaire.code}</div>
                              <div className="text-muted-foreground">
                                {r.questionnaire.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Belum dibuat</span>
                          )}
                        </td>
                        <td className="p-4 text-right align-top">
                          {r.status === 'PENDING' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(r.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                disabled={rejectMutation.isPending}
                                onClick={() => {
                                  const reason = window.prompt('Alasan penolakan:');
                                  if (reason) {
                                    rejectMutation.mutate({ id: r.id, reason });
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Tidak ada aksi
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {requests.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center italic text-muted-foreground"
                        >
                          Belum ada permintaan masuk.
                        </td>
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
