'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Shield, UserX, UserCheck, Mail, Hash, Phone } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/users/roles');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User berhasil diperbarui');
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Gagal memperbarui user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus user');
    },
  });

  if (isLoading) return <div className="p-8">Memuat data user...</div>;

  const handleToggleActive = (user: any) => {
    updateMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive }
    });
  };

  const handleRoleChange = (user: any, roleId: string) => {
    const currentRoleIds = user.roles.map((r: any) => r.roleId);
    let newRoleIds;
    if (currentRoleIds.includes(roleId)) {
      newRoleIds = currentRoleIds.filter((id: string) => id !== roleId);
    } else {
      newRoleIds = [...currentRoleIds, roleId];
    }

    if (newRoleIds.length === 0) {
      toast.error('User harus memiliki minimal satu role');
      return;
    }

    updateMutation.mutate({
      id: user.id,
      data: { roleIds: newRoleIds }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground">Kelola akun, hak akses, dan status keaktifan pengguna sistem.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {users?.map((u: any) => (
          <Card key={u.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${u.isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{u.name}</h3>
                      {!u.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>
                      {u.nim && <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {u.nim}</span>}
                      {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {u.roles.map((r: any) => (
                      <Badge key={r.roleId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                        <Shield className="w-3 h-3 mr-1" /> {r.role.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedUser(u);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit Role
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={u.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.isActive ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                      {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait (aspirasi, log, dll) akan dihapus.')) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Role User</DialogTitle>
            <DialogDescription>
              Pilih hak akses untuk <strong>{selectedUser?.name}</strong>. User dapat memiliki lebih dari satu role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            {roles?.map((role: any) => {
              const isSelected = selectedUser?.roles.some((r: any) => r.roleId === role.id);
              return (
                <Button
                  key={role.id}
                  variant={isSelected ? "default" : "outline"}
                  className="justify-start h-12"
                  onClick={() => handleRoleChange(selectedUser, role.id)}
                >
                  <Shield className={`w-4 h-4 mr-3 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none">{role.name}</p>
                    <p className="text-[10px] opacity-70 mt-1">{role.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </Button>
              );
            })}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsEditDialogOpen(false)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
