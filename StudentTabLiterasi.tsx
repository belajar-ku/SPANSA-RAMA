import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, LiterasiMaterial, DailyLog, DailyLogDetails, getWIBDate } from './types';
import { toTitleCase } from './App';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const getVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

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
                // If validation is 'Perbaiki', allow resubmission
                if (log.details.literasiValidation === 'Perbaiki') {
                    setAnswers(log.details.literasiResponse);
                    setSubmitted(false); // Allow editing
                    setVideoFinished(true); // Allow skipping video if already watched
                    setVideoStarted(true);
                    setIsPlayerReady(true);
                    Swal.fire({
                        icon: 'warning',
                        title: 'Perbaiki Jawaban',
                        text: 'Guru meminta Anda memperbaiki jawaban literasi ini.',
                    });
                } else {
                    setAnswers(log.details.literasiResponse);
                    setSubmitted(true);
                    setVideoFinished(true);
                    setVideoStarted(true);
                    setIsPlayerReady(true);
                }
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
                            'autoplay': 1, // ENABLE AUTOPLAY
                            'controls': 0, // HIDE CONTROLS
                            'disablekb': 1, 
                            'fs': 0, 
                            'rel': 0,
                            'modestbranding': 1,
                            'playsinline': 1, 
                            'mute': 0, // UNMUTED (Sound ON)
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
            // Optional: Unmute if manual play is clicked (user interaction allows sound)
            if(playerRef.current.unMute) playerRef.current.unMute();
            setVideoStarted(true); 
        }
    };

    const validateAnswersWithAI = async (questions: string[], answers: string[]) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn("Gemini API Key missing, skipping validation.");
                return { valid: true };
            }

            const ai = new GoogleGenAI({ apiKey });
            
            const pairs = questions.map((q, i) => ({ q, a: answers[i] }));
            
            const prompt = `
            Bertindaklah sebagai guru yang tegas. Periksa jawaban siswa berikut untuk tugas literasi.
            
            Kriteria GAGAL (valid: false):
            1. Jawaban asal-asalan (contoh: ".....", "aaaaa", "wkwkwk", "gatau", "tidak tahu").
            2. Jawaban terlalu pendek yang tidak menjawab soal (contoh: "ya", "tidak" padahal pertanyaan butuh penjelasan).
            3. Jawaban tidak nyambung sama sekali dengan pertanyaan.
            4. Jawaban copy-paste dari pertanyaan.
            5. Jawaban yang hanya mengulang satu kata berulang kali.

            Data:
            ${JSON.stringify(pairs)}

            Output JSON only: { "valid": boolean, "reason": "Pesan error untuk siswa jika false (Singkat, Padat, Jelas, Bahasa Indonesia)" }
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            if (response.text) {
                return JSON.parse(response.text);
            }
            return { valid: true };

        } catch (error) {
            console.error("AI Validation Error:", error);
            return { valid: true }; // Allow submission if AI fails
        }
    };

    const handleSave = async () => {
        if (answers.some(a => !a.trim())) {
            return Swal.fire('Belum Lengkap', 'Jawab semua pertanyaan ya.', 'warning');
        }

        // AI Validation Step
        Swal.fire({ 
            title: 'Memvalidasi Jawaban...', 
            text: 'Mohon tunggu, AI sedang mengecek kualitas jawabanmu...', 
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading() 
        });

        const validation = await validateAnswersWithAI(material?.questions || [], answers);

        if (!validation.valid) {
            return Swal.fire({
                icon: 'error',
                title: 'Jawaban Ditolak',
                text: validation.reason || 'Jawabanmu terdeteksi asal-asalan. Mohon perbaiki dengan sungguh-sungguh.',
                confirmButtonText: 'Perbaiki'
            });
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
                       <div id="youtube-player" className="w-full h-full pointer-events-none"></div> {/* POINTER EVENTS NONE ON IFRAME */}
                       
                       {/* Overlay for Initial Play (Fallback if Autoplay Blocked) */}
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
                                    {isPlayerReady ? 'KETUK UNTUK MEMULAI' : 'Memuat Video...'}
                               </div>
                           </div>
                       )}

                       {/* Transparent Overlay to Prevent All Interaction after start */}
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
                   <div className="px-2 py-1 text-[10px] text-slate-400 text-center italic">Video akan otomatis diputar. Jika tidak, ketuk tombol play di atas.</div>
               </div>

               <div className={`glass-card p-6 rounded-[24px] transition-all duration-500 ${!videoFinished ? 'opacity-50 grayscale pointer-events-none select-none' : 'opacity-100'}`}>
                   <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                       <span>Pertanyaan Pemahaman ({date})</span>
                       {!videoFinished && <div className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full"><i className="fas fa-lock mr-1"></i> Terkunci</div>}
                   </h3>
                   
                   <div className="space-y-4 relative">
                       {!videoFinished && <div className="absolute inset-0 z-50 bg-white/10 backdrop-blur-[2px] rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs"><i className="fas fa-play-circle mr-2"></i> Tonton video sampai selesai untuk membuka.</div>}

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