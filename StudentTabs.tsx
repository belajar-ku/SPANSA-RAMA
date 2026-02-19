import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, LiterasiMaterial, DailyLog, DailyLogDetails, RAMADAN_QUOTES, getWIBDate } from './types';
import { toTitleCase } from './App';

// Declare global YT for TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// --- CONSTANTS ---
const SURAH_LIST = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Asy-Syu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Az-Zariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Tagabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghasyiyah", "Al-Fajar", "Al-Balad",
  "Asy-Syams", "Al-Lail", "Ad-Duha", "Al-Insyirah", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takasur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un", "Al-Kausar", "Al-Kafirun", "An-Nasr",
  "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

// Helper to extract YouTube ID accurately
const getVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- Tab Harian ---
export const TabHarian = ({ user, initialDate }: { user: User, initialDate?: string }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false); // NEW: Track draft status
  const [selectedDate, setSelectedDate] = useState(initialDate || getWIBDate());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [targetStartDate, setTargetStartDate] = useState('');
  
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
  
  // Tadarus States (Split)
  const [tadarusStatus, setTadarusStatus] = useState('');
  const [tadarusSurah, setTadarusSurah] = useState('');
  const [tadarusAyatStart, setTadarusAyatStart] = useState('');
  const [tadarusAyatEnd, setTadarusAyatEnd] = useState('');

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
      const todayStr = getWIBDate();
      if (selectedDate > todayStr) return true;
      if (selectedDate < todayStr) return false;

      if (!prayerTimes) return false; 

      switch (type) {
          case 'Buka': return !isTimePassed(prayerTimes.Maghrib);
          case 'Subuh': return !isTimePassed(prayerTimes.Fajr);
          case 'Zuhur': return !isTimePassed(prayerTimes.Dhuhr);
          case 'Asar': return !isTimePassed(prayerTimes.Asr);
          case 'Magrib': return !isTimePassed(prayerTimes.Maghrib);
          case 'Isya': return !isTimePassed(prayerTimes.Isha);
          case 'Tarawih': 
          case 'Witir': return !isTimePassed(prayerTimes.Isha, 30);
          case 'Duha': return !isTimePassed('06:00');
          case 'Tahajud': return false;
          default: return false;
      }
  };

  // Load Data
  useEffect(() => {
     setLoading(true);
     setSubmitted(false);
     setIsDraft(false);
     
     // Reset Form
     setPuasaStatus(''); setAlasanTidakPuasa(''); setIsHaid(false);
     setSahurStatus(''); setSahurLokasi(''); setSahurWaktu(''); setBukaStatus('');
     setSholatStatus({ 'Subuh': '', 'Zuhur': '', 'Asar': '', 'Magrib': '', 'Isya': '' });
     setSunahStatus({ 'Tarawih': '', 'Witir': '', 'Tahajud': '', 'Duha': '' });
     setTadarusStatus(''); 
     setTadarusSurah(''); setTadarusAyatStart(''); setTadarusAyatEnd('');
     setSedekahDiri(''); setSedekahRumah(''); setSedekahMasyarakat('');
     setBelajarMapel(''); setBelajarTopik('');

     SupabaseService.getPrayerSchedule(selectedDate).then(pt => {
        setPrayerTimes(pt);
     });

     SupabaseService.getDailyLog(user.id, selectedDate).then(data => {
         if (data) {
             setSubmitted(true);
             const d = data.details;
             
             // Check if it's a draft
             setIsDraft(!!d.is_draft);

             if(d.puasaStatus) setPuasaStatus(d.puasaStatus as any);
             if(d.isHaid) setIsHaid(d.isHaid);
             if(d.alasanTidakPuasa) setAlasanTidakPuasa(d.alasanTidakPuasa);
             if(d.sahurStatus) setSahurStatus(d.sahurStatus);
             if(d.sahurLokasi) setSahurLokasi(d.sahurLokasi);
             if(d.sahurWaktu) setSahurWaktu(d.sahurWaktu);
             if(d.bukaStatus) setBukaStatus(d.bukaStatus);
             if(d.sholatStatus) setSholatStatus(d.sholatStatus);
             if(d.sunahStatus) setSunahStatus(d.sunahStatus);
             
             if(d.tadarusStatus) {
                 setTadarusStatus(d.tadarusStatus);
                 // Parse Tadarus Note "Surah X: Ayat Y-Z"
                 if(d.tadarusNote) {
                     const parts = d.tadarusNote.split(': Ayat ');
                     if(parts.length === 2) {
                         setTadarusSurah(parts[0]);
                         const verseParts = parts[1].split('-');
                         if(verseParts.length >= 1) setTadarusAyatStart(verseParts[0]);
                         if(verseParts.length >= 2) setTadarusAyatEnd(verseParts[1]);
                     } else {
                         // Fallback for old data
                         setTadarusSurah(d.tadarusNote);
                     }
                 }
             }

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
            setTargetStartDate(target.startDate);
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

  const handleAction = async (draftAction: boolean) => {
    // Check if menstruasi
    const isMenstruasi = puasaStatus === 'Tidak' && alasanTidakPuasa === 'Menstruasi';

    // Construct Tadarus Note
    let finalTadarusNote = '';
    if(tadarusStatus === 'Ya' && !isMenstruasi) {
        if(tadarusSurah) {
            finalTadarusNote = `${tadarusSurah}`;
            if(tadarusAyatStart) finalTadarusNote += `: Ayat ${tadarusAyatStart}`;
            if(tadarusAyatEnd) finalTadarusNote += `-${tadarusAyatEnd}`;
        }
    }

    const details: DailyLogDetails = {
          puasaStatus: puasaStatus as any, 
          alasanTidakPuasa, isHaid,
          // If menstruasi, these are cleared/ignored logic-wise, but we send what's in state (which should be empty if disabled)
          sahurStatus: isMenstruasi ? '' : sahurStatus, 
          sahurLokasi: isMenstruasi ? '' : sahurLokasi, 
          sahurWaktu: isMenstruasi ? '' : sahurWaktu, 
          bukaStatus: isMenstruasi ? '' : bukaStatus,
          sholatStatus: isMenstruasi ? {} : sholatStatus, 
          sunahStatus: isMenstruasi ? {} : sunahStatus,
          tadarusStatus: isMenstruasi ? '' : tadarusStatus, 
          tadarusNote: isMenstruasi ? '' : finalTadarusNote,
          // Allowed fields
          sedekahDiri, sedekahRumah, sedekahMasyarakat,
          belajarMapel, belajarTopik,
          is_draft: draftAction // IMPORTANT: Save draft status
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
        if (draftAction) {
            setIsDraft(true);
            setSubmitted(true);
            Swal.fire({ icon: 'success', title: 'Tersimpan Sementara', timer: 1500, showConfirmButton: false });
        }
        else {
            setIsDraft(false);
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

  // CHECK DATE START LOGIC (Strict)
  // Logic Pra-Ramadan: Jika tanggal yang dipilih kurang dari targetStartDate, maka masuk mode "Pra-Ramadan"
  // Mode ini tetap mengizinkan pengisian Salat, Sunah (Sebagian), Tadarus, dll. Tapi Puasa disembunyikan.
  const isPreRamadan = targetStartDate && selectedDate < targetStartDate;
  
  // MENSTRUASI LOGIC
  const isMenstruasi = puasaStatus === 'Tidak' && alasanTidakPuasa === 'Menstruasi';

  // SUBMIT TIME LOCK (20:00)
  const currentHour = currentTime.getHours();
  // Only apply lock if it's the current date. Past dates are editable anytime.
  const isToday = selectedDate === getWIBDate();
  const isSubmitLocked = isToday && currentHour < 20;

  if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;

  if (submitted) {
     return (
        <div className="p-6 pb-28 animate-slide-up min-h-[60vh] flex flex-col items-center">
           <div className="w-full glass-card p-4 rounded-[32px] mb-8 text-center bg-white border border-slate-100 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isDraft ? 'from-yellow-400 to-orange-400' : 'from-blue-400 to-purple-400'}`}></div>
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
           
           {/* Conditional Icon & Text based on isDraft */}
           <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg ${isDraft ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
               <i className={`fas ${isDraft ? 'fa-edit' : 'fa-check'}`}></i>
           </div>
           
           <h3 className="text-2xl font-black text-slate-800">{isDraft ? 'Draft Terkirim Sementara' : 'Laporan Terkirim'}</h3>
           <p className="text-slate-500 text-sm mt-2">Data tanggal <strong>{selectedDate}</strong> {isDraft ? 'belum dikirim final.' : 'sudah tersimpan.'}</p>
           
           <button onClick={() => setSubmitted(false)} className="mt-8 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm shadow-md hover:bg-slate-50">
               {isDraft ? 'Edit Laporan Ini' : 'Edit Laporan Ini'}
           </button>
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
            {isPreRamadan && (
                <div className="bg-blue-50 text-blue-600 text-[10px] font-bold text-center py-1 rounded-b-[20px]">
                    <i className="fas fa-info-circle mr-1"></i> Pra-Ramadan (Latihan)
                </div>
            )}
            {!isPreRamadan && selectedDate !== getWIBDate() && (
                <div className="bg-orange-50 text-orange-600 text-[10px] font-bold text-center py-1 rounded-b-[20px]">
                    <i className="fas fa-history mr-1"></i> Anda mengisi laporan lampau
                </div>
            )}
       </div>

       {/* Form Sections */}
       <div className="space-y-5">
          {user.gender === 'P' && (
             <div className="glass-card p-1.5 rounded-[28px]">
                <div className="bg-gradient-to-r from-pink-50 to-white rounded-[24px] p-5 border border-white flex items-center justify-between">
                   <div><h3 className="text-pink-600 font-bold text-sm"><i className="fas fa-venus mr-1"></i> Mode Haid (Shortcut)</h3></div>
                   <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={isHaid} onChange={(e) => setIsHaid(e.target.checked)} />
                </div>
             </div>
          )}

          {/* Puasa Section - HIDDEN IF PRE-RAMADAN */}
          {!isPreRamadan && (
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

                     {/* Sahur & Buka - DISABLED IF MENSTRUASI */}
                     <div className={`grid grid-cols-1 gap-4 pt-4 border-t border-emerald-100 ${isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {isMenstruasi && <div className="text-xs text-red-500 font-bold text-center col-span-1"><i className="fas fa-ban mr-1"></i> Dikunci karena Menstruasi</div>}
                        <div>
                            <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Sahur</label>
                            <div className="bg-white/60 p-3 rounded-xl border border-emerald-50">
                                <select disabled={isMenstruasi} className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 border-b border-emerald-100 outline-none mb-3" value={sahurStatus} onChange={(e) => setSahurStatus(e.target.value)}>
                                    <option value="" disabled hidden>----</option>
                                    <option value="Ya">✅ Ya, Saya Sahur</option>
                                    <option value="Tidak">❌ Tidak Sahur</option>
                                </select>
                                {sahurStatus === 'Ya' && !isMenstruasi && (
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
                                <select disabled={isLocked('Buka') || isMenstruasi} className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 outline-none" value={bukaStatus} onChange={(e) => setBukaStatus(e.target.value)}>
                                    <option value="" disabled hidden>----</option>
                                    <option value="Segera setelah Azan Magrib">🥣 Segera setelah Azan</option>
                                    <option value="Setelah Salat Magrib">🕌 Setelah Salat Magrib</option>
                                    <option value="Setelah Salat Tarawih">🌙 Setelah Salat Tarawih</option>
                                </select>
                                {isLocked('Buka') && !isMenstruasi && renderLockMessage('Tunggu Magrib')}
                            </div>
                        </div>
                     </div>
                 </div>
              </div>
          )}

          {/* Salat Fardu - DISABLED IF MENSTRUASI */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isHaid || isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div className="bg-gradient-to-br from-sky-50 to-white rounded-[24px] p-6 border border-white/60 space-y-3 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-2 relative z-10">
                     <h3 className="font-bold text-sky-800 flex items-center gap-2 text-lg"><i className="fas fa-pray text-sky-500"></i> Salat 5 Waktu</h3>
                     {isMenstruasi && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">TIDAK WAJIB</span>}
                 </div>
                 <div className="grid gap-3">
                     {Object.keys(sholatStatus).map(p => {
                         const locked = isLocked(p);
                         return (
                            <div key={p} className={`flex flex-col bg-white p-3 rounded-xl border border-sky-100 shadow-sm ${locked ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-sky-900 w-16">{p}</span>
                                    <select disabled={locked || isMenstruasi} className="bg-sky-50 text-xs font-bold text-sky-700 outline-none py-1.5 px-3 rounded-lg w-full ml-2" value={sholatStatus[p]} onChange={(e) => updateSholat(p, e.target.value)}>
                                        {IBADAH_OPTIONS}
                                    </select>
                                </div>
                                {locked && !isMenstruasi && renderLockMessage(`Tunggu waktu ${p}`)}
                            </div>
                         );
                     })}
                 </div>
             </div>
          </div>

          {/* Sunah Section - DISABLED IF MENSTRUASI */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div className="bg-gradient-to-br from-amber-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-medal text-amber-500"></i> Bonus Pahala</h3>
                 <div className="grid grid-cols-1 gap-3 mb-4">
                     {Object.keys(sunahStatus).map(s => {
                         // PRE-RAMADAN LOGIC: Hide Tarawih & Witir
                         if (isPreRamadan && (s === 'Tarawih' || s === 'Witir')) return null;

                         const locked = isLocked(s);
                         return (
                            <div key={s} className={`bg-white p-3 rounded-xl border border-amber-100 shadow-sm ${locked ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-900 w-24">{s}</span>
                                    <select disabled={locked || isMenstruasi} className="bg-amber-50 text-xs font-bold text-amber-700 outline-none py-1.5 px-3 rounded-lg w-full" value={sunahStatus[s]} onChange={(e) => updateSunah(s, e.target.value)}>
                                        {IBADAH_OPTIONS}
                                    </select>
                                </div>
                                {locked && s !== 'Tahajud' && !isMenstruasi && renderLockMessage('Belum masuk waktu')}
                            </div>
                         );
                     })}
                 </div>
             </div>
          </div>

          {/* Misi Tadarus - UPDATED: Dropdown Surah & Verse Inputs */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div className="bg-gradient-to-br from-teal-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-book-quran text-teal-500"></i> Misi Tadarus</h3>
                 <div className="space-y-3">
                     <select disabled={isMenstruasi} className="w-full p-3 bg-white border border-teal-100 rounded-xl text-sm font-bold text-slate-700 outline-none" value={tadarusStatus} onChange={(e) => setTadarusStatus(e.target.value)}>
                         <option value="" disabled hidden>----</option>
                         <option value="Ya">✅ Ya, Membaca Al-Qur'an</option>
                         <option value="Tidak">❌ Tidak / Berhalangan</option>
                     </select>
                     
                     {/* Dynamic Fields for Qur'an */}
                     {tadarusStatus === 'Ya' && (
                         <div className="animate-slide-up space-y-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
                             <label className="text-[10px] font-bold text-teal-600 uppercase block">Nama Surah</label>
                             <select className="w-full p-2.5 bg-white border border-teal-200 rounded-lg text-sm font-bold text-slate-700 outline-none" value={tadarusSurah} onChange={(e) => setTadarusSurah(e.target.value)}>
                                 <option value="" disabled hidden>-- Pilih Surah --</option>
                                 {SURAH_LIST.map((s, idx) => (
                                     <option key={idx} value={s}>{idx + 1}. {s}</option>
                                 ))}
                             </select>
                             
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                 <div>
                                     <label className="text-[10px] font-bold text-teal-600 uppercase block mb-1">Dari Ayat</label>
                                     <input type="number" className="w-full p-2 bg-white border border-teal-200 rounded-lg text-sm font-bold outline-none placeholder:text-teal-200" placeholder="1" value={tadarusAyatStart} onChange={(e) => setTadarusAyatStart(e.target.value)} />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-bold text-teal-600 uppercase block mb-1">Sampai Ayat</label>
                                     <input type="number" className="w-full p-2 bg-white border border-teal-200 rounded-lg text-sm font-bold outline-none placeholder:text-teal-200" placeholder="10" value={tadarusAyatEnd} onChange={(e) => setTadarusAyatEnd(e.target.value)} />
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
          </div>

          {/* Misi Kebaikan - ALWAYS ACTIVE */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-rose-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-hand-holding-heart text-rose-500"></i> Misi Kebaikan</h3>
                 <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase mb-1 block">Sedekah Diri (Jujur/Sopan)</label>
                        <input type="text" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm" placeholder="Apa Kebaikanmu Hari Ini?" value={sedekahDiri} onChange={(e) => setSedekahDiri(toTitleCase(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase mb-1 block">Bantu Orang Tua</label>
                        <input type="text" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm" placeholder="Contoh: Cuci Piring" value={sedekahRumah} onChange={(e) => setSedekahRumah(toTitleCase(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase mb-1 block">Aksi Sosial</label>
                        <input type="text" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm" placeholder="Contoh: Buang Sampah Pada Tempatnya" value={sedekahMasyarakat} onChange={(e) => setSedekahMasyarakat(toTitleCase(e.target.value))} />
                    </div>
                 </div>
             </div>
          </div>

          {/* Jurnal Belajar - ALWAYS ACTIVE */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-blue-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-book-open text-blue-500"></i> Jurnal Belajar</h3>
                 <div className="space-y-3">
                     <div>
                         <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">Mata Pelajaran</label>
                         <input type="text" className="w-full p-3 bg-white border border-blue-100 rounded-xl text-sm" placeholder="Matematika" value={belajarMapel} onChange={(e) => setBelajarMapel(toTitleCase(e.target.value))} />
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-blue-400 uppercase mb-1 block">Apa yang Dipelajari?</label>
                         <input type="text" className="w-full p-3 bg-white border border-blue-100 rounded-xl text-sm" placeholder="Ringkasan Materi..." value={belajarTopik} onChange={(e) => setBelajarTopik(toTitleCase(e.target.value))} />
                     </div>
                 </div>
             </div>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => handleAction(true)} className="w-full py-3 bg-amber-400 text-amber-900 font-bold text-lg rounded-[24px] shadow-lg border-b-4 border-amber-600"><i className="fas fa-save mr-2"></i> Simpan Sementara</button>
            <button 
                type="button" 
                onClick={() => handleAction(false)} 
                disabled={isSubmitLocked}
                className={`w-full py-4 font-bold text-lg rounded-[24px] shadow-lg transition-all ${isSubmitLocked ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:scale-[1.02]'}`}
            >
                {isSubmitLocked ? <><i className="fas fa-clock mr-2"></i> Aktif Pukul 20.00</> : 'Kirim Laporan'}
            </button>
          </div>
       </div>
    </div>
  );
};

// ... (TabProgress and TabLeaderboard remain the same) ...
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

export const TabLeaderboard = ({ user }: { user?: User }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'L' | 'P' | 'Kelas'>('L');

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            if (tab === 'Kelas') {
                const data = await SupabaseService.getClassLeaderboard();
                setUsers(data);
            } else {
                const data = await SupabaseService.getLeaderboard(tab);
                setUsers(data);
            }
            setLoading(false);
        };
        fetchData();
    }, [user, tab]);

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-amber-400 to-orange-500 rounded-[32px] p-6 text-white mb-6 shadow-xl text-center relative overflow-hidden">
                <i className="fas fa-trophy text-6xl absolute -bottom-4 -right-4 opacity-20"></i>
                <h2 className="text-2xl font-black mb-1">Papan Juara</h2>
                <p className="text-xs font-bold opacity-90">
                    {tab === 'Kelas' ? 'Total Poin Akumulasi' : `Kategori ${tab === 'L' ? 'Putra' : 'Putri'}`}
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-200 rounded-2xl mb-6 shadow-inner">
                 <button onClick={() => setTab('L')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'L' ? 'bg-white text-blue-600 shadow-md transform scale-100' : 'text-slate-500 hover:bg-white/50'}`}>
                     <i className="fas fa-male mr-1"></i> Putra
                 </button>
                 <button onClick={() => setTab('P')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'P' ? 'bg-white text-pink-600 shadow-md transform scale-100' : 'text-slate-500 hover:bg-white/50'}`}>
                     <i className="fas fa-female mr-1"></i> Putri
                 </button>
                 <button onClick={() => setTab('Kelas')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'Kelas' ? 'bg-white text-purple-600 shadow-md transform scale-100' : 'text-slate-500 hover:bg-white/50'}`}>
                     <i className="fas fa-school mr-1"></i> Kelas
                 </button>
            </div>

            {loading ? <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div> : (
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
                                        {/* Jika Mode Kelas, tampilkan detail partisipasi */}
                                        {tab === 'Kelas' ? (
                                            <p className="text-[10px] font-bold text-slate-400">Total Poin</p>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-400">{u.kelas || 'Umum'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-lg text-primary-600">{u.points}</span>
                                    <span className="text-[10px] text-slate-400 block -mt-1">{tab === 'Kelas' ? 'Total' : 'Poin'}</span>
                                </div>
                            </div>
                        );
                    })}
                    {users.length === 0 && <div className="text-center text-slate-400 p-4">Belum ada data untuk kategori ini.</div>}
                </div>
            )}
        </div>
    );
};

// --- Tab Literasi (New) ---
export const TabLiterasi = ({ user, initialDate }: { user: User, initialDate: string }) => {
    const [date, setDate] = useState(initialDate || getWIBDate());
    const [material, setMaterial] = useState<LiterasiMaterial | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Video State
    const [videoFinished, setVideoFinished] = useState(false);
    const [videoStarted, setVideoStarted] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if(initialDate) setDate(initialDate);
    }, [initialDate]);

    // Load Youtube API only once
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setVideoFinished(false); 
            setVideoStarted(false);
            setIsPlayerReady(false);

            const mat = await SupabaseService.getLiterasiMaterial(date);
            setMaterial(mat);
            
            const log = await SupabaseService.getDailyLog(user.id, date);
            if (log && log.details.literasiResponse && log.details.literasiResponse.length > 0) {
                setAnswers(log.details.literasiResponse);
                setSubmitted(true);
                setVideoFinished(true);
                setVideoStarted(true);
                setIsPlayerReady(true);
            } else {
                setAnswers(new Array(mat.questions.length).fill(''));
                setSubmitted(false);
            }
            setLoading(false);
        };
        init();
    }, [user.id, date]);

    // Initialize Player when material is loaded
    useEffect(() => {
        if (!loading && material) {
            const videoId = getVideoId(material.youtubeUrl);

            if (videoId) {
                const initPlayer = () => {
                    if (playerRef.current) {
                        try { playerRef.current.destroy(); } catch(e) {}
                    }

                    playerRef.current = new window.YT.Player('youtube-player', {
                        height: '100%',
                        width: '100%',
                        videoId: videoId,
                        playerVars: {
                            'autoplay': 0, 
                            'controls': 1, 
                            'disablekb': 1,
                            'fs': 0,
                            'rel': 0,
                            'modestbranding': 1,
                            'playsinline': 1, 
                            'mute': 0,
                            'origin': window.location.origin 
                        },
                        events: {
                            'onReady': () => {
                                setIsPlayerReady(true);
                            },
                            'onStateChange': (event: any) => {
                                if (event.data === 1) { // Playing
                                    setVideoStarted(true);
                                }
                                if (event.data === 0) { // Ended
                                    setVideoFinished(true);
                                }
                            }
                        }
                    });
                };

                if (window.YT && window.YT.Player) {
                    initPlayer();
                } else {
                    window.onYouTubeIframeAPIReady = initPlayer;
                }
            }
        }
    }, [loading, material]);

    const handleManualPlay = () => {
        if(playerRef.current && playerRef.current.playVideo && isPlayerReady) {
            playerRef.current.playVideo();
            setVideoStarted(true); 
        }
    };

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
            Swal.fire('Sukses', 'Jawaban Literasi berhasil disimpan!', 'success');
        } else Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
    };

    if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;
    if (!material || !material.youtubeUrl) return <div className="p-10 text-center"><p className="text-slate-500">Belum ada materi literasi untuk tanggal {date}.</p></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] p-6 text-white mb-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-1">Literasi Ramadan</h2>
                    <p className="text-xs opacity-90">Simak video & jawab pertanyaannya</p>
                </div>
            </div>

            {/* Date Selector */}
            <div className="glass-card p-2 rounded-[24px] mb-6 flex justify-between items-center shadow-sm">
                 <div className="pl-4">
                     <p className="text-[10px] font-bold text-slate-400 uppercase">TANGGAL MATERI</p>
                 </div>
                 <input type="date" className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border-none outline-none" value={date} max={getWIBDate()} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-6">
               <div className="glass-card p-2 rounded-[24px] relative overflow-hidden">
                   {/* Video Container */}
                   <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black group">
                       <div id="youtube-player" className="w-full h-full"></div>
                       
                       {/* Overlay if not started (Manual Play Backup for Mobile) */}
                       {!videoStarted && (
                           <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer" onClick={isPlayerReady ? handleManualPlay : undefined}>
                               {isPlayerReady ? (
                                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow hover:scale-110 transition-transform">
                                        <i className="fas fa-play text-white text-3xl ml-2"></i>
                                    </div>
                               ) : (
                                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                               )}
                               <div className="absolute mt-28 font-bold text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                    {isPlayerReady ? 'Ketuk untuk Mulai' : 'Memuat Video...'}
                               </div>
                           </div>
                       )}

                       {/* Transparent Overlay to prevent clicking while playing */}
                       {videoStarted && !videoFinished && (
                           <div className="absolute inset-0 z-20 bg-transparent"></div>
                       )}
                       
                       {/* Finished Overlay */}
                       {videoFinished && !submitted && (
                           <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm pointer-events-none">
                               <div className="text-center animate-slide-up">
                                   <i className="fas fa-check-circle text-4xl mb-2 text-green-400"></i>
                                   <p className="font-bold">Video Selesai</p>
                                   <p className="text-xs">Silakan isi jawaban di bawah</p>
                               </div>
                           </div>
                       )}
                   </div>
               </div>

               <div className={`glass-card p-6 rounded-[24px] transition-all duration-500 ${!videoFinished ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                   <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                       <span>Pertanyaan Pemahaman ({date})</span>
                       {!videoFinished && <i className="fas fa-lock text-slate-400"></i>}
                   </h3>
                   
                   {/* Always Show Form (Edit Mode allowed) */}
                   <div className="space-y-4">
                       {submitted && (
                           <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                               <i className="fas fa-info-circle"></i> Kamu sudah mengirim jawaban. Silakan edit jika perlu.
                           </div>
                       )}

                       {material.questions.map((q, idx) => (
                           <div key={idx}>
                               <label className="text-xs font-bold text-slate-500 block mb-2">{idx+1}. {q}</label>
                               <textarea 
                                    disabled={!videoFinished}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-200 outline-none resize-none disabled:bg-slate-100 disabled:cursor-not-allowed" 
                                    rows={3} 
                                    value={answers[idx]} 
                                    onChange={e => { const newA = [...answers]; newA[idx] = toTitleCase(e.target.value); setAnswers(newA); }} 
                                    placeholder={videoFinished ? "Tulis jawabanmu..." : "Tonton video sampai habis dulu..."} 
                               />
                           </div>
                       ))}
                       <button 
                            onClick={handleSave} 
                            disabled={!videoFinished}
                            className={`w-full py-4 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${videoFinished ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                       >
                           {submitted ? 'Update Jawaban' : (videoFinished ? 'Kirim Jawaban' : 'Selesaikan Video Dulu')} 
                           {videoFinished && <i className="fas fa-paper-plane"></i>}
                       </button>
                   </div>
               </div>
           </div>
        </div>
    );
};

// --- Tab Materi (New) ---
export const TabMateri = () => {
    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[32px] p-6 text-white mb-6 shadow-xl">
                 <h2 className="text-xl font-bold">Materi Ramadan</h2>
                 <p className="text-xs opacity-90">Kumpulan kultum & panduan ibadah</p>
            </div>
            {/* List of articles */}
             <div className="space-y-4">
                <div className="glass-card p-5 rounded-[24px] border-l-4 border-teal-500">
                    <h3 className="font-bold text-slate-800 text-lg">Keutamaan Bulan Ramadan</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        Bulan Ramadan adalah bulan yang penuh berkah, di mana pintu-pintu surga dibuka, pintu-pintu neraka ditutup, dan setan-setan dibelenggu. Di dalamnya terdapat satu malam yang lebih baik dari seribu bulan, yaitu Lailatulqadar.
                    </p>
                </div>
                <div className="glass-card p-5 rounded-[24px] border-l-4 border-emerald-500">
                    <h3 className="font-bold text-slate-800 text-lg">Syarat Wajib Puasa</h3>
                    <ul className="text-sm text-slate-600 mt-2 list-disc list-inside leading-relaxed">
                        <li>Beragama Islam</li>
                        <li>Baligh (sudah dewasa)</li>
                        <li>Berakal sehat</li>
                        <li>Sehat jasmani dan rohani</li>
                        <li>Bukan musafir (sedang dalam perjalanan jauh)</li>
                        <li>Suci dari haid dan nifas (bagi wanita)</li>
                    </ul>
                </div>
                <div className="glass-card p-5 rounded-[24px] border-l-4 border-cyan-500">
                    <h3 className="font-bold text-slate-800 text-lg">Hal yang Membatalkan Puasa</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        Makan dan minum dengan sengaja, muntah dengan sengaja, berhubungan suami istri, keluar air mani dengan sengaja, haid atau nifas, gila (hilang akal), dan murtad (keluar dari Islam).
                    </p>
                </div>
             </div>
        </div>
    );
};

// --- Tab Profile (New) ---
export const TabProfile = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    return (
        <div className="p-6 pb-28 animate-slide-up">
             <div className="glass-card p-6 rounded-[32px] text-center mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-50 to-transparent"></div>
                 <div className="w-24 h-24 bg-white border-4 border-white shadow-xl text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-black relative z-10">
                     {user.name.charAt(0)}
                 </div>
                 <h2 className="text-xl font-black text-slate-800 relative z-10">{user.name}</h2>
                 <p className="text-sm text-slate-500 font-bold relative z-10 mb-1">{user.role === 'murid' ? `Kelas ${user.kelas || '-'}` : user.role.toUpperCase()}</p>
                 <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 relative z-10">
                    {user.username}
                 </div>
             </div>

             <div className="space-y-3">
                 <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-[24px] border border-red-100 shadow-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                     <i className="fas fa-sign-out-alt"></i> Keluar Aplikasi
                 </button>
                 <div className="text-center mt-8">
                     <p className="text-[10px] text-slate-400">Aplikasi Ramadan Digital Spansa</p>
                     <p className="text-[10px] text-slate-300">Created with ❤️ by Tim IT</p>
                 </div>
             </div>
        </div>
    );
};