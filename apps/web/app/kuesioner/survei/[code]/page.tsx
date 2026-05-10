'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const criteria = [
  { id: 'q1', label: 'Seberapa puas Anda dengan cara Komisi Aspirasi menangani aspirasi Anda?', type: 'rating' },
  { id: 'q2', label: 'Komisi Aspirasi memberikan respons pertama dalam waktu yang wajar.', type: 'scale' },
  { id: 'q3', label: 'Anda selalu mendapat informasi terkini mengenai perkembangan aspirasi Anda.', type: 'scale' },
  { id: 'q4', label: 'Hasil tindak lanjut aspirasi Anda terasa memuaskan dan sesuai harapan.', type: 'scale' },
  { id: 'q5', label: 'Identitas dan privasi Anda dijaga dengan baik selama proses penanganan.', type: 'scale' },
];

export default function SatisfactionSurveyPage() {
  const { code } = useParams();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: questionnaire, isLoading } = useQuery({
    queryKey: ['survey-ksre', code],
    queryFn: async () => {
      const response = await api.get('/questionnaires');
      return response.data.find((q: any) => q.code === `KSR-E-${code}`);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/questionnaires/${questionnaire.id}/responses`, {
        answers: { ...answers, comment },
        // KSR-E is usually linked to specific aspiration, 
        // in real app we'd also link the response to the user
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Terima kasih! Penilaian Anda sangat berharga bagi kami.');
    },
    onError: () => {
      toast.error('Gagal mengirim kuesioner. Silakan coba lagi.');
    },
  });

  const handleRatingChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: parseInt(value) }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!questionnaire && !isLoading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Link Tidak Valid</h1>
        <p className="text-slate-500">Kuesioner tidak ditemukan atau sudah kedaluwarsa.</p>
        <Button onClick={() => router.push('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Kuesioner Terkirim!</h1>
          <p className="text-slate-500">
            Terima kasih telah berkontribusi dalam meningkatkan pelayanan Komisi Aspirasi MPA HIMAKOM POLBAN.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="w-full">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-serif">Kuesioner Kepuasan Pelapor (KSR-E)</h1>
        <p className="text-muted-foreground">ID Aspirasi: <span className="font-mono font-bold text-primary">{code}</span></p>
      </div>

      <Card className="border-t-8 border-t-emerald-600">
        <CardHeader>
          <CardTitle>Evaluasi Penanganan Aspirasi Anda</CardTitle>
          <CardDescription>
            Bantu kami menjadi lebih baik dengan memberikan penilaian jujur atas layanan yang Anda terima.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {criteria.map((item, index) => (
            <div key={item.id} className="space-y-4">
              <Label className="text-base leading-relaxed">
                {index + 1}. {item.label}
              </Label>
              
              <RadioGroup 
                onValueChange={(val) => handleRatingChange(item.id, val)}
                className="flex flex-wrap gap-4"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex flex-col items-center gap-2">
                    <RadioGroupItem 
                      value={num.toString()} 
                      id={`${item.id}-${num}`} 
                      className="sr-only peer" 
                    />
                    <Label
                      htmlFor={`${item.id}-${num}`}
                      className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 peer-data-[state=checked]:border-emerald-600 peer-data-[state=checked]:bg-emerald-50 peer-data-[state=checked]:text-emerald-700 cursor-pointer transition-all"
                    >
                      {item.type === 'rating' ? (
                        <Star className={`w-5 h-5 ${answers[item.id] >= num ? 'fill-current' : ''}`} />
                      ) : (
                        <span className="text-lg font-bold">{num}</span>
                      )}
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {num === 1 ? 'Buruk' : num === 5 ? 'Sangat Baik' : ''}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          <div className="space-y-4 pt-4">
            <Label htmlFor="comment" className="text-base">
              6. Apa yang bisa kami tingkatkan dalam penanganan aspirasi Anda?
            </Label>
            <Textarea 
              id="comment"
              placeholder="Tuliskan saran atau masukan Anda di sini..." 
              className="min-h-[120px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t p-6">
          <Button 
            onClick={() => submitMutation.mutate()} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            disabled={Object.keys(answers).length < 5 || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Kirim Penilaian
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground italic">
        "Data yang baik lahir dari pertanyaan yang tepat dan pengelolaan yang bertanggung jawab."<br/>
        SOP-MPA-KSR-2026 | Komisi Aspirasi MPA HIMAKOM POLBAN
      </p>
    </div>
  );
}
