import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, LiterasiMaterial, DailyLog, DailyLogDetails, RAMADAN_QUOTES, getWIBDate } from './types';

// --- Tab Harian ---
export const TabHarian = ({ user, initialDate }: { user: User, initialDate?: string }) => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate || getWIBDate());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Prayer Times State
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  // Form States
  const [puasaStatus, setPuasaStatus] = useState<'Penuh' | 'Tidak' | ''>('');
  const [alasanTidakPuasa, setAlasanTidakPuasa] = useState('');
  const [isHaid, setIsHaid] = useState(false);
  const [sahurStatus, setSahurStatus] = useState('');
  const [sahurLokasi, setSahurLokasi] = useState('');
  const [sahurWaktu, setSahurWaktu] = useState('');
  const [bukaStatus, setBukaStatus] = useState('');
  const [sholatStatus, setSholatStatus] = useState<Record<string, string>>({
    'Subuh': '', 'Zuhur': '', 'Asar': '', 'Magrib': '', 'Isya': ''
  });
  const [sunahStatus, setSunahStatus] = useState<Record<string, string>>({
    'Tarawih': '', 'Witir': '', 'Tahajud': '', 'Duha': ''
  });
  const [tadarusStatus, setTadarusStatus] = useState('');
  const [tadarusNote, setTadarusNote] = useState('');
  const [sedekahDiri, setSedekahDiri] = useState('');
  const [sedekahRumah, setSedekahRumah] = useState('');
  const [sedekahMasyarakat, setSedekahMasyarakat] = useState('');
  const [belajarMapel, setBelajarMapel] = useState('');
  const [belajarTopik, setBelajarTopik] = useState('');

  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  // --- Clock & Prayer Times Logic ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeString = () => {
      return currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
  };

  // Helper to check if a specific time has passed today
  const isTimePassed = (targetTimeStr: string, addMinutes = 0) => {
      if (!targetTimeStr) return true; // Fail safe
      
      // Check if Selected Date is today. 
      const todayStr = getWIBDate();
      if (selectedDate < todayStr) return true; // Past dates unlocked
      if (selectedDate > todayStr) return false; // Future dates locked

      // If Today, check specific time
      const now = new Date();
      const [hours, minutes] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes + addMinutes, 0, 0);
      
      return now >= target;
  };

  // Input Validation Helper (STRICT VALIDATION)
  const isLocked = (type: string) => {
      // If user is editing a future date, LOCK EVERYTHING except if specifically handled
      const todayStr = getWIBDate();
      if (selectedDate > todayStr) return true;
      
      // If past date, UNLOCK EVERYTHING
      if (selectedDate < todayStr) return false;

      // If Today, use Prayer Times
      if (!prayerTimes) return false; // Fail safe if API error

      switch (type) {
          case 'Buka': return !isTimePassed(prayerTimes.Maghrib);
          case 'Subuh': return !isTimePassed(prayerTimes.Fajr);
          case 'Zuhur': return !isTimePassed(prayerTimes.Dhuhr);
          case 'Asar': return !isTimePassed(prayerTimes.Asr);
          case 'Magrib': return !isTimePassed(prayerTimes.Maghrib);
          case 'Isya': return !isTimePassed(prayerTimes.Isha);
          case 'Tarawih': 
          case 'Witir': return !isTimePassed(prayerTimes.Isha, 30); // 30 mins after Isya
          case 'Duha': return !isTimePassed('06:00');
          case 'Tahajud': return false; // Always unlocked
          default: return false;
      }
  };

  // Load Data
  useEffect(() => {
     setLoading(true);
     setSubmitted(false);
     
     // Reset Form
     setPuasaStatus(''); setAlasanTidakPuasa(''); setIsHaid(false);
     setSahurStatus(''); setSahurLokasi(''); setSahurWaktu(''); setBukaStatus('');
     setSholatStatus({ 'Subuh': '', 'Zuhur': '', 'Asar': '', 'Magrib': '', 'Isya': '' });
     setSunahStatus({ 'Tarawih': '', 'Witir': '', 'Tahajud': '', 'Duha': '' });
     setTadarusStatus(''); setTadarusNote('');
     setSedekahDiri(''); setSedekahRumah(''); setSedekahMasyarakat('');
     setBelajarMapel(''); setBelajarTopik('');

     // Fetch Prayer Times for Selected Date
     SupabaseService.getPrayerSchedule(selectedDate).then(pt => {
        setPrayerTimes(pt);
     });

     SupabaseService.getDailyLog(user.id, selectedDate).then(data => {
         if (data) {
             setSubmitted(true);
             const d = data.details;
             if(d.puasaStatus) setPuasaStatus(d.puasaStatus as any);
             if(d.isHaid) setIsHaid(d.isHaid);
             if(d.alasanTidakPuasa) setAlasanTidakPuasa(d.alasanTidakPuasa);
             if(d.sahurStatus) setSahurStatus(d.sahurStatus);
             if(d.sahurLokasi) setSahurLokasi(d.sahurLokasi);
             if(d.sahurWaktu) setSahurWaktu(d.sahurWaktu);
             if(d.bukaStatus) setBukaStatus(d.bukaStatus);
             if(d.sholatStatus) setSholatStatus(d.sholatStatus);
             if(d.sunahStatus) setSunahStatus(d.sunahStatus);
             if(d.tadarusStatus) setTadarusStatus(d.tadarusStatus);
             if(d.tadarusNote) setTadarusNote(d.tadarusNote);
             if(d.sedekahDiri) setSedekahDiri(d.sedekahDiri);
             if(d.sedekahRumah) setSedekahRumah(d.sedekahRumah);
             if(d.sedekahMasyarakat) setSedekahMasyarakat(d.sedekahMasyarakat);
             if(d.belajarMapel) setBelajarMapel(d.belajarMapel);
             if(d.belajarTopik) setBelajarTopik(d.belajarTopik);
         } else {
             setSubmitted(false);
         }
         setLoading(false);
     });

     SupabaseService.getRamadanTarget(user.id).then(target => {
        if(target && target.startDate) {
            const start = new Date(target.startDate);
            const now = new Date();
            start.setHours(0,0,0,0); now.setHours(0,0,0,0);
            const diff = Math.ceil((now.getTime() - start.getTime()) / (86400000));
            setCurrentDay(diff >= 0 ? diff + 1 : 1);
        }
     });
  }, [user.id, selectedDate]);

  const quoteIndex = (currentDay - 1) % RAMADAN_QUOTES.length;
  const currentQuote = RAMADAN_QUOTES[quoteIndex >= 0 ? quoteIndex : 0];

  const handleAction = async (isDraft: boolean) => {
    const details: DailyLogDetails = {
          puasaStatus: puasaStatus as any, 
          alasanTidakPuasa, isHaid,
          sahurStatus, sahurLokasi, sahurWaktu, bukaStatus,
          sholatStatus, sunahStatus,
          tadarusStatus, tadarusNote,
          sedekahDiri, sedekahRumah, sedekahMasyarakat,
          belajarMapel, belajarTopik
    };

    const payload: DailyLog = {
        user_id: user.id,
        date: selectedDate,
        puasa_type: puasaStatus === 'Penuh' ? 'penuh' : 'tidak',
        total_points: 0,
        details: details
    };
    
    Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
    const success = await SupabaseService.saveDailyLog(payload);
    
    if (success) {
        if (isDraft) Swal.fire({ icon: 'success', title: 'Tersimpan Sementara', timer: 1500, showConfirmButton: false });
        else {
            setSubmitted(true);
            Swal.fire({ icon: 'success', title: 'Alhamdulillah', text: 'Laporan hari ini berhasil dikirim!', confirmButtonColor: '#0ea5e9' });
        }
    } else Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
  };

  const updateSholat = (p: string, v: string) => setSholatStatus(prev => ({...prev, [p]: v}));
  const updateSunah = (s: string, v: string) => setSunahStatus(prev => ({...prev, [s]: v}));

  // Render Logic Helpers
  const renderLockMessage = (msg: string) => <div className="text-[10px] text-red-400 italic mt-1 font-bold bg-red-50 p-1 rounded"><i className="fas fa-lock mr-1"></i> {msg}</div>;

  const IBADAH_OPTIONS = (
      <>
        <option value="" disabled hidden>----</option>
        <option value="Berjamaah di Masjid">🕌 Jamaah Masjid</option>
        <option value="Berjamaah di Musala">🕋 Jamaah Musala</option>
        <option value="Berjamaah di Rumah">🏠 Jamaah Rumah</option>
        <option value="Munfarid">👤 Sendiri</option>
        <option value="Lewat">❌ Lewat / Tidak</option>
      </>
  );

  if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;

  if (submitted) {
     return (
        <div className="p-6 pb-28 animate-slide-up min-h-[60vh] flex flex-col items-center">
           <div className="w-full glass-card p-4 rounded-[32px] mb-8 text-center bg-white border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                <div className="flex justify-between items-center px-2">
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu & Tanggal</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-2xl font-black text-slate-800">{getTimeString()}</h2>
                            <span className="text-xs font-bold text-slate-400">WIB</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <input type="date" className="bg-slate-100 text-slate-700 font-bold text-sm px-3 py-2 rounded-xl" value={selectedDate} max={getWIBDate()} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                </div>
           </div>
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 text-4xl shadow-lg"><i className="fas fa-check"></i></div>
           <h3 className="text-2xl font-black text-slate-800">Laporan Terkirim</h3>
           <p className="text-slate-500 text-sm mt-2">Data tanggal <strong>{selectedDate}</strong> sudah tersimpan.</p>
           <button onClick={() => setSubmitted(false)} className="mt-8 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm shadow-md hover:bg-slate-50">Edit Laporan Ini</button>
        </div>
     );
  }

  return (
    <div className="p-6 pb-28 animate-slide-up">
       <div className="glass-card bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[32px] p-6 text-white mb-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 opacity-80">
                <i className="fas fa-bolt text-yellow-300"></i>
                <span className="text-xs font-bold tracking-widest uppercase">Spirit Gen-Z • Hari ke-{currentDay}</span>
             </div>
             <p className="text-lg font-bold leading-relaxed">"{currentQuote}"</p>
          </div>
       </div>

       {/* HEADER & DATE */}
       <div className="glass-card p-1.5 rounded-[32px] mb-6 shadow-lg">
            <div className="bg-white rounded-[28px] p-4 flex justify-between items-center border border-slate-100">
                <div>
                     <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">JAM & TANGGAL</p>
                     <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tight">{getTimeString()}</span>
                        <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">WIB</span>
                     </div>
                </div>
                <div>
                     <input type="date" className="bg-primary-50 text-primary-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-primary-100 outline-none" value={selectedDate} max={getWIBDate()} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
            </div>
            {selectedDate !== getWIBDate() && (
                <div className="bg-orange-50 text-orange-600 text-[10px] font-bold text-center py-1 rounded-b-[20px]">
                    <i className="fas fa-history mr-1"></i> Anda mengisi laporan lampau
                </div>
            )}
       </div>

       <div className="space-y-5">
          {user.gender === 'P' && (
             <div className="glass-card p-1.5 rounded-[28px]">
                <div className="bg-gradient-to-r from-pink-50 to-white rounded-[24px] p-5 border border-white flex items-center justify-between">
                   <div><h3 className="text-pink-600 font-bold text-sm"><i className="fas fa-venus mr-1"></i> Mode Haid</h3></div>
                   <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={isHaid} onChange={(e) => setIsHaid(e.target.checked)} />
                </div>
             </div>
          )}

          {/* Puasa Section */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isHaid ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[24px] p-6 border border-white/60 space-y-4 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-check-circle text-emerald-500"></i> Misi Puasa</h3>
                 
                 <select className="w-full p-4 bg-white border-2 border-emerald-100 rounded-xl text-sm font-bold text-slate-700 outline-none" value={puasaStatus} onChange={(e) => setPuasaStatus(e.target.value as any)}>
                    <option value="" disabled hidden>----</option>
                    <option value="Penuh">✅ Puasa Penuh (100 Poin)</option>
                    <option value="Tidak">❌ Tidak Puasa (0 Poin)</option>
                 </select>

                 {puasaStatus === 'Tidak' && (
                     <div className="animate-slide-up">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alasan</label>
                        <select className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 outline-none" value={alasanTidakPuasa} onChange={(e) => setAlasanTidakPuasa(e.target.value)}>
                            <option value="" disabled hidden>----</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Bepergian Jauh">Bepergian Jauh</option>
                            <option value="Menstruasi">Menstruasi</option>
                            <option value="Sengaja">Sengaja Membatalkan</option>
                        </select>
                     </div>
                 )}

                 {/* Sahur & Buka */}
                 <div className="grid grid-cols-1 gap-4 pt-4 border-t border-emerald-100">
                    <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Sahur</label>
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-50">
                            {/* Sahur bebas diisi kapanpun */}
                            <select className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 border-b border-emerald-100 outline-none mb-3" value={sahurStatus} onChange={(e) => setSahurStatus(e.target.value)}>
                                <option value="" disabled hidden>----</option>
                                <option value="Ya">✅ Ya, Saya Sahur</option>
                                <option value="Tidak">❌ Tidak Sahur</option>
                            </select>
                            {sahurStatus === 'Ya' && (
                                <div className="grid grid-cols-1 gap-2 animate-slide-up">
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurLokasi} onChange={(e) => setSahurLokasi(e.target.value)}>
                                        <option value="" disabled hidden>--Lokasi--</option>
                                        <option value="Sahur Bersama Keluarga">🏠 Sahur Bersama Keluarga</option>
                                        <option value="Sahur di Masjid">🕌 Sahur di Masjid</option>
                                        <option value="Sahur di Musala">🕋 Sahur di Musala</option>
                                    </select>
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurWaktu} onChange={(e) => setSahurWaktu(e.target.value)}>
                                        <option value="" disabled hidden>--Waktu--</option>
                                        <option value="Sahur di Akhir (15 menit sebelum imsak)">🕑 Sahur di Akhir (15 mnt sblm imsak)</option>
                                        <option value="Sahur di Awal">🕐 Sahur di Awal</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Buka</label>
                        <div className={`bg-white/60 p-3 rounded-xl border border-emerald-50 ${isLocked('Buka') ? 'opacity-50 bg-slate-100' : ''}`}>
                            <select disabled={isLocked('Buka')} className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 outline-none" value={bukaStatus} onChange={(e) => setBukaStatus(e.target.value)}>
                                <option value="" disabled hidden>----</option>
                                <option value="Segera setelah Azan Maghrib">🥣 Segera setelah Azan</option>
                                <option value="Setelah Salat Maghrib">🕌 Setelah Salat Magrib</option>
                                <option value="Setelah Salat Tarawih">🌙 Setelah Salat Tarawih</option>
                            </select>
                            {isLocked('Buka') && renderLockMessage('Tunggu Maghrib')}
                        </div>
                    </div>
                 </div>
             </div>
          </div>

          {/* Salat Fardu */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isHaid ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="bg-gradient-to-br from-sky-50 to-white rounded-[24px] p-6 border border-white/60 space-y-3 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-sky-800 mb-2 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-pray text-sky-500"></i> Salat 5 Waktu</h3>
                 <div className="grid gap-3">
                     {Object.keys(sholatStatus).map(p => {
                         const locked = isLocked(p);
                         return (
                            <div key={p} className={`flex flex-col bg-white p-3 rounded-xl border border-sky-100 shadow-sm ${locked ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-sky-900 w-16">{p}</span>
                                    <select disabled={locked} className="bg-sky-50 text-xs font-bold text-sky-700 outline-none py-1.5 px-3 rounded-lg w-full ml-2" value={sholatStatus[p]} onChange={(e) => updateSholat(p, e.target.value)}>
                                        {IBADAH_OPTIONS}
                                    </select>
                                </div>
                                {locked && renderLockMessage(`Tunggu waktu ${p}`)}
                            </div>
                         );
                     })}
                 </div>
             </div>
          </div>

          {/* Sunah Section */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-amber-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-medal text-amber-500"></i> Bonus Pahala</h3>
                 <div className="grid grid-cols-1 gap-3 mb-4">
                     {Object.keys(sunahStatus).map(s => {
                         const locked = isLocked(s);
                         return (
                            <div key={s} className={`bg-white p-3 rounded-xl border border-amber-100 shadow-sm ${locked ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-900 w-24">{s}</span>
                                    <select disabled={locked} className="bg-amber-50 text-xs font-bold text-amber-700 outline-none py-1.5 px-3 rounded-lg w-full" value={sunahStatus[s]} onChange={(e) => updateSunah(s, e.target.value)}>
                                        {IBADAH_OPTIONS}
                                    </select>
                                </div>
                                {locked && s !== 'Tahajud' && renderLockMessage('Belum masuk waktu')}
                            </div>
                         );
                     })}
                 </div>
             </div>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => handleAction(true)} className="w-full py-3 bg-amber-400 text-amber-900 font-bold text-lg rounded-[24px] shadow-lg border-b-4 border-amber-600"><i className="fas fa-save mr-2"></i> Simpan Sementara</button>
            <button type="button" onClick={() => handleAction(false)} className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-[24px] shadow-lg">Kirim Laporan</button>
          </div>
       </div>
    </div>
  );
};

// --- Tab Progress (NEW 2-TAB SPLIT) ---
export const TabProgress = ({ user, onEdit }: { user: User, onEdit: (date: string, type: 'harian' | 'literasi') => void }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState<'ibadah' | 'literasi'>('ibadah');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const data = await SupabaseService.getStudentRecap(user.id);
            setLogs(data);
            const target = await SupabaseService.getRamadanTarget(user.id);
            if (target && target.startDate) setStartDate(target.startDate);
            setLoading(false);
        };
        init();
    }, [user.id]);

    const getDaysArray = () => {
        if (!startDate) return [];
        const start = new Date(startDate);
        const end = new Date(getWIBDate());
        const arr = [];
        for(let dt = new Date(start); dt <= end; dt.setDate(dt.getDate()+1)) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
        }
        return arr;
    };

    const days = getDaysArray();

    if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;
    if (days.length === 0) return <div className="p-10 text-center animate-slide-up"><p className="text-slate-500">Belum ada data. Silakan tunggu awal Ramadan.</p></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up">
             <div className="glass-card bg-gradient-to-r from-cyan-500 to-blue-500 rounded-[32px] p-6 text-white mb-6 shadow-xl text-center">
                 <h2 className="text-xl font-bold">Progress Ibadah</h2>
                 <p className="text-xs opacity-80">Pantau konsistensi ibadah & literasimu</p>
             </div>

             {/* Sub Tab Switcher */}
             <div className="flex p-1 bg-slate-200 rounded-xl mb-6 shadow-inner">
                 <button onClick={() => setSubTab('ibadah')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${subTab === 'ibadah' ? 'bg-white text-cyan-600 shadow-md transform scale-100' : 'text-slate-500 hover:bg-white/50'}`}>
                     Skor Ibadah
                 </button>
                 <button onClick={() => setSubTab('literasi')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${subTab === 'literasi' ? 'bg-white text-blue-600 shadow-md transform scale-100' : 'text-slate-500 hover:bg-white/50'}`}>
                     Status Literasi
                 </button>
             </div>

             <div className="space-y-4">
                 {days.map((date, idx) => {
                     const log = logs.find(l => l.date === date);
                     const isFilled = !!log;
                     const hasLiterasi = log?.details?.literasiResponse && log.details.literasiResponse.length > 0;
                     const dayNum = idx + 1;
                     
                     const scorePct = isFilled ? Math.min(100, Math.round((log.total_points / 150) * 100)) : 0;
                     const literasiPct = hasLiterasi ? 100 : 0;

                     return (
                         <div key={date} className="glass-card p-4 rounded-[24px] relative overflow-hidden flex items-center justify-between">
                             <div className="flex gap-3 items-center flex-1">
                                 <div className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md shrink-0">{dayNum}</div>
                                 <div className="w-full">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{date}</p>
                                     
                                     {subTab === 'ibadah' && (
                                         <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                                                <span>Poin Harian</span>
                                                <span>{log?.total_points || 0}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${isFilled ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-transparent'}`} style={{width: `${scorePct}%`}}></div>
                                            </div>
                                         </div>
                                     )}

                                     {subTab === 'literasi' && (
                                         <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                                                <span>Ketercapaian</span>
                                                <span className={hasLiterasi ? "text-blue-500" : "text-slate-400"}>{hasLiterasi ? "Selesai" : "-"}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${hasLiterasi ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-transparent'}`} style={{width: `${literasiPct}%`}}></div>
                                            </div>
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div className="ml-4">
                                {subTab === 'ibadah' && (
                                    <button onClick={() => onEdit(date, 'harian')} className={`w-16 py-2 rounded-xl text-[10px] font-bold uppercase transition shadow-sm ${isFilled ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                                        {isFilled ? 'Edit' : 'Isi'}
                                    </button>
                                )}
                                {subTab === 'literasi' && (
                                    <button onClick={() => onEdit(date, 'literasi')} className={`w-16 py-2 rounded-xl text-[10px] font-bold uppercase transition shadow-sm ${hasLiterasi ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {hasLiterasi ? 'Lihat' : 'Isi'}
                                    </button>
                                )}
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
};

// --- Tab Materi (Updated with Jadwal Sholat Header) ---
export const TabMateri = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const date = getWIBDate();

  useEffect(() => {
     SupabaseService.getPrayerSchedule(date).then(setPrayerTimes);
  }, []);

  const MATERI_LIST = [
    { 
        title: "Fikih Puasa", 
        icon: "fa-book-quran", 
        color: "text-emerald-600", 
        bg: "bg-emerald-50",
        content: (
            <div className="space-y-3 text-sm text-slate-600">
                <p><strong>Definisi:</strong> Puasa (Shaum) secara bahasa berarti menahan. Secara istilah berarti menahan diri dari hal-hal yang membatalkan puasa mulai dari terbit fajar hingga terbenam matahari dengan niat tertentu.</p>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 my-2">
                    <p className="font-arab text-right text-lg text-emerald-800 mb-2">يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِنْ قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ</p>
                    <p className="text-xs italic">"Wahai orang-orang yang beriman! Diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang-orang sebelum kamu agar kamu bertakwa." (QS. Al-Baqarah: 183)</p>
                </div>
            </div>
        )
    },
    { 
        title: "Berbakti Kepada Orang Tua", 
        icon: "fa-hands-holding-child", 
        color: "text-blue-600", 
        bg: "bg-blue-50",
        content: (
            <div className="space-y-3 text-sm text-slate-600">
                <p>Birrul Walidain (berbakti kepada orang tua) adalah amalan utama yang posisinya sangat tinggi dalam Islam.</p>
            </div>
        )
    },
    { 
        title: "Zakat Fitrah", 
        icon: "fa-sack-dollar", 
        color: "text-amber-600", 
        bg: "bg-amber-50",
        content: (
            <div className="space-y-3 text-sm text-slate-600">
                <p>Zakat Fitrah adalah zakat wajib yang dikeluarkan setiap jiwa muslim di bulan Ramadan sebelum shalat Idul Fitri.</p>
            </div>
        )
    }
  ];

  return (
    <div className="p-6 pb-28 animate-slide-up">
       <div className="glass-card bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10 text-center">
             <i className="fas fa-kaaba text-5xl mb-3 opacity-80"></i>
             <h2 className="text-xl font-bold">Khazanah Islam</h2>
             <p className="text-xs text-slate-400">Jadwal Imsakiyah & Materi</p>
          </div>
       </div>

       {/* Jadwal Sholat Widget (Permanent Header) */}
       {prayerTimes && (
           <div className="glass-card p-4 rounded-[28px] mb-6 animate-slide-up border-2 border-primary-50">
               <div className="text-center mb-4">
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Jadwal Sholat Pasuruan</h3>
                   <p className="text-xs text-slate-400 font-bold">{date}</p>
               </div>
               <div className="grid grid-cols-3 gap-2">
                   <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400">IMSAK</p>
                       <p className="font-black text-slate-700">{prayerTimes.Imsak}</p>
                   </div>
                   <div className="bg-emerald-50 p-2 rounded-xl text-center border border-emerald-100">
                       <p className="text-[10px] font-bold text-emerald-500">SUBUH</p>
                       <p className="font-black text-emerald-700">{prayerTimes.Fajr}</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400">DUHA</p>
                       <p className="font-black text-slate-700">06:00</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400">ZUHUR</p>
                       <p className="font-black text-slate-700">{prayerTimes.Dhuhr}</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400">ASAR</p>
                       <p className="font-black text-slate-700">{prayerTimes.Asr}</p>
                   </div>
                   <div className="bg-orange-50 p-2 rounded-xl text-center border border-orange-100">
                       <p className="text-[10px] font-bold text-orange-500">MAGRIB</p>
                       <p className="font-black text-orange-700">{prayerTimes.Maghrib}</p>
                   </div>
                   <div className="bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100 col-span-3">
                       <p className="text-[10px] font-bold text-indigo-500">ISYA (Tarawih 30mnt setelah Isya)</p>
                       <p className="font-black text-indigo-700">{prayerTimes.Isha}</p>
                   </div>
               </div>
           </div>
       )}
       
       <div className="space-y-3">
           {MATERI_LIST.map((item, idx) => {
               const isOpen = activeIdx === idx;
               return (
                   <div key={idx} className="glass-card rounded-[24px] overflow-hidden transition-all duration-300">
                       <button 
                         onClick={() => setActiveIdx(isOpen ? null : idx)}
                         className={`w-full p-5 flex items-center justify-between transition-colors ${isOpen ? item.bg : 'hover:bg-white/60'}`}
                       >
                           <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${item.color} shadow-sm text-lg`}>
                                   <i className={`fas ${item.icon}`}></i>
                               </div>
                               <h3 className="font-bold text-slate-800 text-sm text-left">{item.title}</h3>
                           </div>
                           <div className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-90' : ''}`}>
                               <i className="fas fa-chevron-right"></i>
                           </div>
                       </button>
                       
                       <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="p-5 pt-0 border-t border-slate-100 bg-white/40">
                               {item.content}
                           </div>
                       </div>
                   </div>
               );
           })}
       </div>
    </div>
  );
};

// --- Tab Literasi ---
export const TabLiterasi = ({ user, initialDate }: { user: User, initialDate?: string }) => {
  const [material, setMaterial] = useState<LiterasiMaterial | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(initialDate || getWIBDate());

  useEffect(() => {
    if(initialDate) setDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const mat = await SupabaseService.getLiterasiMaterial(date);
      setMaterial(mat);
      
      const log = await SupabaseService.getDailyLog(user.id, date);
      if (log && log.details.literasiResponse && log.details.literasiResponse.length > 0) {
        setAnswers(log.details.literasiResponse);
        setSubmitted(true);
      } else {
        setAnswers(new Array(mat.questions.length).fill(''));
      }
      setLoading(false);
    };
    init();
  }, [user.id, date]);

  const handleSave = async () => {
     if (answers.some(a => !a.trim())) {
        return Swal.fire('Belum Lengkap', 'Jawab semua pertanyaan ya.', 'warning');
     }
     Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
     const log = await SupabaseService.getDailyLog(user.id, date);
     let details = log?.details || {};
     details.literasiResponse = answers;
     const payload: DailyLog = {
         user_id: user.id, date: date,
         puasa_type: log?.puasa_type || 'tidak', total_points: 0,
         details: details as DailyLogDetails
     };
     const success = await SupabaseService.saveDailyLog(payload);
     if(success) {
        setSubmitted(true);
        Swal.fire('Sukses', 'Literasi tercatat!', 'success');
     } else Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
  };

  if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;
  if (!material || !material.youtubeUrl) return <div className="p-10 text-center"><p className="text-slate-500">Belum ada materi literasi untuk tanggal {date}.</p></div>;

  const renderVideo = () => {
      if (material.youtubeUrl.includes('<iframe')) {
          return <div dangerouslySetInnerHTML={{__html: material.youtubeUrl}} className="aspect-video w-full rounded-xl overflow-hidden shadow-lg" />;
      }
      let videoId = '';
      if(material.youtubeUrl.includes('v=')) videoId = material.youtubeUrl.split('v=')[1]?.split('&')[0];
      else if(material.youtubeUrl.includes('youtu.be/')) videoId = material.youtubeUrl.split('youtu.be/')[1];
      
      if(videoId) {
          return <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full aspect-video rounded-xl shadow-lg" allowFullScreen title="Literasi Video"></iframe>
      }
      return <div className="p-4 bg-red-100 text-red-500 rounded-xl">Format video tidak dikenali. <a href={material.youtubeUrl} target="_blank" className="underline">Klik Link Ini</a></div>;
  };

  return (
      <div className="p-6 pb-28 animate-slide-up">
           <div className="glass-card bg-gradient-to-r from-pink-500 to-rose-500 rounded-[32px] p-6 text-white mb-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-bold mb-1"><i className="fas fa-play-circle mr-2"></i>Literasi Ramadan</h2>
                    <p className="text-xs opacity-90">Simak video & jawab pertanyaan</p>
                 </div>
                 <input type="date" className="bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/30 outline-none" value={date} max={getWIBDate()} onChange={(e) => setDate(e.target.value)} />
              </div>
           </div>

           <div className="space-y-6">
               <div className="glass-card p-2 rounded-[24px]">
                   {renderVideo()}
               </div>
               <div className="glass-card p-6 rounded-[24px]">
                   <h3 className="font-bold text-slate-800 mb-4">Pertanyaan Pemahaman ({date})</h3>
                   {submitted ? (
                       <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-800 text-sm font-bold text-center"><i className="fas fa-check-circle text-2xl mb-2 block"></i>Kamu sudah mengerjakan literasi tanggal ini.</div>
                   ) : (
                       <div className="space-y-4">
                           {material.questions.map((q, idx) => (
                               <div key={idx}>
                                   <label className="text-xs font-bold text-slate-500 block mb-2">{idx+1}. {q}</label>
                                   <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-200 outline-none resize-none" rows={3} value={answers[idx]} onChange={e => { const newA = [...answers]; newA[idx] = e.target.value; setAnswers(newA); }} placeholder="Tulis jawabanmu..." />
                               </div>
                           ))}
                           <button onClick={handleSave} className="w-full py-4 bg-pink-600 text-white font-bold rounded-xl shadow-lg hover:bg-pink-700 transition">Kirim Jawaban</button>
                       </div>
                   )}
               </div>
           </div>
      </div>
  );
};

// --- Tab Leaderboard (Updated: Filter by Class) ---
export const TabLeaderboard = ({ user }: { user?: User }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Pass the user's class to the service
        SupabaseService.getLeaderboard(user?.kelas || undefined).then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, [user]);

    if(loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-amber-400 to-orange-500 rounded-[32px] p-6 text-white mb-6 shadow-xl text-center relative overflow-hidden">
                <i className="fas fa-trophy text-6xl absolute -bottom-4 -right-4 opacity-20"></i>
                <h2 className="text-2xl font-black mb-1">Papan Juara</h2>
                <p className="text-xs font-bold opacity-90">Kelas {user?.kelas || 'Umum'}</p>
            </div>

            <div className="space-y-3">
                {users.map((u, idx) => {
                    let rankClass = "bg-white/60";
                    let textClass = "text-slate-600";
                    if(idx === 0) { rankClass = "bg-yellow-100 border-yellow-200"; textClass = "text-yellow-700"; }
                    if(idx === 1) { rankClass = "bg-slate-100 border-slate-200"; textClass = "text-slate-600"; }
                    if(idx === 2) { rankClass = "bg-orange-50 border-orange-200"; textClass = "text-orange-700"; }

                    return (
                        <div key={u.id} className={`p-4 rounded-[24px] flex items-center justify-between border ${rankClass} shadow-sm`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-full ${idx < 3 ? 'bg-white shadow' : 'bg-slate-200 text-slate-500'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${textClass}`}>{u.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400">{u.kelas || 'Umum'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-primary-600">{u.points}</span>
                                <span className="text-[10px] text-slate-400 block -mt-1">Poin</span>
                            </div>
                        </div>
                    );
                })}
                {users.length === 0 && <div className="text-center text-slate-400">Belum ada data.</div>}
            </div>
        </div>
    );
};

// --- Tab Profile ---
export const TabProfile = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-white rounded-[40px] p-8 text-center shadow-xl border border-slate-100 relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <div className="w-24 h-24 rounded-full bg-white p-2 mx-auto relative z-10 shadow-lg mb-4">
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl text-indigo-500 font-bold">
                        {user.name.charAt(0)}
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-800">{user.name}</h2>
                <p className="text-sm font-bold text-slate-400 mb-6">{user.role.toUpperCase()} {user.kelas ? `• ${user.kelas}` : ''}</p>
                <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-[24px] hover:bg-red-100 transition"><i className="fas fa-sign-out-alt mr-2"></i> Keluar Aplikasi</button>
            </div>
            <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Spansa Rama v2.1</p>
                 <p className="text-[10px] text-slate-300">Dibuat dengan ❤️ oleh Tim IT Spansa</p>
            </div>
        </div>
    );
};