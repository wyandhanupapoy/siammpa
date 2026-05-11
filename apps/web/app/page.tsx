import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, ShieldCheck, FileQuestion, ArrowRight, Zap, CheckCircle2, Phone, Mail, AtSign, HelpCircle, ChevronDown, TrendingUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NewsFeed } from '@/components/news-feed';
import { PublicStats } from '@/components/public-stats';

export default function Home() {
  return (
    <div className="space-y-12 md:space-y-16 pb-12 md:pb-20">
      {/* Hero Section - Enhanced with better typography and layout */}
      <section className="relative pt-8 md:pt-20 overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center mb-4 md:mb-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <img src="/assets/images/logos/Logo_MPA.png" alt="Logo MPA" className="relative h-20 md:h-28 w-auto drop-shadow-2xl hover:scale-105 transition-transform" />
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 px-2">
            <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] md:text-[10px] bg-white/50 backdrop-blur-sm shadow-sm">
              Sistem Informasi Aspirasi Mahasiswa
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1] md:leading-[0.9]">
              Suaramu, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Perubahan Kita</span>
            </h1>
            <p className="text-sm md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium px-4">
              Platform terpercaya untuk menyampaikan aspirasi Mahasiswa JTK POLBAN. 
              Aman, transparan, dan ditindaklanjuti secara terukur.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 md:pt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 px-6 sm:px-0">
            <Link href="/aspirasi/buat">
              <Button size="lg" className="w-full sm:w-auto px-10 h-12 md:h-14 rounded-2xl font-black text-sm md:text-base shadow-xl shadow-primary/20 hover:shadow-2xl transition-all">
                Sampaikan Aspirasi <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <Link href="/aspirasi/tracking">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-12 md:h-14 rounded-2xl font-bold text-sm md:text-base bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-slate-50 transition-all">
                Lacak Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Visual Polish */}
      <section className="container mx-auto px-4 animate-in fade-in duration-1000 delay-300">
        <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 p-1 md:p-2 shadow-sm">
          <PublicStats />
        </div>
      </section>

      {/* Features Grid - More modern Cards */}
      <section className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {[
          {
            title: "Terpusat",
            desc: "Seluruh aspirasi dikelola dalam satu sistem digital yang rapi dan terukur.",
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            title: "Real-Time",
            desc: "Pantau status secara langsung melalui notifikasi WhatsApp.",
            icon: Search,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            title: "Anonim",
            desc: "Opsi pelaporan rahasia dengan perlindungan data berlapis.",
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/5"
          }
        ].map((feat, i) => (
          <Card key={i} className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="space-y-3 md:space-y-4 p-6 md:p-8">
              <div className={`${feat.bg} ${feat.color} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <feat.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <CardTitle className="text-lg md:text-xl font-black text-slate-900">{feat.title}</CardTitle>
                <CardDescription className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                  {feat.desc}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Latest News Section */}
      <section className="container mx-auto px-4 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4">
          <div className="space-y-1 md:space-y-2 px-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Kabar Aspirasi</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Ikuti perkembangan terbaru tindak lanjut aspirasi.</p>
          </div>
          <Link href="/news" className="hidden md:block">
            <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5 rounded-xl">
              Lihat Semua Berita <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <NewsFeed />
        <div className="md:hidden px-2">
          <Link href="/news">
            <Button variant="outline" className="w-full font-bold text-primary border-primary/20 rounded-2xl h-12">
              Lihat Semua Berita <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA / Questionnaire Section - High Impact Design */}
      <section className="container mx-auto px-4">
        <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/4"></div>
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-16">
            <div className="space-y-4 md:space-y-6 text-center lg:text-left">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1 rounded-full font-bold text-[10px]">SOP-MPA-KSR-2026</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1]">
                Butuh Data atau <br className="hidden md:block" />Survei Mahasiswa?
              </h2>
              <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium">
                Ajukan pembuatan kuesioner resmi (KSR-F) melalui portal resmi MPA secara terstruktur.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2 md:pt-4">
                <Link href="/kuesioner/request" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 rounded-2xl px-8 font-black h-12 md:h-14 shadow-xl">
                    Ajukan Sekarang
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
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center space-y-8 md:space-y-16">
          <div className="space-y-2 md:space-y-4">
            <Badge className="bg-primary/10 text-primary border-none mb-2">Transparansi Proses</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Langkah Aspirasimu</h2>
            <p className="text-sm md:text-lg text-slate-500 font-medium max-w-2xl mx-auto">Kami memastikan setiap laporan ditangani dengan standar operasional yang profesional dan akuntabel.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
            
            {[
              { 
                label: "Penyampaian", 
                desc: "Aspirasi masuk dan divalidasi keabsahannya oleh admin.",
                icon: MessageSquare,
                color: "bg-blue-500"
              },
              { 
                label: "Pengkajian", 
                desc: "Tim Komisi Aspirasi melakukan kajian internal & scoring prioritas.",
                icon: Search,
                color: "bg-indigo-500"
              },
              { 
                label: "Disposisi", 
                desc: "Diteruskan ke PIC/BPH terkait untuk tindak lanjut operasional.",
                icon: Zap,
                color: "bg-orange-500"
              },
              { 
                label: "Penyelesaian", 
                desc: "Status selesai dan pelapor memberikan feedback kepuasan.",
                icon: CheckCircle2,
                color: "bg-emerald-500"
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500 relative`}>
                  <step.icon className="w-8 h-8" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-black shadow-md border border-slate-100">
                    {i + 1}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">{step.label}</h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed px-4 md:px-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
          <div className="text-center space-y-2 md:space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Layanan Bantuan & Kontak</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium px-4">Punya pertanyaan atau kendala? Hubungi tim kami melalui jalur di bawah ini.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* WhatsApp Contacts */}
            <a href="https://wa.me/6281324707985" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-500/10 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Gharin Fawwaz</h3>
                <p className="text-sm text-slate-500 font-medium">WhatsApp</p>
              </div>
            </a>
            
            <a href="https://wa.me/6285798040463" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-500/10 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hilmi Farhat</h3>
                <p className="text-sm text-slate-500 font-medium">WhatsApp</p>
              </div>
            </a>

            <a href="https://wa.me/62882002589783" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-500/10 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Fadil</h3>
                <p className="text-sm text-slate-500 font-medium">WhatsApp</p>
              </div>
            </a>

            {/* Email Contact */}
            <a href="mailto:wyandhanupapoy@gmail.com" className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/10 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 truncate">Email Resmi</h3>
                <p className="text-sm text-slate-500 font-medium truncate">wyandhanupapoy@gmail.com</p>
              </div>
            </a>

            {/* Instagram Contact */}
            <a href="https://instagram.com/mpahimakom" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-fuchsia-200 hover:shadow-xl hover:shadow-fuchsia-500/10 transition-all group md:col-span-2 lg:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AtSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Instagram</h3>
                <p className="text-sm text-slate-500 font-medium">@mpahimakom</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Impact Section - Building Trust through success stories */}
      <section className="bg-slate-900 py-16 md:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <Badge className="bg-primary text-white border-none">Cerita Perubahan</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Setiap Suara <br />
                <span className="text-primary">Membawa Dampak</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                SIAM MPA bukan sekadar kotak saran. Kami adalah jembatan antara keresahan Mahasiswa dan solusi nyata dari organisasi.
              </p>
              <div className="space-y-4">
                {[
                  "95% Aspirasi direspon dalam < 48 jam",
                  "Transparansi penuh melalui kode tracking",
                  "Identitas anonim dijamin sistem audit"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white font-bold">
                    <div className="bg-primary/20 p-1 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              {[
                {
                  quote: "Masalah fasilitas lab yang sudah lama dikeluhkan akhirnya diperbaiki dalam seminggu setelah melapor lewat SIAM MPA.",
                  author: "Mahasiswa Angkatan 22",
                  tag: "Fasilitas"
                },
                {
                  quote: "Awalnya ragu lapor masalah akademik, tapi mode anonim bikin saya berani. Respon Komisi Aspirasi sangat solutif.",
                  author: "Mahasiswa Angkatan 21",
                  tag: "Akademik"
                }
              ].map((story, i) => (
                <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] hover:bg-white/10 transition-all">
                  <div className="space-y-4">
                    <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[9px] font-black">{story.tag}</Badge>
                    <p className="text-white text-base md:text-lg italic font-medium leading-relaxed">
                      "{story.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="text-sm font-black text-slate-300">{story.author}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-slate-100 text-slate-600 border-none mb-2">Pusat Bantuan</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Paling Sering Ditanyakan</h2>
            <p className="text-sm md:text-lg text-slate-500 font-medium">Masih ragu untuk melapor? Temukan jawaban atas kegelisahanmu di sini.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                q: "Apakah identitas saya benar-benar aman jika memilih mode Anonim?",
                a: "Ya. Dalam mode anonim, sistem mengenkripsi data identitas Anda. Staf pengolah aspirasi hanya melihat kode unik laporan. Identitas hanya bisa dibuka melalui mekanisme audit ketat jika laporan mengandung ancaman serius atau pelanggaran hukum berat."
              },
              {
                q: "Berapa lama aspirasi saya akan ditindaklanjuti?",
                a: "Sesuai SOP kami, setiap aspirasi akan divalidasi dalam maksimal 2x24 jam kerja. Anda dapat memantau progres secara real-time melalui halaman tracking menggunakan kode aspirasi yang didapatkan."
              },
              {
                q: "Siapa saja yang akan membaca aspirasi saya?",
                a: "Aspirasi Anda awalnya divalidasi oleh Admin MPA. Setelah itu, akan diteruskan ke Komisi Aspirasi yang relevan dengan bidang masalah yang Anda laporkan (misal: Komisi Fasilitas, Komisi Akademik, dll)."
              },
              {
                q: "Apa yang harus saya siapkan sebelum melapor?",
                a: "Cukup siapkan deskripsi masalah yang jelas dan kronologis. Sangat disarankan untuk melampirkan bukti pendukung seperti foto, tangkapan layar, atau dokumen PDF guna mempercepat proses pengkajian."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-white shadow-sm hover:shadow-md transition-all">
                <AccordionTrigger className="text-left font-black text-slate-900 hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-6 font-medium">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer / CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-24">
        <div className="bg-slate-50 p-8 md:p-16 rounded-[2.5rem] border border-slate-100">
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 text-center">
            <div className="flex justify-center mb-2 md:mb-4">
              <img src="/assets/images/logos/Logo_MPA.png" alt="Logo MPA" className="h-10 md:h-12 w-auto grayscale opacity-50" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">Tentang SIAM MPA</h2>
            <p className="text-xs md:text-base text-slate-600 leading-relaxed font-medium px-2">
              Sistem Informasi Aspirasi Mahasiswa (SIAM) dikembangkan oleh Komisi Aspirasi MPA HIMAKOM POLBAN 
              sebagai manifestasi komitmen kami dalam mendigitalisasi tata kelola organisasi. 
            </p>
            <div className="pt-4 md:pt-6 flex justify-center gap-4 md:gap-8 text-slate-400">
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Berintegritas</span>
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Profesional</span>
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Sinergis</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
