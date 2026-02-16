import { createClient } from '@supabase/supabase-js';
import { User, LiterasiConfig, RamadanTarget, DailyLog, GlobalSettings } from './types';

const SUPABASE_URL = 'https://xnlwtkhhifqabuawmsdu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubHd0a3hoaWZxYWJ1YXdtc2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTE0OTMsImV4cCI6MjA4NjY2NzQ5M30.qzDkCxv5PU54foaJDdIRcdE08mXLm_0BKsQHNJF6xAQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const SupabaseService = {
  // --- AUTH ---
  login: async (username: string, password: string, type: 'nisn' | 'staff'): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Master Key Fallback
      if (cleanUser === 'admin' && cleanPass === 'Spansa@1') {
          if (type !== 'staff') return { success: false, error: 'Admin harus login di tab GURU / ADMIN.' };
          return { success: true, user: { id: 'master', username: 'admin', password: 'Spansa@1', name: 'Administrator', role: 'admin', gender: 'L' } };
      }

      const { data, error } = await supabase.from('users').select('*').eq('username', cleanUser).eq('password', cleanPass).maybeSingle();
      if (error || !data) return { success: false, error: 'Username atau Password salah.' };

      const user = data as User;
      if (type === 'nisn' && user.role !== 'murid') return { success: false, error: 'Bukan akun Murid.' };
      if (type === 'staff' && user.role === 'murid') return { success: false, error: 'Bukan akun Guru/Admin.' };
      
      localStorage.setItem('spansa_user', JSON.stringify(user));
      return { success: true, user };
    } catch (e) { return { success: false, error: 'Login Error' }; }
  },

  logout: () => localStorage.removeItem('spansa_user'),
  getUser: () => { const u = localStorage.getItem('spansa_user'); return u ? JSON.parse(u) : null; },

  // --- USER MANAGEMENT ---
  getUsers: async () => { const { data } = await supabase.from('users').select('*').order('name'); return (data || []) as User[]; },
  
  saveUser: async (user: User) => {
      const p = { ...user, username: user.username?.toLowerCase() || '' };
      if (!p.id) delete (p as any).id;
      if (!p.password) p.password = 'Spansa@1';
      return await supabase.from('users').upsert(p);
  },

  bulkCreateUsers: async (users: Partial<User>[]) => {
      // Clean data: lowercase username, remove empty IDs
      const cleanedUsers = users.map(u => {
          const { id, ...rest } = u; // Exclude ID to allow auto-generation
          return {
              ...rest,
              username: rest.username?.trim().toLowerCase(),
              password: rest.password || 'Spansa@1' // Default password if empty
          };
      });

      // Using upsert to handle duplicates (update if exists) or insert if new
      const { error } = await supabase.from('users').upsert(cleanedUsers, { onConflict: 'username' });
      return { success: !error, error: error?.message };
  },

  deleteUser: async (id: string) => await supabase.from('users').delete().eq('id', id),

  // --- DAILY LOGS (Harian) ---
  getDailyLog: async (userId: string, date: string) => {
      const { data } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).maybeSingle();
      return data as DailyLog | null;
  },

  saveDailyLog: async (log: DailyLog) => {
      // Logic Hitung Poin Otomatis
      let pts = 0;
      const d = log.details;

      if (d.puasaStatus === 'Penuh') pts += 50;
      else if (d.puasaStatus === 'Setengah') pts += 25;

      if (d.sahurStatus === 'Ya') pts += 10;
      
      // Hitung Shalat Wajib (20 poin max, 4 poin per sholat)
      if (d.sholatStatus) {
         Object.values(d.sholatStatus).forEach(s => {
             if (s !== 'Lewat') pts += 4;
         });
      }

      // Hitung Sunnah (15 poin max)
      if (d.sunahStatus) {
          Object.values(d.sunahStatus).forEach(s => {
             if (s !== 'Tidak Melaksanakan') pts += 3; 
          });
      }

      // Kebaikan & Belajar (Bonus)
      if (d.sedekahDiri || d.sedekahRumah) pts += 5;
      if (d.belajarTopik) pts += 5;

      const payload = { ...log, total_points: pts };
      if (!payload.id) delete (payload as any).id;

      const { error } = await supabase.from('daily_logs').upsert(payload);
      return !error;
  },

  // --- MONITORING (Guru) ---
  getMonitoringData: async (kelas: string, date: string) => {
      // 1. Get all students in class
      const { data: students } = await supabase.from('users').select('id, name').eq('role', 'murid').eq('kelas', kelas).order('name');
      if (!students) return [];

      // 2. Get logs for this date
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('date', date).in('user_id', students.map(s => s.id));
      
      // 3. Merge
      return students.map(s => {
          const log = logs?.find(l => l.user_id === s.id);
          return {
              id: s.id,
              name: s.name,
              submitted: !!log,
              puasa: log?.puasa_type || '-',
              points: log?.total_points || 0,
              nilai: log?.total_points || 0
          };
      });
  },

  // --- LEADERBOARD ---
  getLeaderboard: async () => {
      const { data: logs } = await supabase.from('daily_logs').select('user_id, total_points');
      const { data: users } = await supabase.from('users').select('id, name, kelas').eq('role', 'murid');

      if (!logs || !users) return [];

      const scores: Record<string, number> = {};
      logs.forEach(l => {
          scores[l.user_id] = (scores[l.user_id] || 0) + (l.total_points || 0);
      });

      return users.map(u => ({
          ...u,
          points: scores[u.id] || 0
      })).sort((a, b) => b.points - a.points).slice(0, 50); // Top 50
  },

  // --- CONFIG ---
  getLiterasiConfig: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'literasi_config').maybeSingle();
      return data?.value || { youtubeUrl: 'https://www.youtube.com/watch?v=HuNqR6W4FjU', questions: ['Soal Default 1'] };
  },
  saveLiterasiConfig: async (cfg: LiterasiConfig) => {
      await supabase.from('app_settings').upsert({ key: 'literasi_config', value: cfg });
  },

  getGlobalSettings: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'global_settings').maybeSingle();
      return data?.value || { startRamadhanV1: '', startRamadhanV2: '', idulFitri: '' };
  },
  saveGlobalSettings: async (settings: GlobalSettings) => {
      await supabase.from('app_settings').upsert({ key: 'global_settings', value: settings });
  },
  
  // --- TARGETS ---
  saveRamadanTarget: async (userId: string, target: RamadanTarget) => {
      await supabase.from('ramadan_targets').upsert({
          user_id: userId,
          start_date: target.startDate,
          target_puasa: target.targetPuasa,
          target_tarawih: target.targetTarawih,
          target_tadarus: target.targetTadarus,
          target_karakter: target.targetKarakter
      });
  },
  getRamadanTarget: async (userId: string) => {
      const { data } = await supabase.from('ramadan_targets').select('*').eq('user_id', userId).maybeSingle();
      if (data) return { startDate: data.start_date, targetPuasa: data.target_puasa, targetTarawih: data.target_tarawih, targetTadarus: data.target_tadarus, targetKarakter: data.target_karakter };
      return null;
  }
};