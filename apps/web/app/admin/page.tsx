'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Power, Trash2, Search, Edit2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminPanelPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
    password: '',
    roleIds: [] as string[],
    isActive: true,
  });

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await api.get('/users/roles');
      return response.data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return api.put(`/users/${editingUser.id}`, data);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(editingUser ? 'User berhasil diperbarui' : 'User baru berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/users/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status user berhasil diubah');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User berhasil dihapus secara permanen');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus user');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', nim: '', password: '', roleIds: [], isActive: true });
    setEditingUser(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      nim: user.nim,
      password: '',
      roleIds: user.roles.map((r: any) => r.roleId),
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleIds.length === 0) {
      toast.error('Pilih setidaknya satu role');
      return;
    }
    upsertMutation.mutate(formData);
  };

  const filteredUsers = users?.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nim.includes(searchTerm)
  );

  if (isUsersLoading) return <div className="p-8">Memuat data panel admin...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manajemen staf, otoritas role, dan keamanan sistem.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-2" /> Tambah Staf
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Pengguna & Staf</CardTitle>
              <CardDescription>Total {users?.length || 0} akun terdaftar dalam sistem.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama, email, atau NIM..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/50">
                  <th className="p-4 text-left font-bold">Nama & Identitas</th>
                  <th className="p-4 text-left font-bold">Email</th>
                  <th className="p-4 text-left font-bold">Role</th>
                  <th className="p-4 text-center font-bold">Status</th>
                  <th className="p-4 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user: any) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.nim}</div>
                    </td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r: any) => (
                          <Badge key={r.roleId} variant="outline" className="text-[10px] bg-slate-100">
                            {r.role.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Aktif' : 'Non-aktif'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)} title="Edit Profil">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={user.isActive ? 'text-orange-600 h-8 w-8' : 'text-green-600 h-8 w-8'}
                        onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: user.isActive })}
                        disabled={toggleStatusMutation.isPending}
                        title={user.isActive ? 'Deaktivasi (Cabut Akses)' : 'Aktivasi (Berikan Akses)'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 h-8 w-8 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Hapus user ${user.name} secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Hapus Permanen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah Staf Baru'}</DialogTitle>
            <DialogDescription>
              Pastikan data identitas benar. Password default adalah "Mpa123!" jika tidak diisi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Nama Lengkap</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Email</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">NIM</label>
                <Input 
                  value={formData.nim} 
                  onChange={(e) => setFormData({...formData, nim: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Password {editingUser && '(Kosongkan jika tidak diubah)'}</label>
              <Input 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Roles (Pilih Hak Akses)</label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                {roles?.map((role: any) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={role.id} 
                      checked={formData.roleIds.includes(role.id)}
                      onCheckedChange={(checked) => {
                        const newRoles = checked 
                          ? [...formData.roleIds, role.id]
                          : formData.roleIds.filter(id => id !== role.id);
                        setFormData({...formData, roleIds: newRoles});
                      }}
                    />
                    <label htmlFor={role.id} className="text-xs cursor-pointer">{role.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
