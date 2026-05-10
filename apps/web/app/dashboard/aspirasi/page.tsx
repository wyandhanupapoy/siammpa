'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, FolderTree, CheckCircle2, ChevronDown, ListFilter, Search } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function AspirationListPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data: aspirations, isLoading } = useQuery({
    queryKey: ['aspirations'],
    queryFn: async () => {
      const response = await api.get('/aspirations');
      return response.data;
    },
  });

  const { data: topics } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data;
    },
  });

  const assignTopicMutation = useMutation({
    mutationFn: async ({ topicId, aspirationIds }: { topicId: string; aspirationIds: string[] }) => {
      return api.post(`/topics/${topicId}/assign`, { aspirationIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspirations'] });
      setSelectedIds([]);
      toast.success('Aspirasi berhasil dikelompokkan ke topik');
    },
  });

  if (isLoading) return <div className="p-8">Memuat daftar aspirasi...</div>;

  const filteredAspirations = aspirations?.filter((a: any) => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.aspirationCode.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAspirations?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAspirations?.map((a: any) => a.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daftar Aspirasi</h1>
          <p className="text-muted-foreground text-sm">Kelola dan tindak lanjuti suara mahasiswa JTK.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari aspirasi..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {selectedIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="bg-primary animate-in fade-in zoom-in duration-200">
                  <FolderTree className="w-4 h-4 mr-2" />
                  Kelompokkan ({selectedIds.length})
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Pilih Topik</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {topics?.length > 0 ? (
                  topics.map((t: any) => (
                    <DropdownMenuItem key={t.id} onClick={() => assignTopicMutation.mutate({ topicId: t.id, aspirationIds: selectedIds })}>
                      {t.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-xs italic">
                    Belum ada topik. Buat di menu Topik.
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <Link href="/dashboard/topik">
                  <DropdownMenuItem className="text-primary font-bold">
                    + Buat Topik Baru
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 border-b">
                <tr>
                  <th className="px-6 py-4 w-10 text-center">
                    <Checkbox 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredAspirations?.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">ID & Info</th>
                  <th className="px-6 py-4 font-bold">Kategori</th>
                  <th className="px-6 py-4 font-bold">Topik</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAspirations?.map((a: any) => (
                  <tr key={a.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(a.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <Checkbox 
                        checked={selectedIds.includes(a.id)}
                        onCheckedChange={() => toggleSelect(a.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-xs text-primary">{a.aspirationCode}</span>
                        <span className="font-medium text-slate-900 line-clamp-1">{a.title}</span>
                        <span className="text-[10px] text-muted-foreground">Pelapor: {a.isAnonymous ? 'Anonim' : a.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                        {a.category.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {a.topic ? (
                        <Link href={`/dashboard/topik/${a.topic.id}`}>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] flex gap-1 w-fit hover:bg-indigo-100 transition-colors cursor-pointer">
                            <FolderTree className="w-3 h-3" /> {a.topic.name}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Belum ada topik</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/aspirasi/${a.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredAspirations?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic bg-white">
                      Tidak ada aspirasi yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
