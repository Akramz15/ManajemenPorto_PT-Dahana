import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Spinner } from '@/components/ui/Spinner';

interface Todo {
  id: string;
  user_id: string;
  task: string;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
  target_date: string;
}

export default function TodoListPage() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const { data, error } = await supabase
        .from('user_todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_date', dateStr)
        .order('created_at', { ascending: false });
        
      if (error) {
        // If the column doesn't exist yet, this will fail. We handle it gracefully so the UI doesn't completely break, but show an alert.
        if (error.code === '42703') { // undefined_column
            console.warn("Kolom target_date belum ada. Mohon jalankan SQL.");
        }
        throw error;
      }
      if (data) setTodos(data);
    } catch (err: any) {
      console.error("Error fetching todos:", err);
      if (err?.code !== '42703') {
          // Silent catch for undefined column so we don't spam alert on load, user will run SQL from walkthrough.
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const { error } = await supabase.from('user_todos').insert([{
        user_id: user.id,
        task: newTask.trim(),
        target_date: dateStr
      }]);
      
      if (error) throw error;
      setNewTask("");
      await fetchTodos();
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Gagal menambahkan tugas. Pastikan Anda sudah menjalankan query SQL untuk kolom target_date!");
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header & Calendar Strip Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 lg:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Title */}
        <div className="flex-shrink-0 text-center lg:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Saya</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base mt-1">
            Kelola jadwal dan prioritas harian Anda dengan mudah.
          </p>
        </div>

        {/* Calendar Strip */}
        <div className="flex flex-col md:flex-row items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <button 
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center min-w-30">
            <span className="text-sm font-bold text-slate-800">
              {format(currentWeekStart, 'MMMM yyyy', { locale: idLocale })}
            </span>
          </div>
          <button 
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1 w-full overflow-x-auto py-3 px-1 scrollbar-hide">
          {weekDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isSameDay(day, new Date());
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center justify-center w-14 py-3 sm:w-16 sm:py-3.5 rounded-2xl transition-all ${
                  isSelected 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 scale-105' 
                    : isTodayDate
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>
                  {format(day, 'EEE', { locale: idLocale })}
                </span>
                <span className={`text-base sm:text-lg font-bold leading-none ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Kolom Kiri: Tugas Aktif */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <CalendarIcon size={16} />
              </div>
              Agenda: {format(selectedDate, 'dd MMMM', { locale: idLocale })}
            </h2>
            <span className="bg-primary-50 text-primary-700 text-xs py-1 px-3 rounded-full font-bold border border-primary-100">
              {activeTodos.length} Tugas
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100">
            <form onSubmit={handleAddTask} className="relative mb-6">
              <input
                type="text"
                placeholder="Tambahkan tugas baru..."
                className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-5 pr-14 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !newTask.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="space-y-3 min-h-75">
              {loading ? (
                <div className="py-10 flex justify-center"><Spinner className="text-primary-500" /></div>
              ) : activeTodos.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Check size={28} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 text-base">Agenda Kosong</p>
                  <p className="text-xs text-slate-400 mt-1">Tidak ada jadwal tugas untuk tanggal ini.</p>
                </div>
              ) : (
                activeTodos.map(todo => (
                  <div key={todo.id} className="group flex items-start gap-3 p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <button 
                      onClick={() => handleToggle(todo)}
                      className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center hover:border-primary-500 transition-colors shrink-0"
                    >
                      <Check size={14} className="text-transparent" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 leading-snug wrap-break-word">{todo.task}</p>
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
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Clock size={16} />
              </div>
              Tugas Selesai
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs py-1 px-3 rounded-full font-bold border border-emerald-100">
              {completedTodos.length} Selesai
            </span>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-slate-100/60 shadow-[0_2px_15px_-8px_rgba(0,0,0,0.02)]">
            <div className="space-y-3 min-h-90">
              {loading ? (
                <div className="py-10 flex justify-center"><Spinner className="text-emerald-500" /></div>
              ) : completedTodos.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Clock size={28} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500 text-base">Belum ada tugas selesai</p>
                  <p className="text-xs text-slate-400 mt-1">Selesaikan tugas di sebelah kiri.</p>
                </div>
              ) : (
                completedTodos.map(todo => (
                  <div key={todo.id} className="group flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 opacity-80 hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleToggle(todo)}
                      className="mt-0.5 w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 flex items-center justify-center hover:bg-slate-300 hover:border-slate-300 transition-colors shrink-0"
                    >
                      <Check size={14} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-500 line-through leading-snug wrap-break-word">{todo.task}</p>
                      {todo.completed_at && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">
                          Selesai {format(new Date(todo.completed_at), "HH:mm", { locale: idLocale })}
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
