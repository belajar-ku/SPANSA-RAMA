import { createClient } from '@supabase/supabase-js';
import { User, LiterasiMaterial, RamadanTarget, DailyLog, GlobalSettings } from './types';

// PERBAIKAN: Project ID yang benar sesuai token adalah 'xnlwtkxhifqabuawmsdu'
const SUPABASE_URL = 'https://xnlwtkxhifqabuawmsdu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubHd0a3hoaWZxYWJ1YXdtc2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTE0OTMsImV4cCI6MjA4NjY2NzQ5M30.qzDkCxv5PU54foaJDdIRcdE08mXLm_0BKsQHNJF6xAQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to handle fetch errors
const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase Error (${context}):`, error);
    let msg = error?.message || 'Terjadi kesalahan jaringan.';
    if (msg.includes('Failed to fetch')) msg = 'Koneksi gagal. Pastikan URL Supabase benar dan internet lancar.';
    return { success: false, error: msg };
};

export const SupabaseService = {
  // --- AUTH ---
  login: async (username: string, password: string, type: 'nisn' | 'staff'): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Master Key Fallback (Admin Darurat)
      if (cleanUser === 'admin' && cleanPass === 'Spansa@1') {
          if (type !== 'staff') return { success: false, error: 'Admin harus login di tab GURU / ADMIN.' };
          return { success: true, user: { id: 'master', username: 'admin', password: 'Spansa@1', name: 'Administrator', role: 'admin', gender: 'L' } };
      }

      const { data, error } = await supabase.from('users').select('*').eq('username', cleanUser).eq('password', cleanPass).maybeSingle();
      
      if (error) throw error;
      if (!data) return { success: false, error: 'Username atau Password salah.' };

      const user = data as User;
      if (type === 'nisn' && user.role !== 'murid') return { success: false, error: 'Bukan akun Murid.' };
      if (type === 'staff' && user.role === 'murid') return { success: false, error: 'Bukan akun Guru/Admin.' };
      
      localStorage.setItem('spansa_user', JSON.stringify(user));
      return { success: true, user };
    } catch (e) { return handleSupabaseError(e, 'Login'); }
  },

  logout: () => localStorage.removeItem('spansa_user'),
  getUser: () => { const u = localStorage.getItem('spansa_user'); return u ? JSON.parse(u) : null; },

  // --- USER MANAGEMENT ---
  getUsers: async () => { 
      try {
          const { data, error } = await supabase.from('users').select('*').order('name'); 
          if(error) throw error;
          return (data || []) as User[]; 
      } catch(e) { console.error(e); return []; }
  },
  
  saveUser: async (user: User) => {
      try {
          // 1. Prepare Payload
          const p = { ...user };
          
          // Ensure username is lowercase
          if (p.username) p.username = p.username.toLowerCase().trim();
          
          // Remove ID if it's empty/new (let DB generate it)
          if (!p.id) delete (p as any).id;
          
          // Default password
          if (!p.password) p.password = 'Spansa@1';

          // 2. Upsert with explicit conflict resolution on 'username'
          const { error } = await supabase.from('users').upsert(p, { onConflict: 'username' });
          
          if (error) throw error;
          return { success: true, error: null };
      } catch (e) { return handleSupabaseError(e, 'Save User'); }
  },

  bulkCreateUsers: async (users: Partial<User>[]) => {
      try {
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
          if (error) throw error;
          return { success: true, error: null };
      } catch (e) { return handleSupabaseError(e, 'Bulk Upload'); }
  },

  deleteUser: async (id: string) => {
      try {
          await supabase.from('users').delete().eq('id', id);
      } catch(e) { console.error(e); }
  },

  // --- DAILY LOGS (Harian) ---
  getDailyLog: async (userId: string, date: string) => {
      try {
          const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).maybeSingle();
          if(error) throw error;
          return data as DailyLog | null;
      } catch(e) { console.error(e); return null; }
  },

  // [NEW] Get Recap for Progress
  getStudentRecap: async (userId: string) => {
      try {
          const { data, error } = await supabase.from('daily_logs').select('date, total_points, details').eq('user_id', userId).order('date');
          if(error) throw error;
          return (data || []) as any[];
      } catch(e) { console.error(e); return []; }
  },

  saveDailyLog: async (log: DailyLog) => {
      try {
          // Logic Hitung Poin Otomatis
          let pts = 0;
          const d = log.details;

          // Puasa: Penuh=100 (Request: remove Setengah)
          if (d.puasaStatus === 'Penuh') pts += 100;

          if (d.sahurStatus === 'Ya') pts += 10;
          
          if (d.sholatStatus) {
             Object.values(d.sholatStatus).forEach(s => {
                 if (s && s !== 'Lewat') pts += 4;
             });
          }

          if (d.sunahStatus) {
              Object.values(d.sunahStatus).forEach(s => {
                 if (s && s !== 'Tidak Melaksanakan') pts += 3; 
              });
          }

          if (d.tadarusStatus && d.tadarusStatus !== 'Tidak') pts += 10;

          if (d.sedekahDiri || d.sedekahRumah || d.sedekahMasyarakat) pts += 5;
          if (d.belajarTopik) pts += 5;

          const payload = { ...log, total_points: pts };
          if (!payload.id) delete (payload as any).id;

          // PENTING: Gunakan onConflict user_id,date agar tidak error duplicate key
          const { error } = await supabase.from('daily_logs').upsert(payload, { onConflict: 'user_id,date' });
          if (error) throw error;
          return true;
      } catch (e) { console.error(e); return false; }
  },

  // --- MONITORING (Guru) ---
  getMonitoringData: async (kelas: string, date: string) => {
      try {
          // 1. Get all students in class
          const { data: students, error: err1 } = await supabase.from('users').select('id, name').eq('role', 'murid').eq('kelas', kelas).order('name');
          if (err1) throw err1;
          if (!students) return [];

          // 2. Get logs for this date
          const { data: logs, error: err2 } = await supabase.from('daily_logs').select('*').eq('date', date).in('user_id', students.map(s => s.id));
          if(err2) throw err2;
          
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
      } catch(e) { console.error(e); return []; }
  },

  // --- LEADERBOARD (UPDATED: Filter by Class) ---
  getLeaderboard: async (kelas?: string) => {
      try {
          // 1. Get Users filtered by class
          let query = supabase.from('users').select('id, name, kelas').eq('role', 'murid');
          if (kelas) {
              query = query.eq('kelas', kelas);
          }
          const { data: users, error: err1 } = await query;
          if (err1 || !users || users.length === 0) return [];

          const userIds = users.map(u => u.id);

          // 2. Get Logs only for those users
          // Removed unused 'error: err2' destructuring
          const { data: logs } = await supabase.from('daily_logs').select('user_id, total_points').in('user_id', userIds);
          
          if (!logs) return users.map(u => ({ ...u, points: 0 }));

          // 3. Calculate Scores
          const scores: Record<string, number> = {};
          logs.forEach(l => {
              scores[l.user_id] = (scores[l.user_id] || 0) + (l.total_points || 0);
          });

          // 4. Sort and Return
          return users.map(u => ({
              ...u,
              points: scores[u.id] || 0
          })).sort((a, b) => b.points - a.points);

      } catch(e) { console.error(e); return []; }
  },

  // --- CONFIG & LITERASI ---
  // [DEPRECATED] getLiterasiConfig but kept for legacy check
  getLiterasiConfig: async () => { return { youtubeUrl: '', questions: [] } },

  // [NEW] Get Material By Date
  getLiterasiMaterial: async (date: string): Promise<LiterasiMaterial> => {
      try {
        const { data } = await supabase.from('literasi_materials').select('*').eq('date', date).maybeSingle();
        if (data) {
            return {
                id: data.id,
                date: data.date,
                youtubeUrl: data.youtube_url || '',
                questions: data.questions || []
            };
        }
        return { date, youtubeUrl: '', questions: ['Jelaskan inti sari video tersebut!'] };
      } catch { return { date, youtubeUrl: '', questions: [] }; }
  },

  // [NEW] Save Material
  saveLiterasiMaterial: async (material: LiterasiMaterial) => {
      const payload = {
          date: material.date,
          youtube_url: material.youtubeUrl,
          questions: material.questions
      };
      await supabase.from('literasi_materials').upsert(payload, { onConflict: 'date' });
  },

  getGlobalSettings: async () => {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'global_settings').maybeSingle();
        return data?.value || { startRamadhanV1: '', startRamadhanV2: '', idulFitri: '' };
      } catch { return { startRamadhanV1: '', startRamadhanV2: '', idulFitri: '' }; }
  },
  saveGlobalSettings: async (settings: GlobalSettings) => {
      await supabase.from('app_settings').upsert({ key: 'global_settings', value: settings });
  },
  
  // --- TARGETS ---
  saveRamadanTarget: async (userId: string, target: RamadanTarget) => {
      // PENTING: Gunakan onConflict user_id agar data lama terupdate
      await supabase.from('ramadan_targets').upsert({
          user_id: userId,
          start_date: target.startDate,
          target_puasa: target.targetPuasa,
          target_tarawih: target.targetTarawih,
          target_tadarus: target.targetTadarus,
          target_karakter: target.targetKarakter
      }, { onConflict: 'user_id' });
  },
  getRamadanTarget: async (userId: string) => {
      try {
        const { data } = await supabase.from('ramadan_targets').select('*').eq('user_id', userId).maybeSingle();
        if (data) return { startDate: data.start_date, targetPuasa: data.target_puasa, targetTarawih: data.target_tarawih, targetTadarus: data.target_tadarus, targetKarakter: data.target_karakter };
        return null;
      } catch { return null; }
  },

  // --- PRAYER TIMES ---
  getPrayerSchedule: async (dateStr: string) => {
    try {
        // Fetch Pasuruan Prayer Times
        // Format dateStr (YYYY-MM-DD) to DD-MM-YYYY for Aladhan API
        const [y, m, d] = dateStr.split('-');
        const apiDate = `${d}-${m}-${y}`;
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity/${apiDate}?city=Pasuruan&country=Indonesia&method=20`);
        const json = await res.json();
        if(json.code === 200 && json.data) {
            return json.data.timings;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch prayer times", e);
        return null;
    }
  }
};