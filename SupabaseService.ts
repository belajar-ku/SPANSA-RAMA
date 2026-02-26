import { createClient } from '@supabase/supabase-js';
import { User, LiterasiMaterial, RamadanTarget, DailyLog, GlobalSettings, getWIBDate } from './types';

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

      // First attempt: Exact match
      let { data, error } = await supabase.from('users').select('*').eq('username', cleanUser).eq('password', cleanPass).maybeSingle();
      
      // Retry Logic: Handle '0xxx NISN format (Excel import artifact)
      if (!data && type === 'nisn') {
          const altUser = "'" + cleanUser;
          const { data: dataAlt, error: errorAlt } = await supabase.from('users').select('*').eq('username', altUser).eq('password', cleanPass).maybeSingle();
          if (dataAlt) {
              data = dataAlt;
              error = errorAlt;
          }
      }

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
      const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).maybeSingle();
      if(error) throw error;
      return data as DailyLog | null;
  },

  // [NEW] Get Pending Literasi Corrections
  getPendingLiterasiCorrections: async (userId: string) => {
      try {
          const { data } = await supabase
              .from('daily_logs')
              .select('date')
              .eq('user_id', userId)
              .contains('details', { literasiValidation: 'Perbaiki' });
          return (data || []) as { date: string }[];
      } catch (e) { console.error(e); return []; }
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

          // Jika Alasan = Menstruasi, poin puasa, sholat, dll 0. 
          // Tapi kita hitung normal dulu, validasi form di frontend memastikan input kosong/disabled jika menstruasi.
          
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

          // [NEW] Literasi Points (100 Points)
          // Only give points if answered AND not marked as 'Perbaiki'
          if (d.literasiResponse && d.literasiResponse.length > 0 && d.literasiValidation !== 'Perbaiki') {
              pts += 100;
          }

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
          const today = getWIBDate();
          const isPastDate = date < today;

          const result = students.map(s => {
              const log = logs?.find(l => l.user_id === s.id);
              
              // AUTO-SUBMIT LOGIC: If date is in the past, treat draft as submitted
              let isDraft = log?.details?.is_draft || false;
              if (isPastDate && log) {
                  isDraft = false; 
              }

              return {
                  id: s.id,
                  name: s.name,
                  submitted: !!log,
                  is_draft: isDraft,
                  puasa: log?.puasa_type || '-',
                  points: log?.total_points || 0,
                  nilai: log?.total_points || 0
              };
          });

          // UPDATE: Sorting by Points (Highest to Lowest) as requested
          // Secondary sort: Submitted first
          return result.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return Number(b.submitted) - Number(a.submitted);
          });

      } catch(e) { console.error(e); return []; }
  },

  // [NEW] Get Literacy Answers for Correction
  getLiterasiRecap: async (kelas: string, date: string) => {
      try {
          // 1. Get Students
          const { data: students } = await supabase.from('users').select('id, name').eq('role', 'murid').eq('kelas', kelas).order('name');
          if (!students) return { students: [], questions: [] };

          // 2. Get Questions
          const { data: material } = await supabase.from('literasi_materials').select('questions').eq('date', date).maybeSingle();
          const questions = material?.questions || [];

          // 3. Get Logs
          const { data: logs } = await supabase.from('daily_logs').select('user_id, details').eq('date', date).in('user_id', students.map(s => s.id));

          // 4. Merge
          const data = students.map(s => {
              const log = logs?.find(l => l.user_id === s.id);
              const answers = log?.details?.literasiResponse || [];
              const submitted = answers.length > 0 && answers.some((a: string) => a.trim() !== '');
              const validation = log?.details?.literasiValidation || 'Sesuai'; // Default Sesuai
              return {
                  id: s.id,
                  name: s.name,
                  submitted,
                  answers,
                  validation
              };
          });

          // Sort by submitted first
          data.sort((a, b) => Number(b.submitted) - Number(a.submitted));

          return { students: data, questions };
      } catch (e) { console.error(e); return { students: [], questions: [] }; }
  },

  // [NEW] Get Rekap Absensi (Harian & Literasi) for Range
  getRekapAbsensi: async (kelas: string, startDate: string, endDate: string) => {
      try {
          // 1. Get Students
          const { data: students, error: err1 } = await supabase
              .from('users')
              .select('id, name, gender')
              .eq('role', 'murid')
              .eq('kelas', kelas)
              .order('name');
          
          if (err1 || !students) return [];

          // 2. Get Logs in Range
          const { data: logs, error: err2 } = await supabase
              .from('daily_logs')
              .select('user_id, date, details, total_points')
              .gte('date', startDate)
              .lte('date', endDate)
              .in('user_id', students.map(s => s.id));

          if (err2) throw err2;

          // 3. Get Total Points Since Feb 18, 2026 (for Average Calculation)
          const { data: allLogs } = await supabase
              .from('daily_logs')
              .select('user_id, date, total_points, details')
              .gte('date', '2026-02-18')
              .in('user_id', students.map(s => s.id));

          const totalPointsMap: Record<string, number> = {};
          const daysFilledMap: Record<string, Set<string>> = {};
          
          // Calculate yesterday's date for filtering
          const d = new Date();
          d.setDate(d.getDate() - 1);
          const yesterdayStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

          if (allLogs) {
              allLogs.forEach(l => {
                  totalPointsMap[l.user_id] = (totalPointsMap[l.user_id] || 0) + (l.total_points || 0);
                  
                  // Count days filled until yesterday (MUST BE BOTH HARIAN AND LITERASI)
                  if (l.date <= yesterdayStr) {
                      const d = l.details || {};
                      const hasHarian = !!(d.puasaStatus || d.sholatStatus || d.bukaStatus || d.sahurStatus);
                      const hasLiterasi = d.literasiResponse && Array.isArray(d.literasiResponse) && d.literasiResponse.length > 0 && d.literasiResponse.some((a: any) => typeof a === 'string' && a.trim() !== '');

                      if (hasHarian && hasLiterasi) {
                          if (!daysFilledMap[l.user_id]) daysFilledMap[l.user_id] = new Set();
                          daysFilledMap[l.user_id].add(l.date);
                      }
                  }
              });
          }

          // 4. Process Data
          return students.map(s => {
              const studentLogs = logs?.filter(l => l.user_id === s.id) || [];
              const logMap: Record<string, { harian: boolean, literasi: boolean, points: number }> = {};

              studentLogs.forEach(l => {
                  const d = l.details || {};
                  // Check if any Harian field is filled (Puasa, Sholat, etc.)
                  // We assume if puasaStatus or sholatStatus exists, they touched the journal.
                  const hasHarian = !!(d.puasaStatus || d.sholatStatus || d.bukaStatus || d.sahurStatus);
                  
                  const hasLiterasi = d.literasiResponse && d.literasiResponse.length > 0 && d.literasiResponse.some((a: string) => a.trim() !== '');
                  
                  logMap[l.date] = {
                      harian: hasHarian,
                      literasi: hasLiterasi,
                      points: l.total_points || 0
                  };
              });

              return {
                  id: s.id,
                  name: s.name,
                  gender: s.gender,
                  logs: logMap,
                  totalPointsAllTime: totalPointsMap[s.id] || 0,
                  daysFilled: daysFilledMap[s.id] ? daysFilledMap[s.id].size : 0
              };
          });

      } catch (e) { console.error(e); return []; }
  },

  // [NEW] Get Student Total Points Since Feb 18, 2026
  getStudentTotalPoints: async (userId: string) => {
      try {
          const { data } = await supabase
              .from('daily_logs')
              .select('total_points')
              .eq('user_id', userId)
              .gte('date', '2026-02-18');
          
          if (!data) return 0;
          return data.reduce((sum, l) => sum + (l.total_points || 0), 0);
      } catch { return 0; }
  },

  getStudentDaysFilled: async (userId: string, endDate?: string) => {
      try {
          const START_DATE = '2026-02-18';
          const finalEndDate = endDate || getWIBDate();
          const { data } = await supabase
            .from('daily_logs')
            .select('date, details')
            .eq('user_id', userId)
            .gte('date', START_DATE)
            .lte('date', finalEndDate);
          
          if (!data) return 0;

          const uniqueDays = new Set<string>();
          data.forEach(log => {
              const d = log.details || {};
              const hasHarian = !!(d.puasaStatus || d.sholatStatus || d.bukaStatus || d.sahurStatus);
              const hasLiterasi = d.literasiResponse && Array.isArray(d.literasiResponse) && d.literasiResponse.length > 0 && d.literasiResponse.some((a: any) => typeof a === 'string' && a.trim() !== '');
              
              if (hasHarian && hasLiterasi) {
                  uniqueDays.add(log.date);
              }
          });
          return uniqueDays.size;
      } catch { return 0; }
  },

  // [NEW] Update Literasi Validation (Guru/Admin)
  updateLiterasiValidation: async (userId: string, date: string, status: 'Sesuai' | 'Perbaiki') => {
      try {
          // 1. Get current log
          const { data: log } = await supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).single();
          if (!log) return false;

          // 2. Update details
          const details = { ...log.details, literasiValidation: status };
          
          // 3. Recalculate Points if 'Perbaiki' -> 0 points for literasi? 
          // Request: "murid dianggap belum mengerjakan Literasi" -> means we should remove points?
          // For now, let's just update the status. The points calculation logic in saveDailyLog handles points based on answers.
          // If we want to deduct points, we might need to update total_points.
          // However, the prompt says "berpengaruh pada poin murid". 
          // Let's assume if 'Perbaiki', we deduct 10 points (Literasi value) if they had it.
          
          let newPoints = log.total_points;
          if (status === 'Perbaiki') {
               // If previously Sesuai/None and had points, remove them.
               // Literasi is worth 100 points.
               if (log.details.literasiValidation !== 'Perbaiki') {
                   newPoints = Math.max(0, newPoints - 100);
               }
          } else {
               // If changing back to Sesuai from Perbaiki, add 100 points back
               if (log.details.literasiValidation === 'Perbaiki') {
                   newPoints += 100;
               }
          }

          const { error } = await supabase.from('daily_logs').update({ 
              details, 
              total_points: newPoints 
          }).eq('id', log.id);
          
          if (error) throw error;
          return true;
      } catch (e) { console.error(e); return false; }
  },

  // --- LEADERBOARD (UPDATED: Filter by Gender) ---
  getLeaderboard: async (gender: 'L' | 'P') => {
      try {
          // 1. Get users by gender
          const { data: users, error: err1 } = await supabase
              .from('users')
              .select('id, name, kelas, gender')
              .eq('role', 'murid')
              .eq('gender', gender);

          if (err1 || !users || users.length === 0) return [];

          const userIds = users.map(u => u.id);
          
          // 2. Get points sum with pagination and date filter
          const START_DATE = '2026-02-18';
          let allLogs: any[] = [];
          let from = 0;
          const step = 1000;

          while(true) {
             const { data: logs, error } = await supabase
                .from('daily_logs')
                .select('user_id, total_points')
                .in('user_id', userIds)
                .gte('date', START_DATE)
                .range(from, from + step - 1);
             
             if (error) break;
             if (!logs || logs.length === 0) break;
             allLogs = [...allLogs, ...logs];
             if (logs.length < step) break;
             from += step;
          }

          const scores: Record<string, number> = {};
          allLogs.forEach(l => {
              scores[l.user_id] = (scores[l.user_id] || 0) + (l.total_points || 0);
          });

          return users.map(u => ({
              ...u,
              points: scores[u.id] || 0
          })).sort((a, b) => b.points - a.points).slice(0, 50); // Top 50
      } catch(e) { console.error(e); return []; }
  },

  // [NEW] Leaderboard Antar Kelas: TOTAL POIN AKUMULASI
  // Fixing 0 Points issue: Corrected Date Range to 2025 to include testing data
  getClassLeaderboard: async () => {
      try {
          // 1. Get all students with class
          const { data: users, error: err1 } = await supabase.from('users').select('id, kelas').eq('role', 'murid').not('kelas', 'is', null);
          if (err1 || !users) return [];

          // 2. Init Stats and Create User Map
          const classStats: Record<string, { totalPoints: number }> = {};
          const userClassMap = new Map<string, string>();

          users.forEach(u => {
              if (!u.kelas) return;
              userClassMap.set(u.id, u.kelas); // Map ID -> Kelas

              if (!classStats[u.kelas]) {
                  classStats[u.kelas] = { totalPoints: 0 };
              }
          });

          // 3. Get all logs and Aggregate
          const START_DATE = '2026-02-18'; 
          const END_DATE = getWIBDate();

          let allLogs: any[] = [];
          let from = 0;
          const step = 1000;
          
          while (true) {
              const { data: logs, error } = await supabase
                  .from('daily_logs')
                  .select('user_id, total_points')
                  .gte('date', START_DATE)
                  .lte('date', END_DATE)
                  .range(from, from + step - 1);
              
              if (error) {
                  console.error('Error fetching logs batch:', error);
                  break;
              }
              if (!logs || logs.length === 0) break;
              
              allLogs = [...allLogs, ...logs];
              if (logs.length < step) break;
              from += step;
          }

          allLogs.forEach(l => {
              const kelas = userClassMap.get(l.user_id);
              if (kelas && classStats[kelas]) {
                  // Murni Penjumlahan Poin
                  classStats[kelas].totalPoints += (l.total_points || 0);
              }
          });

          // 4. Return Data Sorted by Total Points
          return Object.entries(classStats).map(([className, stats]) => {
              return {
                  id: className,
                  name: className,
                  points: stats.totalPoints, // Score utama adalah Total Poin Kelas
                  details: {
                      participation: 0,
                      avgActive: 0, 
                      totalStudents: 0
                  }
              };
          }).sort((a, b) => b.points - a.points);

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
        return {
            startRamadhanV1: data?.value?.startRamadhanV1 || '',
            startRamadhanV2: data?.value?.startRamadhanV2 || '',
            idulFitri: data?.value?.idulFitri || '',
            minRerataPoin: data?.value?.minRerataPoin || 210, // Default 210 (Laki-laki)
            minRerataPoinP: data?.value?.minRerataPoinP || 210, // Default 210 (Perempuan)
            statusBelowMin: data?.value?.statusBelowMin || 'BELUM MEMENUHI SYARAT UNTUK MENERIMA KARTU PESERTA',
            statusAboveMin: data?.value?.statusAboveMin || 'MENERIMA KARTU PESERTA'
        };
      } catch { 
          return { 
              startRamadhanV1: '', 
              startRamadhanV2: '', 
              idulFitri: '', 
              minRerataPoin: 210,
              minRerataPoinP: 210,
              statusBelowMin: 'BELUM MEMENUHI SYARAT UNTUK MENERIMA KARTU PESERTA',
              statusAboveMin: 'MENERIMA KARTU PESERTA'
          }; 
      }
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