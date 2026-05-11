'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Upload, UserCheck, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthStore } from '@/stores/auth-store';

const formSchema = z.object({
  // Identitas (Now read-only or confirmed from profile)
  nim: z.string(),
  name: z.string(),
  email: z.string(),
  isAnonymous: z.boolean(),
  
  // Step 2: Isi Aspirasi
  title: z.string().min(1, 'Judul wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  attachments: z.array(z.object({
    fileName: z.string(),
    filePath: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAspirationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadingProgress] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nim: user?.nim || '',
      name: user?.name || '',
      email: user?.email || '',
      isAnonymous: false,
      title: '',
      categoryId: '',
      description: '',
      attachments: [],
    },
  });

  // Sync user data once loaded
  useEffect(() => {
    if (user) {
      form.setValue('nim', user.nim || '');
      form.setValue('name', user.name);
      form.setValue('email', user.email);
    }
  }, [user, form]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        toast.error('Gagal memuat kategori.');
      }
    }
    fetchCategories();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadingProgress(0);
    const uploadedAttachments: any[] = [...(form.getValues('attachments') || [])];

    try {
      const totalFiles = files.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/aspirations/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const fileProgress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total) 
              : 0;
            // Overall progress based on current file and total files
            const totalProgress = Math.round(((i * 100) + fileProgress) / totalFiles);
            setUploadingProgress(totalProgress);
          }
        });

        uploadedAttachments.push({
          fileName: file.name,
          filePath: response.data.url,
          fileType: file.type,
          fileSize: file.size,
        });
        
        // Ensure progress hits 100% for this file
        setUploadingProgress(Math.round(((i + 1) * 100) / totalFiles));
      }
      form.setValue('attachments', uploadedAttachments);
      toast.success(`${files.length} file berhasil diunggah.`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mengunggah file.';
      toast.error(errorMsg);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadingProgress(0);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 2) {
      fieldsToValidate = ['title', 'categoryId', 'description'];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const response = await api.post('/aspirations', values);
      toast.success('Aspirasi berhasil dikirim!');
      router.push(`/aspirasi/tracking/${response.data.aspirationCode}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim aspirasi.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-4 md:py-8 px-4">
        {/* Stepper UI - Mobile Friendly */}
        <div className="mb-6 md:mb-10 flex justify-between items-center relative max-w-sm mx-auto px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center z-10">
              <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step === s ? 'border-primary bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/10' : 
                step > s ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground bg-white'
              }`}>
                {step > s ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <span className="text-sm md:text-base font-bold">{s}</span>}
              </div>
              <span className={`text-[9px] md:text-xs mt-2 font-black uppercase tracking-widest ${
                step === s ? 'text-primary' : 'text-muted-foreground'
              } hidden sm:block`}>
                {s === 1 ? 'Privasi' : s === 2 ? 'Isi Aspirasi' : 'Kirim'}
              </span>
              <span className={`text-[8px] mt-1.5 font-black uppercase tracking-tighter ${
                step === s ? 'text-primary' : 'text-muted-foreground'
              } sm:hidden`}>
                {s === 1 ? 'Privasi' : s === 2 ? 'Isi' : 'Kirim'}
              </span>
            </div>
          ))}
          <div className="absolute top-4.5 md:top-6 left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
        </div>

        <Card className="border-none shadow-xl md:shadow-2xl md:border bg-white/80 backdrop-blur-md rounded-[2rem]">
          <CardHeader className="space-y-1 p-5 md:p-8 pb-1 md:pb-4">
            <CardTitle className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">
              {step === 1 && 'Pengaturan Privasi'}
              {step === 2 && 'Sampaikan Aspirasi'}
              {step === 3 && 'Tinjau Laporan'}
            </CardTitle>
            <CardDescription className="text-[10px] md:text-sm font-medium">
              {step === 1 && 'Pilih bagaimana identitas Anda ditampilkan.'}
              {step === 2 && 'Jelaskan aspirasi Anda secara detail.'}
              {step === 3 && 'Pastikan data sudah benar sebelum dikirim.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                {step === 1 && (
                  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl shadow-lg flex items-start gap-3 md:gap-4">
                      <div className="bg-white/10 p-2 md:p-2.5 rounded-xl shrink-0">
                        <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        <p className="text-sm md:text-base font-black tracking-tight">{user?.name}</p>
                        <p className="text-[10px] md:text-xs text-slate-300 font-medium">{user?.nim} • {user?.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 md:mt-2 bg-white/10 w-fit px-2 py-0.5 rounded-md">
                          <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                          <p className="text-[8px] md:text-[10px] font-bold uppercase">Terverifikasi</p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="isAnonymous"
                      render={({ field }) => (
                        <div className="space-y-4">
                          <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-4 md:p-5 transition-all hover:border-primary/50 bg-white">
                            <div className="space-y-0.5 md:space-y-1 pr-4">
                              <FormLabel className="text-sm md:text-base font-black text-slate-900">Kirim Anonim</FormLabel>
                              <FormDescription className="text-[10px] md:text-xs leading-relaxed">
                                Identitas Anda akan disembunyikan dari staf pengelola.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary scale-90 md:scale-100"
                              />
                            </FormControl>
                          </FormItem>

                          <div className="bg-emerald-50/50 p-4 md:p-6 rounded-[1.5rem] border border-emerald-100 flex gap-4 items-start shadow-sm">
                            <div className="bg-emerald-100 p-2 md:p-2.5 rounded-xl shrink-0 text-emerald-600">
                              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="space-y-1 md:space-y-1.5">
                              <h4 className="text-xs md:text-sm font-black text-emerald-900 uppercase tracking-tight">Jaminan Privasi MPA</h4>
                              <p className="text-[10px] md:text-xs text-emerald-700 leading-relaxed font-medium">
                                Sistem kami menggunakan enkripsi tingkat tinggi untuk mengamankan data Anda. 
                                {field.value 
                                  ? " Identitas Anda hanya dapat dibuka oleh Ketua Komisi melalui mekanisme audit ketat jika terjadi laporan yang melanggar hukum serius."
                                  : " Nama dan NIM Anda akan tercantum secara resmi pada laporan guna mempercepat proses konfirmasi lapangan."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-slate-700">Judul Aspirasi</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contoh: Keluhan Fasilitas Lab" 
                              className="rounded-xl border-slate-200 focus:ring-primary h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-slate-700">Kategori</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                <SelectValue placeholder="Pilih kategori masalah">
                                  {field.value ? categories.find(c => c.id === field.value)?.name : undefined}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="rounded-lg">
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-slate-700">Detail Aspirasi</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Jelaskan secara detail..." 
                              className="min-h-[180px] rounded-xl border-slate-200 focus:ring-primary resize-none p-4"
                              {...field} 
                            />
                          </FormControl>
                          <div className="flex justify-between items-center mt-1">
                            <FormDescription className="text-[10px]">
                              Berikan kronologi atau detail pendukung yang jelas.
                            </FormDescription>
                          </div>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-3">
                      <FormLabel className="font-bold text-slate-700">Lampiran Bukti (Opsional)</FormLabel>
                      <div className="grid grid-cols-1 gap-3">
                        <Input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          id="file-upload" 
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <label 
                          htmlFor="file-upload" 
                          className="flex flex-col items-center justify-center gap-2 px-4 py-8 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer transition-all hover:border-primary group relative overflow-hidden"
                        >
                          {uploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4">
                              <div className="w-full max-w-[200px] bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                                <div 
                                  className="bg-primary h-full transition-all duration-300 ease-out" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                                Mengunggah ({uploadProgress}%)
                              </span>
                            </div>
                          )}
                          <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {uploading ? 'Sedang Mengunggah...' : 'Klik untuk Pilih File atau Foto'}
                          </span>
                          <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Maks 10MB)</span>
                        </label>
                        
                        {(form.watch('attachments') ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(form.watch('attachments') ?? []).map((file: any, i: number) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {file.fileName.length > 15 ? file.fileName.substring(0, 12) + '...' : file.fileName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50/50">
                      <div className="bg-slate-100 px-5 py-3 border-b flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Ringkasan Laporan</span>
                        <Badge className={form.watch('isAnonymous') ? 'bg-orange-500' : 'bg-green-500'}>
                          {form.watch('isAnonymous') ? 'Anonim' : 'Publik'}
                        </Badge>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Judul</p>
                          <p className="text-base font-bold text-slate-900 leading-tight">{form.watch('title')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Kategori</p>
                            <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                              {categories.find(c => c.id === form.watch('categoryId'))?.name}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Lampiran</p>
                            <p className="text-sm font-bold text-slate-700">{form.watch('attachments')?.length || 0} File</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Deskripsi</p>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 italic">
                            "{form.watch('description')}"
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                      <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                        Dengan menekan tombol kirim, Anda menyatakan bahwa data yang diberikan adalah benar dan bersedia untuk dikonfirmasi oleh Komisi Aspirasi jika diperlukan.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-4 border-t">
                  {step > 1 ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep} 
                      className="rounded-xl px-6 font-bold text-slate-600 hover:bg-slate-50 h-12"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep} 
                      className="rounded-xl px-8 font-black shadow-lg shadow-primary/20 hover:shadow-xl transition-all h-12"
                    >
                      Lanjut <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="rounded-xl px-10 font-black shadow-lg shadow-primary/30 hover:shadow-2xl transition-all bg-primary h-12"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Mengirim...
                        </div>
                      ) : (
                        'Kirim Aspirasi Sekarang'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
