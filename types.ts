
export type Tab = 'harian' | 'literasi' | 'materi' | 'leaderboard' | 'profile' | 'monitoring' | 'users' | 'data';
export type UserRole = 'murid' | 'guru' | 'admin';
export type Gender = 'L' | 'P';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  kelas?: string | null; 
  gender?: Gender | null;
  username?: string;
  password?: string;
}

export interface LiterasiConfig {
    youtubeUrl: string;
    questions: string[];
}

// Interface baru untuk Literasi per Tanggal
export interface LiterasiMaterial {
    id?: string;
    date: string;
    youtubeUrl: string;
    questions: string[];
}

export interface GlobalSettings {
    startRamadhanV1: string;
    startRamadhanV2: string;
    idulFitri: string;
}

export interface RamadanTarget {
    startDate: string;
    targetPuasa: string;
    targetTarawih: string;
    targetTadarus: string;
    targetKarakter: string;
}

export interface DailyLogDetails {
    puasaStatus?: 'Penuh' | 'Setengah' | 'Tidak';
    alasanTidakPuasa?: string;
    isHaid?: boolean;
    sahurStatus?: string;
    sahurLokasi?: string;
    sahurWaktu?: string;
    bukaStatus?: string;
    sholatStatus?: Record<string, string>;
    sunahStatus?: Record<string, string>;
    sedekahDiri?: string;
    sedekahRumah?: string;
    sedekahMasyarakat?: string;
    belajarMapel?: string;
    belajarTopik?: string;
    literasiResponse?: string[];
}

export interface DailyLog {
    id?: string;
    user_id: string;
    date: string;
    puasa_type: 'penuh' | 'setengah' | 'tidak'; // Summary field
    total_points: number; // Summary field
    details: DailyLogDetails; // Complex data
}

export const CLASSES = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];
export const APP_LOGO_URL = "https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0";

export const RAMADAN_QUOTES = [
    "Puasa itu menahan diri, bukan sekadar memindahkan jam makan.",
    "Sahur adalah berkah, jangan lewatkan meski seteguk air.",
    "Jujur saat sendiri adalah bukti puasa yang sesungguhnya.",
    "Kurangi gawai, perbanyak baca Al-Qur'an.",
    "Berbakti kepada orang tua adalah kunci surga terdekat.",
    "Senyummu kepada saudaramu adalah sedekah.",
    "Sabar adalah separuh dari iman, puasa melatihnya.",
    "Jangan biarkan puasamu hanya mendapat lapar dan dahaga.",
    "Sedekah tidak akan mengurangi hartamu.",
    "Salat adalah tiang agama, jangan robohkan.",
    "Malam Lailatulqadar lebih baik dari seribu bulan.",
    "Jaga lisan, karena puasa bukan hanya menahan makan.",
    "Berbukalah dengan yang halal, bukan sekadar yang manis.",
    "Doa orang berpuasa tidak akan tertolak hingga ia berbuka.",
    "Al-Qur'an adalah petunjuk, bacalah dan pahami.",
    "Maafkan kesalahan teman, bersihkan hati di bulan suci.",
    "Tidur orang berpuasa adalah ibadah (jika tidak lalai).",
    "Perbanyak istigfar, mohon ampunan-Nya.",
    "Dunia hanya sementara, akhirat selamanya.",
    "Kejar rida Allah, bukan pujian manusia.",
    "Salat tarawih menghapus dosa yang telah lalu.",
    "Zakat fitrah menyucikan jiwa yang fitri.",
    "Jangan marah, katakan 'Aku sedang berpuasa'.",
    "Syukurilah nikmat berbuka, sekecil apa pun itu.",
    "Membaca Al-Qur'an menenangkan hati yang gelisah.",
    "Kebaikan sekecil apa pun akan dibalas berlipat ganda.",
    "Tetap istikamah meski Ramadan akan pergi.",
    "Rindu Ramadan adalah tanda iman di hati.",
    "Siapkan diri menyambut kemenangan yang fitri.",
    "Taqabbalallahu minna wa minkum, semoga amal diterima."
];