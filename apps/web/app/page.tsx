import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, ShieldCheck, FileQuestion, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { NewsFeed } from '@/components/news-feed';
import { PublicStats } from '@/components/public-stats';

export default function Home() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section - Enhanced with better typography and layout */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="text-center space-y-8 max-w-4xl mx-auto px-4">
          <div className="flex justify-center mb-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <img src="/assets/images/logos/Logo_MPA.png" alt="Logo MPA" className="relative h-28 w-auto drop-shadow-2xl hover:scale-105 transition-transform" />
            </div>
          </div>
          
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Badge variant="outline" className="px-4 py-1.5 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] bg-white/50 backdrop-blur-sm shadow-sm">
              Sistem Informasi Aspirasi Mahasiswa
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              Suaramu, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Perubahan Kita</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Platform terpercaya untuk menyampaikan aspirasi Mahasiswa JTK POLBAN. 
              Aman, transparan, dan ditindaklanjuti secara terukur sesuai standar operasional.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <Link href="/aspirasi/buat">
              <Button size="lg" className="px-10 h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-105 transition-all">
                Sampaikan Aspirasi <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/aspirasi/tracking">
              <Button size="lg" variant="outline" className="px-10 h-14 rounded-2xl font-bold text-base bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-slate-50 transition-all">
                Lacak Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Visual Polish */}
      <section className="container mx-auto px-4 animate-in fade-in duration-1000 delay-300">
        <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 p-2 shadow-sm">
          <PublicStats />
        </div>
      </section>

      {/* Features Grid - More modern Cards */}
      <section className="container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            title: "Penerimaan Terpusat",
            desc: "Seluruh aspirasi dari berbagai kanal kini dikelola dalam satu sistem digital yang rapi dan terukur.",
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            title: "Transparansi Real-Time",
            desc: "Dapatkan pembaruan status secara langsung melalui notifikasi WhatsApp dan dashboard pelacakan.",
            icon: Search,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            title: "Privasi Terjamin",
            desc: "Opsi pelaporan anonim dengan perlindungan data berlapis sesuai prinsip konfidensialitas MPA.",
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/5"
          }
        ].map((feat, i) => (
          <Card key={i} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="space-y-4 p-8">
              <div className={`${feat.bg} ${feat.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <feat.icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl font-black text-slate-900">{feat.title}</CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed font-medium">
                  {feat.desc}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Latest News Section */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kabar Aspirasi</h2>
            <p className="text-slate-500 font-medium">Ikuti perkembangan terbaru tindak lanjut aspirasi mahasiswa.</p>
          </div>
          <Link href="/news">
            <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5 rounded-xl">
              Lihat Semua Berita <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <NewsFeed />
      </section>

      {/* CTA / Questionnaire Section - High Impact Design */}
      <section className="container mx-auto px-4">
        <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center p-8 md:p-16">
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1 rounded-full font-bold">SOP-MPA-KSR-2026</Badge>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1]">
                Butuh Data atau <br />Survei Mahasiswa?
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Apakah Divisi atau Departemen Anda membutuhkan data mahasiswa secara terstruktur? 
                Ajukan pembuatan kuesioner resmi (KSR-F) melalui portal resmi MPA.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/kuesioner/request">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl px-8 font-black h-14 shadow-xl">
                    Ajukan KSR-F Sekarang
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm">
                <FileQuestion className="w-48 h-48 text-white/20" />
                <div className="absolute -top-4 -right-4 bg-primary p-4 rounded-2xl shadow-xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Process Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900">Proses Penanganan Kami</h2>
            <p className="text-slate-500 font-medium">Setiap aspirasi melewati tahapan baku untuk menjamin kualitas solusi.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Validasi", icon: CheckCircle2 },
              { label: "Klasifikasi", icon: CheckCircle2 },
              { label: "Disposisi", icon: CheckCircle2 },
              { label: "Tuntas", icon: CheckCircle2 },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl group">
                <step.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black text-slate-900 text-sm uppercase tracking-wider">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Info - Clean and minimal */}
      <section className="container mx-auto px-4">
        <div className="bg-slate-50 p-10 md:p-16 rounded-[2.5rem] border border-slate-100">
          <div className="max-w-3xl mx-auto space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <img src="/assets/images/logos/Logo_MPA.png" alt="Logo MPA" className="h-12 w-auto grayscale opacity-50" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Tentang SIAM MPA</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Sistem Informasi Aspirasi Mahasiswa (SIAM) dikembangkan oleh Komisi Aspirasi MPA HIMAKOM POLBAN 
              sebagai manifestasi komitmen kami dalam mendigitalisasi tata kelola organisasi. 
              Kami menjamin respons cepat dan solusi tepat bagi setiap suara mahasiswa JTK.
            </p>
            <div className="pt-6 flex justify-center gap-8 text-slate-400">
              <span className="text-xs font-bold uppercase tracking-widest">Berintegritas</span>
              <span className="text-xs font-bold uppercase tracking-widest">Profesional</span>
              <span className="text-xs font-bold uppercase tracking-widest">Sinergis</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
