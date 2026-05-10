'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';

interface InternalCommentsProps {
  aspirationId: string;
}

export function InternalComments({ aspirationId }: InternalCommentsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['internal-comments', aspirationId],
    queryFn: async () => {
      const response = await api.get(`/aspirations/${aspirationId}/comments`);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newComment: { content: string }) => {
      return api.post(`/aspirations/${aspirationId}/comments`, newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-comments', aspirationId] });
      setContent('');
      toast.success('Komentar internal berhasil ditambahkan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate({ content });
  };

  return (
    <Card className="border-orange-100 bg-orange-50/10">
      <CardHeader className="py-3 border-b border-orange-100">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-600" /> Diskusi Internal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground italic text-center">Memuat diskusi...</p>
          ) : comments?.length > 0 ? (
            comments.map((c: any) => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-orange-800">{c.user.name}</span>
                  <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div className="bg-white p-2 rounded-md border border-orange-100 text-xs shadow-sm">
                  {c.content}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">Belum ada diskusi internal.</p>
          )}
        </div>
        <div className="p-4 border-t border-orange-100 bg-white rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea 
              placeholder="Tulis komentar internal..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[40px] resize-none"
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={mutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[9px] text-muted-foreground mt-2">
            * Komentar ini hanya dapat dilihat oleh sesama Admin/Komisi.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
