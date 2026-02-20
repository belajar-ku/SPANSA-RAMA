import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, DailyLog, DailyLogDetails, RAMADAN_QUOTES, getWIBDate } from './types';
import { toTitleCase } from './App';

const SURAH_LIST = [
  { name: "Al-Fatihah", count: 7 }, { name: "Al-Baqarah", count: 286 }, { name: "Ali 'Imran", count: 200 },
  { name: "An-Nisa'", count: 176 }, { name: "Al-Ma'idah", count: 120 }, { name: "Al-An'am", count: 165 },
  { name: "Al-A'raf", count: 206 }, { name: "Al-Anfal", count: 75 }, { name: "At-Taubah", count: 129 },
  { name: "Yunus", count: 109 }, { name: "Hud", count: 123 }, { name: "Yusuf", count: 111 },
  { name: "Ar-Ra'd", count: 43 }, { name: "Ibrahim", count: 52 }, { name: "Al-Hijr", count: 99 },
  { name: "An-Nahl", count: 128 }, { name: "Al-Isra'", count: 111 }, { name: "Al-Kahf", count: 110 },
  { name: "Maryam", count: 98 }, { name: "Ta-Ha", count: 135 }, { name: "Al-Anbiya'", count: 112 },
  { name: "Al-Hajj", count: 78 }, { name: "Al-Mu'minun", count: 118 }, { name: "An-Nur", count: 64 },
  { name: "Al-Furqan", count: 77 }, { name: "Asy-Syu'ara'", count: 227 }, { name: "An-Naml", count: 93 },
  { name: "Al-Qasas", count: 88 }, { name: "Al-'Ankabut", count: 69 }, { name: "Ar-Rum", count: 60 },
  { name: "Luqman", count: 34 }, { name: "As-Sajdah", count: 30 }, { name: "Al-Ahzab", count: 73 },
  { name: "Saba'", count: 54 }, { name: "Fatir", count: 45 }, { name: "Ya-Sin", count: 83 },
  { name: "As-Saffat", count: 182 }, { name: "Sad", count: 88 }, { name: "Az-Zumar", count: 75 },
  { name: "Ghafir", count: 85 }, { name: "Fussilat", count: 54 }, { name: "Asy-Syura", count: 53 },
  { name: "Az-Zukhruf", count: 89 }, { name: "Ad-Dukhan", count: 59 }, { name: "Al-Jasiyah", count: 37 },
  { name: "Al-Ahqaf", count: 35 }, { name: "Muhammad", count: 38 }, { name: "Al-Fath", count: 29 },
  { name: "Al-Hujurat", count: 18 }, { name: "Qaf", count: 45 }, { name: "Az-Zariyat", count: 60 },
  { name: "At-Tur", count: 49 }, { name: "An-Najm", count: 62 }, { name: "Al-Qamar", count: 55 },
  { name: "Ar-Rahman", count: 78 }, { name: "Al-Waqi'ah", count: 96 }, { name: "Al-Hadid", count: 29 },
  { name: "Al-Mujadilah", count: 22 }, { name: "Al-Hasyr", count: 24 }, { name: "Al-Mumtahanah", count: 13 },
  { name: "As-Saff", count: 14 }, { name: "Al-Jumu'ah", count: 11 }, { name: "Al-Munafiqun", count: 11 },
  { name: "At-Tagabun", count: 18 }, { name: "At-Talaq", count: 12 }, { name: "At-Tahrim", count: 12 },
  { name: "Al-Mulk", count: 30 }, { name: "Al-Qalam", count: 52 }, { name: "Al-Haqqah", count: 52 },
  { name: "Al-Ma'arij", count: 44 }, { name: "Nuh", count: 28 }, { name: "Al-Jinn", count: 28 },
  { name: "Al-Muzzammil", count: 20 }, { name: "Al-Muddassir", count: 56 }, { name: "Al-Qiyamah", count: 40 },
  { name: "Al-Insan", count: 31 }, { name: "Al-Mursalat", count: 50 }, { name: "An-Naba'", count: 40 },
  { name: "An-Nazi'at", count: 46 }, { name: "'Abasa", count: 42 }, { name: "At-Takwir", count: 29 },
  { name: "Al-Infitar", count: 19 }, { name: "Al-Mutaffifin", count: 36 }, { name: "Al-Insyiqaq", count: 25 },
  { name: "Al-Buruj", count: 22 }, { name: "At-Tariq", count: 17 }, { name: "Al-A'la", count: 19 },
  { name: "Al-Ghasyiyah", count: 26 }, { name: "Al-Fajar", count: 30 }, { name: "Al-Balad", count: 20 },
  { name: "Asy-Syams", count: 15 }, { name: "Al-Lail", count: 21 }, { name: "Ad-Duha", count: 11 },
  { name: "Al-Insyirah", count: 8 }, { name: "At-Tin", count: 8 }, { name: "Al-'Alaq", count: 19 },
  { name: "Al-Qadr", count: 5 }, { name: "Al-Bayyinah", count: 8 }, { name: "Az-Zalzalah", count: 8 },
  { name: "Al-'Adiyat", count: 11 }, { name: "Al-Qari'ah", count: 11 }, { name: "At-Takasur", count: 8 },
  { name: "Al-'Asr", count: 3 }, { name: "Al-Humazah", count: 9 }, { name: "Al-Fil", count: 5 },
  { name: "Quraisy", count: 4 }, { name: "Al-Ma'un", count: 7 }, { name: "Al-Kausar", count: 3 },
  { name: "Al-Kafirun", count: 6 }, { name: "An-Nasr", count: 3 }, { name: "Al-Lahab", count: 5 },
  { name: "Al-Ikhlas", count: 4 }, { name: "Al-Falaq", count: 5 }, { name: "An-Nas", count: 6 }
];

export const TabHarian = ({ user, initialDate }: { user: User, initialDate?: string }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false); 
  const [selectedDate, setSelectedDate] = useState(initialDate || getWIBDate());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [targetStartDate, setTargetStartDate] = useState('');
  const [classRank, setClassRank] = useState<any>(null);
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

  // Calculate Max Ayat based on selected surah
  const currentSurahData = SURAH_LIST.find(s => s.name === tadarusSurah);
  const maxAyat = currentSurahData ? currentSurahData.count : 286;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeString = () => {
      return currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
  };

  const isTimePassed = (targetTimeStr: string, addMinutes = 0) => {
      if (!targetTimeStr) return true;
      const todayStr = getWIBDate();
      if (selectedDate < todayStr) return true;
      if (selectedDate > todayStr) return false;
      const now = new Date();
      const [hours, minutes] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes + addMinutes, 0, 0);
      return now >= target;
  };

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

  useEffect(() => {
     setLoading(true);
     setSubmitted(false);
     setIsDraft(false);
     
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

     if (user.kelas) {
         SupabaseService.getClassLeaderboard().then(leaderboard => {
            const myRankIndex = leaderboard.findIndex((l: any) => l.id === user.kelas);
            if (myRankIndex !== -1) {
                setClassRank({ ...leaderboard[myRankIndex], rank: myRankIndex + 1, totalClasses: leaderboard.length });
            }
         });
     }

     SupabaseService.getDailyLog(user.id, selectedDate).then(data => {
         if (data) {
             setSubmitted(true);
             const d = data.details;
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
                 if(d.tadarusNote) {
                     const parts = d.tadarusNote.split(': Ayat ');
                     if(parts.length === 2) {
                         setTadarusSurah(parts[0]);
                         const verseParts = parts[1].split('-');
                         if(verseParts.length >= 1) setTadarusAyatStart(verseParts[0]);
                         if(verseParts.length >= 2) setTadarusAyatEnd(verseParts[1]);
                     } else {
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
  }, [user.id, selectedDate, user.kelas]);

  const quoteIndex = (currentDay - 1) % RAMADAN_QUOTES.length;
  const currentQuote = RAMADAN_QUOTES[quoteIndex >= 0 ? quoteIndex : 0];

  const handleAction = async (draftAction: boolean) => {
    const isMenstruasi = puasaStatus === 'Tidak' && alasanTidakPuasa === 'Menstruasi';
    let finalTadarusNote = '';
    if(tadarusStatus === 'Ya' && !isMenstruasi) {
        if(tadarusSurah) {
            finalTadarusNote = `${tadarusSurah}`;
            if(tadarusAyatStart) finalTadarusNote += `: Ayat ${tadarusAyatStart}`;
            if(tadarusAyatEnd) finalTadarusNote += `-${tadarusAyatEnd}`;
        }
    }

    // FETCH LATEST LOG TO PRESERVE LITERASI
    const existingLog = await SupabaseService.getDailyLog(user.id, selectedDate);
    const existingDetails = existingLog?.details || {};

    const details: DailyLogDetails = {
          ...existingDetails, // Preserve existing details (like literasiResponse)
          puasaStatus: puasaStatus as any, 
          alasanTidakPuasa, isHaid,
          sahurStatus: isMenstruasi ? '' : sahurStatus, 
          sahurLokasi: isMenstruasi ? '' : sahurLokasi, 
          sahurWaktu: isMenstruasi ? '' : sahurWaktu, 
          bukaStatus: isMenstruasi ? '' : bukaStatus,
          sholatStatus: isMenstruasi ? {} : sholatStatus, 
          sunahStatus: isMenstruasi ? {} : sunahStatus,
          tadarusStatus: isMenstruasi ? '' : tadarusStatus, 
          tadarusNote: isMenstruasi ? '' : finalTadarusNote,
          sedekahDiri, sedekahRumah, sedekahMasyarakat,
          belajarMapel, belajarTopik,
          is_draft: draftAction,
          // Explicitly preserve literasi fields just in case spread didn't work as expected (though it should)
          literasiResponse: existingDetails.literasiResponse || [],
          literasiValidation: existingDetails.literasiValidation
    };

    const payload: DailyLog = {
        user_id: user.id,
        date: selectedDate,
        puasa_type: puasaStatus === 'Penuh' ? 'penuh' : 'tidak',
        total_points: 0,
        details: details
    };
    
    if (existingLog?.id) {
        payload.id = existingLog.id;
    }
    
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

  const isPreRamadan = targetStartDate && selectedDate < targetStartDate;
  const isMenstruasi = puasaStatus === 'Tidak' && alasanTidakPuasa === 'Menstruasi';
  const currentHour = currentTime.getHours();
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
           
           <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg ${isDraft ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
               <i className={`fas ${isDraft ? 'fa-edit' : 'fa-check'}`}></i>
           </div>
           
           <h3 className="text-2xl font-black text-slate-800">{isDraft ? 'Draft Tersimpan Sementara' : 'Laporan Terkirim'}</h3>
           <p className="text-slate-500 text-sm mt-2">Data tanggal <strong>{selectedDate}</strong> {isDraft ? 'belum dikirim final.' : 'sudah tersimpan.'}</p>
           {isDraft && (
               <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 max-w-xs text-center">
                   <i className="fas fa-info-circle mr-1"></i> Anda Harus Mengakses lagi pada Pukul 20.00 WIB untuk Mengirim Jawaban
               </div>
           )}
           
           <button onClick={() => setSubmitted(false)} className="mt-8 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm shadow-md hover:bg-slate-50">
               {isDraft ? 'Edit Laporan Ini' : 'Edit Laporan Ini'}
           </button>
        </div>
     );
  }

  return (
    <div className="p-6 pb-28 animate-slide-up">
       {/* Widget Jam & Tanggal - MOVED UP */}
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
            {isPreRamadan && <div className="bg-blue-50 text-blue-600 text-[10px] font-bold text-center py-1 rounded-b-[20px]"><i className="fas fa-info-circle mr-1"></i> Pra-Ramadan (Latihan)</div>}
            {!isPreRamadan && selectedDate !== getWIBDate() && <div className="bg-orange-50 text-orange-600 text-[10px] font-bold text-center py-1 rounded-b-[20px]"><i className="fas fa-history mr-1"></i> Anda mengisi laporan lampau</div>}
       </div>

       {/* Widget Header Spirit Gen-Z - MOVED DOWN */}
       <div className="glass-card bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[32px] p-6 text-white mb-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 opacity-80">
                <i className="fas fa-bolt text-yellow-300"></i>
                <span className="text-xs font-bold tracking-widest uppercase">Spirit Gen-Z • Hari ke-{currentDay}</span>
             </div>
             <p className="text-lg font-bold leading-relaxed">"{currentQuote}"</p>
          </div>
       </div>

       {classRank && (
            <div className="glass-card bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[24px] p-6 text-white mb-6 shadow-xl relative overflow-hidden animate-slide-up">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">KELAS {user.kelas}</p>
                        <h2 className="text-3xl font-black mb-1">Peringkat {classRank.rank}</h2>
                        <p className="text-xs opacity-90 font-bold">Dari {classRank.totalClasses} Kelas</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center border border-white/30">
                            <span className="block text-2xl font-black">{classRank.points}</span>
                            <span className="text-[8px] font-bold uppercase opacity-80">Total Poin</span>
                        </div>
                    </div>
                </div>
            </div>
       )}

       <div className="space-y-5">
          {user.gender === 'P' && (
             <div className="glass-card p-1.5 rounded-[28px]">
                <div className="bg-gradient-to-r from-pink-50 to-white rounded-[24px] p-5 border border-white flex items-center justify-between">
                   <div><h3 className="text-pink-600 font-bold text-sm"><i className="fas fa-venus mr-1"></i> Mode Haid (Shortcut)</h3></div>
                   <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={isHaid} onChange={(e) => setIsHaid(e.target.checked)} />
                </div>
             </div>
          )}
          
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

          <div className={`glass-card p-1.5 rounded-[28px] ${isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div className="bg-gradient-to-br from-amber-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-medal text-amber-500"></i> Bonus Pahala</h3>
                 <div className="grid grid-cols-1 gap-3 mb-4">
                     {Object.keys(sunahStatus).map(s => {
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

          <div className={`glass-card p-1.5 rounded-[28px] ${isMenstruasi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
             <div className="bg-gradient-to-br from-teal-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-book-quran text-teal-500"></i> Misi Tadarus</h3>
                 <div className="space-y-3">
                     <select disabled={isMenstruasi} className="w-full p-3 bg-white border border-teal-100 rounded-xl text-sm font-bold text-slate-700 outline-none" value={tadarusStatus} onChange={(e) => setTadarusStatus(e.target.value)}>
                         <option value="" disabled hidden>----</option>
                         <option value="Ya">✅ Ya, Membaca Al-Qur'an</option>
                         <option value="Tidak">❌ Tidak / Berhalangan</option>
                     </select>
                     {tadarusStatus === 'Ya' && (
                         <div className="animate-slide-up space-y-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
                             <label className="text-[10px] font-bold text-teal-600 uppercase block">Nama Surah</label>
                             <select className="w-full p-2.5 bg-white border border-teal-200 rounded-lg text-sm font-bold text-slate-700 outline-none" value={tadarusSurah} onChange={(e) => { setTadarusSurah(e.target.value); setTadarusAyatStart('1'); setTadarusAyatEnd(''); }}>
                                 <option value="" disabled hidden>-- Pilih Surah --</option>
                                 {SURAH_LIST.map((s, idx) => (
                                     <option key={idx} value={s.name}>{idx + 1}. {s.name}</option>
                                 ))}
                             </select>
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                 <div>
                                     <label className="text-[10px] font-bold text-teal-600 uppercase block mb-1">Dari Ayat</label>
                                     <input 
                                        type="number" 
                                        min="1" 
                                        max={maxAyat}
                                        className="w-full p-2 bg-white border border-teal-200 rounded-lg text-sm font-bold outline-none placeholder:text-teal-200" 
                                        placeholder="1" 
                                        value={tadarusAyatStart} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value);
                                            if (val < 1) val = 1;
                                            if (val > maxAyat) val = maxAyat;
                                            setTadarusAyatStart(isNaN(val) ? '' : val.toString());
                                        }} 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-bold text-teal-600 uppercase block mb-1">Sampai Ayat</label>
                                     <div className="relative">
                                         <input 
                                            type="number" 
                                            min="1" 
                                            max={maxAyat}
                                            className="w-full p-2 bg-white border border-teal-200 rounded-lg text-sm font-bold outline-none placeholder:text-teal-200" 
                                            placeholder={maxAyat.toString()} 
                                            value={tadarusAyatEnd} 
                                            onChange={(e) => {
                                                let val = parseInt(e.target.value);
                                                if (val > maxAyat) val = maxAyat;
                                                setTadarusAyatEnd(isNaN(val) ? '' : val.toString());
                                            }} 
                                         />
                                         {tadarusSurah && <span className="absolute right-2 top-2.5 text-[10px] text-teal-400 font-bold">/ {maxAyat}</span>}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
          </div>

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