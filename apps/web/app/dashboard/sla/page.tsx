'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLA_LIMITS: Record<string, number> = {
  SUBMITTED: 24,
  VALIDATING: 48,
  VERIFIED: 24,
  CLASSIFIED: 72,
  ASSIGNED: 24,
  IN_FOLLOW_UP: 168,
  RESOLVED: 168,
};

export default function SlaMonitorPage() {
  const { data: aspirations, isLoading } = useQuery({
    queryKey: ['aspirations'],
    queryFn: async () => {
      const response = await api.get('/aspirations');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading SLA data...</div>;

  const activeAspirations = aspirations?.filter((a: any) => 
    !['CLOSED', 'ARCHIVED', 'REJECTED'].includes(a.status)
  ) || [];

  const calculateSla = (aspiration: any) => {
    const limit = SLA_LIMITS[aspiration.status];
    if (!limit) return null;

    const updatedDate = new Date(aspiration.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const percentage = Math.min((diffHours / limit) * 100, 100);
    const remainingHours = Math.max(limit - diffHours, 0);
    const isBreached = diffHours > limit;

    return { percentage, remainingHours, isBreached };
  };

  const breachedCount = activeAspirations.filter((a: any) => calculateSla(a)?.isBreached).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">SLA Monitor</h1>
        <p className="text-muted-foreground text-sm">Pemantauan real-time kepatuhan Service Level Agreement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-100 bg-red-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" /> SLA Breached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{breachedCount}</div>
            <p className="text-xs text-muted-foreground">Aspirasi melewati batas waktu</p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-100 bg-orange-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" /> Total Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAspirations.length}</div>
            <p className="text-xs text-muted-foreground">Sedang dalam antrian proses</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAspirations.length > 0 
                ? Math.round(((activeAspirations.length - breachedCount) / activeAspirations.length) * 100) 
                : 100}%
            </div>
            <p className="text-xs text-muted-foreground">Target: min 90%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian & Status SLA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activeAspirations.length === 0 && <p className="text-center py-8 text-muted-foreground">Tidak ada aspirasi aktif.</p>}
            {activeAspirations.map((a: any) => {
              const sla = calculateSla(a);
              if (!sla) return null;

              return (
                <div key={a.id} className="space-y-2 border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{a.aspirationCode}</span>
                        <Badge variant="secondary" className="text-[10px]">{a.status}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">{a.title}</p>
                    </div>
                    <div className="text-right">
                      {sla.isBreached ? (
                        <span className="text-xs font-bold text-red-600">BREACHED</span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {Math.floor(sla.remainingHours)}j tersisa
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={sla.percentage} 
                    className={cn(
                      "h-1.5",
                      sla.isBreached ? "[&>div]:bg-red-500" : sla.percentage > 80 ? "[&>div]:bg-orange-500" : ""
                    )} 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
