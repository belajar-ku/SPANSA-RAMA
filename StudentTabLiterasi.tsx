import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, DailyLog, DailyLogDetails, getWIBDate } from './types';
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
    const [currentConfigs, setCurrentConfigs] = useState<{ youtubeUrl: string, questions: string[] }[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Video State - Array of booleans for multiple videos
    const [videosFinished, setVideosFinished] = useState<boolean[]>([]);
    const [videosStarted, setVideosStarted] = useState<boolean[]>([]);
    const [playersReady, setPlayersReady] = useState<boolean[]>([]);
    const playerRefs = useRef<any[]>([]);

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
            try {
                setLoading(true);
                setVideosFinished([]); 
                setVideosStarted([]);
                setPlayersReady([]);
                playerRefs.current = [];

                const mat = await SupabaseService.getLiterasiMaterial(date);
                
                // Determine Level Config
                let level = '7';
                if (user.kelas) {
                    if (user.kelas.startsWith('7')) level = '7';
                    else if (user.kelas.startsWith('8')) level = '8';
                    else if (user.kelas.startsWith('9')) level = '9';
                }

                let configs = [{ youtubeUrl: mat.youtubeUrl || '', questions: mat.questions || [] }];
                if (mat.levels && mat.levels[level]) {
                    configs = mat.levels[level];
                }
                setCurrentConfigs(configs);
                
                // Initialize video states
                setVideosFinished(new Array(configs.length).fill(false));
                setVideosStarted(new Array(configs.length).fill(false));
                setPlayersReady(new Array(configs.length).fill(false));

                const log = await SupabaseService.getDailyLog(user.id, date);
                
                // Calculate total questions
                const totalQuestions = configs.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
                let initialAnswers = new Array(totalQuestions).fill('');

                if (log && log.details.literasiResponse && log.details.literasiResponse.length > 0) {
                    // Merge existing answers
                    log.details.literasiResponse.forEach((ans, idx) => {
                        if (idx < totalQuestions) initialAnswers[idx] = ans;
                    });

                    // If validation is 'Perbaiki', allow resubmission
                    if (log.details.literasiValidation === 'Perbaiki') {
                        setAnswers(initialAnswers);
                        setSubmitted(false); // Allow editing
                        setVideosFinished(new Array(configs.length).fill(true)); // Allow skipping video if already watched
                        setVideosStarted(new Array(configs.length).fill(true));
                        setPlayersReady(new Array(configs.length).fill(true));
                        Swal.fire({
                            icon: 'warning',
                            title: 'Perbaiki Jawaban',
                            text: 'Guru meminta Anda memperbaiki jawaban literasi ini.',
                        });
                    } else {
                        setAnswers(initialAnswers);
                        setSubmitted(true);
                        setVideosFinished(new Array(configs.length).fill(true));
                        setVideosStarted(new Array(configs.length).fill(true));
                        setPlayersReady(new Array(configs.length).fill(true));
                    }
                } else {
                    setAnswers(initialAnswers);
                    setSubmitted(false);
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to load literasi:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Memuat',
                    text: 'Terjadi kesalahan koneksi. Silakan refresh.',
                    confirmButtonText: 'Refresh'
                }).then(() => window.location.reload());
            }
        };
        init();
    }, [user.id, date, user.kelas]);

    // Initialize Players when material is loaded
    useEffect(() => {
        if (!loading && currentConfigs.length > 0) {
            
            const initPlayer = (index: number, videoId: string) => {
                if (playerRefs.current[index]) {
                    try { playerRefs.current[index].destroy(); } catch(e) {}
                }

                playerRefs.current[index] = new window.YT.Player(`youtube-player-${index}`, {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        'autoplay': 0, // DISABLE AUTOPLAY initially to avoid multiple videos playing
                        'controls': 0, // HIDE CONTROLS
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
                            setPlayersReady(prev => {
                                const newReady = [...prev];
                                newReady[index] = true;
                                return newReady;
                            });
                        },
                        'onStateChange': (event: any) => {
                            if (event.data === 1) { // Playing
                                setVideosStarted(prev => {
                                    const newStarted = [...prev];
                                    newStarted[index] = true;
                                    return newStarted;
                                });
                            }
                            if (event.data === 0) { // Ended
                                setVideosFinished(prev => {
                                    const newFinished = [...prev];
                                    newFinished[index] = true;
                                    return newFinished;
                                });
                            }
                        }
                    }
                });
            };

            const onAPIReady = () => {
                currentConfigs.forEach((config, idx) => {
                    const videoId = getVideoId(config.youtubeUrl);
                    if (videoId) {
                        initPlayer(idx, videoId);
                    }
                });
            };

            if (window.YT && window.YT.Player) {
                onAPIReady();
            } else {
                window.onYouTubeIframeAPIReady = onAPIReady;
            }
        }
    }, [loading, currentConfigs]);

    const handleManualPlay = (index: number) => {
        if(playerRefs.current[index] && playerRefs.current[index].playVideo && playersReady[index]) {
            playerRefs.current[index].playVideo();
            if(playerRefs.current[index].unMute) playerRefs.current[index].unMute();
            setVideosStarted(prev => {
                const newStarted = [...prev];
                newStarted[index] = true;
                return newStarted;
            });
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
                const cleanText = response.text.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanText);
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

        // Flatten all questions for validation
        const allQuestions = currentConfigs.flatMap(c => c.questions || []);
        const validation = await validateAnswersWithAI(allQuestions, answers);

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
        
        // Clone details to avoid reference issues
        let details = log?.details ? { ...log.details } : {};
        
        // Explicitly preserve existing journal fields if they exist
        if (log?.details) {
            details.puasaStatus = log.details.puasaStatus;
            details.alasanTidakPuasa = log.details.alasanTidakPuasa;
            details.isHaid = log.details.isHaid;
            details.sahurStatus = log.details.sahurStatus;
            details.sahurLokasi = log.details.sahurLokasi;
            details.sahurWaktu = log.details.sahurWaktu;
            details.bukaStatus = log.details.bukaStatus;
            details.sholatStatus = log.details.sholatStatus;
            details.sunahStatus = log.details.sunahStatus;
            details.tadarusStatus = log.details.tadarusStatus;
            details.tadarusNote = log.details.tadarusNote;
            details.sedekahDiri = log.details.sedekahDiri;
            details.sedekahRumah = log.details.sedekahRumah;
            details.sedekahMasyarakat = log.details.sedekahMasyarakat;
            details.belajarMapel = log.details.belajarMapel;
            details.belajarTopik = log.details.belajarTopik;
            details.is_draft = log.details.is_draft;
        }

        details.literasiResponse = answers;
        
        // RESET VALIDATION STATUS ON NEW SUBMISSION
        delete details.literasiValidation; 

        const payload: DailyLog = {
            user_id: user.id, 
            date: date,
            // Preserve existing puasa_type if available, otherwise default
            puasa_type: log?.puasa_type || 'tidak', 
            total_points: log?.total_points || 0, // Preserve existing points initially, will be recalculated by saveDailyLog
            details: details as DailyLogDetails
        };

        // Important: Pass ID if exists to ensure UPDATE works
        if (log?.id) {
            payload.id = log.id;
        }

        const success = await SupabaseService.saveDailyLog(payload);
        if(success) {
            setSubmitted(true);
            Swal.fire('Sukses', 'Jawaban Literasi berhasil disimpan!', 'success');
        } else Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
    };

    if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;
    if (!currentConfigs || currentConfigs.length === 0) return <div className="p-10 text-center"><p className="text-slate-500">Belum ada materi literasi untuk tanggal {date}.</p></div>;

    // Helper to calculate global index for answers array
    let questionCounter = 0;

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
                 <input 
                    type="date" 
                    className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border-none outline-none" 
                    value={date} 
                    min="2026-02-18"
                    max={getWIBDate()} 
                    onChange={(e) => {
                        if (e.target.value < '2026-02-18') {
                            Swal.fire('Info', 'Pengisian literasi dimulai tanggal 18 Februari 2026', 'info');
                            return;
                        }
                        setDate(e.target.value);
                    }} 
                 />
            </div>

            <div className="space-y-8">
                {currentConfigs.map((config, vIdx) => {
                    const isFinished = videosFinished[vIdx];
                    const isStarted = videosStarted[vIdx];
                    const isReady = playersReady[vIdx];
                    
                    return (
                        <div key={vIdx} className="space-y-6">
                            <div className="glass-card p-2 rounded-[24px] relative overflow-hidden">
                                <div className="px-4 py-2 text-sm font-bold text-slate-600">Video {vIdx + 1}</div>
                                {/* Video Container */}
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black group">
                                    <div id={`youtube-player-${vIdx}`} className="w-full h-full pointer-events-none"></div> 
                                    
                                    {/* Overlay for Initial Play */}
                                    {!isStarted && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer" onClick={isReady ? () => handleManualPlay(vIdx) : undefined}>
                                            {isReady ? (
                                                 <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow hover:scale-110 transition-transform">
                                                     <i className="fas fa-play text-white text-3xl ml-2"></i>
                                                 </div>
                                            ) : (
                                                 <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <div className="absolute mt-28 font-bold text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                                 {isReady ? 'KETUK UNTUK MEMULAI' : 'Memuat Video...'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Transparent Overlay */}
                                    {isStarted && !isFinished && (
                                        <div className="absolute inset-0 z-20 bg-transparent"></div>
                                    )}
                                    
                                    {/* Finished Overlay */}
                                    {isFinished && !submitted && (
                                        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm pointer-events-none">
                                            <div className="text-center animate-slide-up">
                                                <i className="fas fa-check-circle text-4xl mb-2 text-green-400"></i>
                                                <p className="font-bold">Video Selesai</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`glass-card p-6 rounded-[24px] transition-all duration-500 ${!isFinished ? 'opacity-50 grayscale pointer-events-none select-none' : 'opacity-100'}`}>
                                <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                                    <span>Pertanyaan Video {vIdx + 1}</span>
                                    {!isFinished && <div className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full"><i className="fas fa-lock mr-1"></i> Terkunci</div>}
                                </h3>
                                
                                <div className="space-y-4 relative">
                                    {!isFinished && <div className="absolute inset-0 z-50 bg-white/10 backdrop-blur-[2px] rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs"><i className="fas fa-play-circle mr-2"></i> Tonton video sampai selesai untuk membuka.</div>}

                                    {config.questions?.map((q, qIdx) => {
                                        const currentAnswerIndex = questionCounter++;
                                        return (
                                            <div key={qIdx}>
                                                <label className="text-xs font-bold text-slate-500 block mb-2">{qIdx+1}. {q}</label>
                                                <textarea 
                                                     disabled={!isFinished}
                                                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-200 outline-none resize-none disabled:bg-slate-100 disabled:cursor-not-allowed" 
                                                     rows={3} 
                                                     value={answers[currentAnswerIndex] || ''} 
                                                     onChange={e => { const newA = [...answers]; newA[currentAnswerIndex] = toTitleCase(e.target.value); setAnswers(newA); }} 
                                                     placeholder={isFinished ? "Tulis jawabanmu..." : "Tonton video sampai habis dulu..."} 
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button 
                     onClick={handleSave} 
                     disabled={!videosFinished.every(v => v)}
                     className={`w-full py-4 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${videosFinished.every(v => v) ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    {submitted ? 'Update Jawaban' : (videosFinished.every(v => v) ? 'Kirim Semua Jawaban' : 'Selesaikan Semua Video Dulu')} 
                    {videosFinished.every(v => v) && <i className="fas fa-paper-plane"></i>}
                </button>
            </div>
        </div>
    );
};