import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Spinner } from '@/components/ui/Spinner';

interface Todo {
  id: string;
  user_id: string;
  task: string;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export default function TodoListPage() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setTodos(data);
    } catch (err) {
      console.error("Error fetching todos:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_todos').insert([{
        user_id: user.id,
        task: newTask.trim()
      }]);
      
      if (error) throw error;
      setNewTask("");
      await fetchTodos();
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Gagal menambahkan tugas. Pastikan Anda sudah menjalankan query SQL.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      // Optimistic UI update
      setTodos(prev => prev.map(t => 
        t.id === todo.id ? { ...t, is_completed: !t.is_completed, completed_at: !t.is_completed ? new Date().toISOString() : null } : t
      ));

      const { error } = await supabase
        .from('user_todos')
        .update({ 
          is_completed: !todo.is_completed,
          completed_at: !todo.is_completed ? new Date().toISOString() : null
        })
        .eq('id', todo.id);
        
      if (error) throw error;
    } catch (err) {
      console.error("Error toggling task:", err);
      await fetchTodos(); // revert on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tugas ini?")) return;
    try {
      setTodos(prev => prev.filter(t => t.id !== id));
      const { error } = await supabase.from('user_todos').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting task:", err);
      await fetchTodos();
    }
  };

  const activeTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed).sort((a, b) => 
    new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="page-header mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Saya</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">
          Kelola to-do list pribadi Anda hari ini. Hanya Anda yang bisa melihat daftar ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Kolom Kiri: Tugas Aktif */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 border-t-4 border-t-primary-500 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="text-primary-500" size={20} />
              Fokus Hari Ini
              <span className="ml-auto bg-primary-100 text-primary-700 text-xs py-1 px-2.5 rounded-full font-bold">
                {activeTodos.length}
              </span>
            </h2>

            <form onSubmit={handleAddTask} className="relative mb-6">
              <input
                type="text"
                placeholder="Apa yang ingin Anda kerjakan hari ini?"
                className="input-field pr-12 bg-slate-50/50"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !newTask.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="space-y-3 min-h-75">
              {loading ? (
                <div className="py-10 flex justify-center"><Spinner className="text-primary-500" /></div>
              ) : activeTodos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Check size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-600">Semua tugas beres!</p>
                  <p className="text-xs text-slate-400 mt-1">Tambahkan tugas baru untuk memulai hari.</p>
                </div>
              ) : (
                activeTodos.map(todo => (
                  <div key={todo.id} className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all">
                    <button 
                      onClick={() => handleToggle(todo)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center hover:border-primary-500 transition-colors shrink-0"
                    >
                      <Check size={14} className="text-transparent" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 leading-snug wrap-break-word">{todo.task}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Dibuat {format(new Date(todo.created_at), "HH:mm", { locale: idLocale })} WIB
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(todo.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat Selesai */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 border-t-4 border-t-positive-500 shadow-sm bg-slate-50/30">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-positive-500" size={20} />
              Riwayat Selesai
              <span className="ml-auto bg-positive-100 text-positive-700 text-xs py-1 px-2.5 rounded-full font-bold">
                {completedTodos.length}
              </span>
            </h2>

            <div className="space-y-3 min-h-75">
              {loading ? (
                <div className="py-10 flex justify-center"><Spinner className="text-positive-500" /></div>
              ) : completedTodos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Clock size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">Belum ada riwayat.</p>
                  <p className="text-xs text-slate-400 mt-1">Tugas yang Anda selesaikan akan muncul di sini.</p>
                </div>
              ) : (
                completedTodos.map(todo => (
                  <div key={todo.id} className="group flex items-start gap-3 p-4 bg-white/60 border border-slate-200/60 rounded-xl opacity-75 hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleToggle(todo)}
                      className="mt-0.5 w-5 h-5 rounded bg-positive-500 border border-positive-500 flex items-center justify-center hover:bg-slate-300 hover:border-slate-300 transition-colors shrink-0"
                    >
                      <Check size={14} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-500 line-through leading-snug wrap-break-word">{todo.task}</p>
                      {todo.completed_at && (
                        <p className="text-[10px] text-positive-600 font-bold mt-1">
                          Selesai {format(new Date(todo.completed_at), "dd MMM HH:mm", { locale: idLocale })}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDelete(todo.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
