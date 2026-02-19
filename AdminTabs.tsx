import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, UserRole, Gender, CLASSES, LiterasiMaterial, GlobalSettings, getWIBDate } from './types';

// --- Tab Monitoring (Guru) ---
export const TabMonitoring = ({ currentUser }: { currentUser?: User }) => {
    const defaultClass = (currentUser?.role === 'guru' && currentUser?.kelas) ? currentUser.kelas : '7A';
    const [kelas, setKelas] = useState(defaultClass);
    const [date, setDate] = useState(getWIBDate());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Class Rank State for Wali Kelas
    const [classRank, setClassRank] = useState<any>(null);

    // If Wali Kelas, user cannot change class
    const isWaliKelas = currentUser?.role === 'guru' && !!currentUser?.kelas;

    const loadData = async () => {
        setLoading(true);
        // Load Students
        const res = await SupabaseService.getMonitoringData(kelas, date);
        setData(res);
        
        // Load Class Rank if Wali Kelas
        if (isWaliKelas) {
            const leaderboard = await SupabaseService.getClassLeaderboard();
            const myRankIndex = leaderboard.findIndex((l: any) => l.id === kelas);
            if (myRankIndex !== -1) {
                setClassRank({ ...leaderboard[myRankIndex], rank: myRankIndex + 1, totalClasses: leaderboard.length });
            }
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [kelas, date]);

    const stats = {
        total: data.length,
        submitted: data.filter(d => d.submitted).length,
    };
    const percentage = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;

    return (
        <div className="p-6 pb-28 animate-slide-up">
            {/* WIDGET WALI KELAS: KLASEMEN KELAS */}
            {isWaliKelas && classRank && (
                <div className="glass-card bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[24px] p-6 text-white mb-6 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">PERFORMA KELAS {kelas}</p>
                            <h2 className="text-3xl font-black mb-1">Peringkat {classRank.rank}</h2>
                            <p className="text-xs opacity-90 font-bold">Dari {classRank.totalClasses} Kelas</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center border border-white/30">
                                <span className="block text-2xl font-black">{classRank.points}</span>
                                <span className="text-[8px] font-bold uppercase opacity-80">Rata-rata</span>
                            </div>
                        </div>
                    </div>
                    {/* Stats Bar */}
                    <div className="mt-4 flex gap-4 text-xs font-bold opacity-90 border-t border-white/20 pt-3">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-users"></i> Partisipasi: {classRank.details?.participation}%
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-star"></i> Poin Aktif: {classRank.details?.avgActive}
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card p-4 rounded-[24px] mb-6 flex flex-col gap-3">
                <div className="flex gap-2">
                    <select 
                        value={kelas} 
                        onChange={e => setKelas(e.target.value)} 
                        disabled={isWaliKelas}
                        className={`flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white ${isWaliKelas ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                    >
                        {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                </div>
                {isWaliKelas && !classRank && <p className="text-[10px] text-primary-600 font-bold text-center"><i className="fas fa-lock mr-1"></i> Anda adalah Wali Kelas {kelas}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass-card p-4 rounded-3xl text-center">
                    <span className="text-3xl font-black text-slate-800">{stats.submitted}<span className="text-sm text-slate-400 font-normal">/{stats.total}</span></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mt-1">Murid Lapor</span>
                </div>
                <div className="glass-card p-4 rounded-3xl text-center">
                    <span className="text-3xl font-black text-primary-600">{percentage}%</span>
                    <span className="text-[10px] font-bold text-primary-600/70 uppercase block mt-1">Partisipasi</span>
                </div>
            </div>

            <div className="glass-card rounded-[24px] overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto">
                    {loading ? <div className="p-10 text-center">Memuat data...</div> : (
                        <div className="divide-y divide-slate-100">
                                {data.map((item, idx) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${idx < 3 && item.points > 0 ? 'bg-amber-400 shadow-md' : (item.submitted ? 'bg-green-500' : 'bg-slate-300')}`}>
                                                {idx < 3 && item.points > 0 ? <i className="fas fa-crown text-[10px]"></i> : item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700 line-clamp-1">{item.name}</p>
                                                <p className="text-[10px] text-slate-500">{item.submitted ? '✅ Sudah Lapor' : '❌ Belum'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {item.submitted ? (
                                                <span className="text-xs font-black text-primary-600">{item.points} Poin</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300">-</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {data.length === 0 && <div className="p-8 text-center text-slate-400">Tidak ada murid.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Tab Koreksi Literasi (NEW) ---
export const TabKoreksiLiterasi = ({ currentUser }: { currentUser?: User }) => {
    const defaultClass = (currentUser?.role === 'guru' && currentUser?.kelas) ? currentUser.kelas : '7A';
    const [kelas, setKelas] = useState(defaultClass);
    const [date, setDate] = useState(getWIBDate());
    const [data, setData] = useState<{students: any[], questions: string[]}>({ students: [], questions: [] });
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const isWaliKelas = currentUser?.role === 'guru' && !!currentUser?.kelas;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await SupabaseService.getLiterasiRecap(kelas, date);
            setData(res);
            setLoading(false);
        };
        load();
    }, [kelas, date]);

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-pink-500 to-rose-600 rounded-[24px] p-6 text-white mb-6 shadow-xl text-center">
                <i className="fas fa-clipboard-check text-4xl mb-2 opacity-80"></i>
                <h2 className="text-xl font-bold">Koreksi Literasi</h2>
                <p className="text-xs opacity-90">Cek pemahaman siswa</p>
            </div>

            <div className="glass-card p-4 rounded-[24px] mb-6 flex flex-col gap-3">
                <div className="flex gap-2">
                    <select 
                        value={kelas} 
                        onChange={e => setKelas(e.target.value)} 
                        disabled={isWaliKelas}
                        className={`flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white ${isWaliKelas ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                    >
                        {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                </div>
            </div>

            {loading ? <div className="p-10 text-center text-slate-500"><i className="fas fa-circle-notch fa-spin"></i> Memuat...</div> : (
                <div className="space-y-3">
                    {data.questions.length === 0 && (
                        <div className="p-6 text-center text-slate-400 glass-card rounded-[24px]">Belum ada soal literasi pada tanggal ini.</div>
                    )}
                    
                    {data.questions.length > 0 && data.students.map(s => {
                        const isOpen = expandedId === s.id;
                        return (
                            <div key={s.id} className="glass-card rounded-[20px] overflow-hidden transition-all duration-300 border border-slate-100">
                                <button 
                                    onClick={() => setExpandedId(isOpen ? null : s.id)}
                                    className={`w-full p-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-slate-50' : 'hover:bg-white/60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${s.submitted ? 'bg-green-500' : 'bg-slate-300'}`}>
                                            {s.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-slate-700">{s.name}</p>
                                            <p className="text-[10px] text-slate-400">{s.submitted ? 'Sudah Mengerjakan' : 'Belum Mengerjakan'}</p>
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-down text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                </button>

                                {isOpen && s.submitted && (
                                    <div className="p-4 bg-white/50 border-t border-slate-100 animate-slide-up">
                                        {data.questions.map((q, idx) => (
                                            <div key={idx} className="mb-4 last:mb-0">
                                                <p className="text-[10px] font-bold text-slate-400 mb-1">SOAL {idx + 1}: {q}</p>
                                                <div className="p-3 bg-white border border-slate-100 rounded-xl text-sm text-slate-700 leading-relaxed shadow-sm">
                                                    {s.answers[idx] || <span className="text-red-300 italic">Tidak dijawab</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isOpen && !s.submitted && (
                                    <div className="p-4 text-center text-xs text-red-400 italic bg-red-50 border-t border-red-100">
                                        Siswa belum mengirimkan jawaban.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {data.students.length === 0 && <div className="text-center text-slate-400 p-6">Tidak ada siswa.</div>}
                </div>
            )}
        </div>
    );
};

// --- Tab Admin Users ---
export const TabAdminUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({ role: 'murid', gender: 'L', kelas: '7A', password: 'Spansa@1' });
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadUsers = async () => {
        const data = await SupabaseService.getUsers();
        setUsers(data);
    };

    useEffect(() => { loadUsers(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Show loading
        Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
        
        const res = await SupabaseService.saveUser(formData as User);
        
        if (res.success) {
            setIsEditing(false);
            setFormData({ role: 'murid', gender: 'L', kelas: '7A', password: 'Spansa@1' });
            loadUsers();
            Swal.fire('Sukses', 'User tersimpan!', 'success');
        } else {
            Swal.fire('Gagal', res.error || 'Terjadi kesalahan sistem', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm('Hapus user ini?')) return;
        await SupabaseService.deleteUser(id);
        loadUsers();
    };

    // --- CSV UPLOAD FEATURE ---
    const handleDownloadTemplate = () => {
        const headers = "username,password,name,role,kelas,gender";
        const example = 
`1234567890,Spansa@1,Ahmad Murid,murid,7A,L
000123456,Spansa@1,Bapak Guru (Wali Kelas 7A),guru,7A,L
000987654,Spansa@1,Ibu Guru (Bukan Wali),guru,,P`;
        
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_user_spansa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            let text = evt.target?.result as string;
            if (!text) return;

            // 1. Remove BOM (Byte Order Mark) usually added by Excel
            if (text.charCodeAt(0) === 0xFEFF) {
                text = text.slice(1);
            }

            // 2. Split lines
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            
            if (lines.length < 2) {
                Swal.fire('Error', 'File CSV kosong atau format salah.', 'error');
                return;
            }

            // 3. Detect Delimiter
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';

            // 4. Parse Headers (Robust cleaning)
            const headers = firstLine.split(delimiter).map(h => 
                h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/\s+/g, '') // remove spaces
            );
            
            // Map common header names to User interface keys
            const headerMap: Record<string, keyof User> = {
                'username': 'username', 'nisn': 'username', 'nis': 'username',
                'password': 'password', 'pass': 'password',
                'name': 'name', 'nama': 'name', 'namalengkap': 'name',
                'role': 'role', 'jabatan': 'role',
                'kelas': 'kelas', 'class': 'kelas',
                'gender': 'gender', 'jk': 'gender', 'jeniskelamin': 'gender'
            };

            const newUsers: Partial<User>[] = [];
            
            // 5. Parse Rows
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
                
                // Skip invalid lines
                if (values.length < 2) continue;

                const userObj: any = {};
                
                headers.forEach((rawHeader, index) => {
                    const key = headerMap[rawHeader] || rawHeader;
                    let val: string | null = values[index];
                    
                    // Handle missing columns in row
                    if (val === undefined) val = null;
                    else if (val === '') val = null;

                    userObj[key] = val;
                });
                
                // Validate Mandatory Fields
                if (!userObj.username || !userObj.name) {
                     continue; 
                }

                // Normalize Data
                // Role
                const r = userObj.role ? userObj.role.toLowerCase() : 'murid';
                userObj.role = ['admin','guru','murid'].includes(r) ? r : 'murid';
                
                // Gender
                const g = userObj.gender ? userObj.gender.toUpperCase().charAt(0) : 'L';
                userObj.gender = ['L','P'].includes(g) ? g : 'L';

                // Kelas (ensure null if empty)
                if (!userObj.kelas || userObj.kelas === '-') userObj.kelas = null;

                newUsers.push(userObj as User);
            }

            if (newUsers.length > 0) {
                Swal.fire({
                    title: 'Memproses Data...',
                    text: `Mengupload ${newUsers.length} user...`,
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                const res = await SupabaseService.bulkCreateUsers(newUsers);
                if (res.success) {
                    Swal.fire('Berhasil', `${newUsers.length} user berhasil ditambahkan!`, 'success');
                    loadUsers();
                } else {
                    console.error(res.error);
                    Swal.fire({
                        title: 'Gagal',
                        text: res.error || 'Terjadi kesalahan saat upload.',
                        icon: 'error',
                        footer: 'Cek konsol browser untuk detail.'
                    });
                }
            } else {
                Swal.fire('Info', 'Tidak ada data valid yang ditemukan. Pastikan header CSV: username, name, role, kelas, gender', 'info');
            }
            
            // Reset input
            if(fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <button onClick={() => setIsEditing(!isEditing)} className="w-full py-3 bg-primary-600 text-white font-bold rounded-[20px] mb-4 shadow-lg">
                {isEditing ? 'Tutup Form' : '+ Tambah User Baru'}
            </button>
            
            {isEditing && (
                <form onSubmit={handleSave} className="glass-card p-4 rounded-[24px] mb-4 space-y-3 border-2 border-primary-100">
                    <input className="w-full p-3 rounded-xl border" placeholder="Username (NISN)" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input className="w-full p-3 rounded-xl border" placeholder="Password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <input className="w-full p-3 rounded-xl border" placeholder="Nama Lengkap" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <div className="flex gap-2">
                         <select className="flex-1 p-3 rounded-xl border" value={formData.role || 'murid'} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                             <option value="murid">Murid</option>
                             <option value="guru">Guru</option>
                             <option value="admin">Admin</option>
                         </select>
                         <select className="flex-1 p-3 rounded-xl border" value={formData.gender || 'L'} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                             <option value="L">L</option>
                             <option value="P">P</option>
                         </select>
                    </div>
                    {formData.role === 'murid' && (
                        <select className="w-full p-3 rounded-xl border" value={formData.kelas || ''} onChange={e => setFormData({...formData, kelas: e.target.value})}>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    {/* Input Wali Kelas untuk Guru */}
                    {formData.role === 'guru' && (
                        <div>
                             <label className="text-xs font-bold text-slate-500 ml-2">Wali Kelas (Opsional)</label>
                             <select className="w-full p-3 rounded-xl border bg-orange-50 text-orange-800" value={formData.kelas || ''} onChange={e => setFormData({...formData, kelas: e.target.value})}>
                                <option value="">- Bukan Wali Kelas -</option>
                                {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                            </select>
                        </div>
                    )}
                    <button className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-md">Simpan Data</button>
                </form>
            )}

            {/* Upload Section */}
            <div className="glass-card rounded-[24px] p-6 mb-6 text-center border-dashed border-2 border-primary-300 bg-primary-50/30">
                <i className="fas fa-file-csv text-4xl text-green-600 mb-2"></i>
                <h3 className="font-bold text-slate-700">Upload Data Massal</h3>
                <p className="text-xs text-slate-500 mb-4">Support file .csv dengan pemisah koma (,) atau titik koma (;)</p>
                
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <div className="flex gap-2 justify-center">
                    <button type="button" onClick={handleDownloadTemplate} className="px-4 py-2 bg-white text-slate-600 font-bold rounded-full text-xs shadow-sm border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                        <i className="fas fa-download"></i> Download Template
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-primary-600 text-white font-bold rounded-full text-xs shadow-md hover:bg-primary-500 flex items-center gap-2">
                        <i className="fas fa-upload"></i> Pilih File CSV
                    </button>
                </div>
            </div>

            <input className="w-full p-3 rounded-[20px] border border-slate-200 mb-4 focus:ring-2 focus:ring-primary-200 outline-none" placeholder="Cari nama murid/guru..." value={search} onChange={e => setSearch(e.target.value)} />
            
            <div className="glass-card rounded-[24px] overflow-hidden max-h-[50vh] overflow-y-auto">
                {filtered.map(u => (
                    <div key={u.id} className="p-4 border-b border-white/50 flex justify-between items-center hover:bg-white/40">
                        <div>
                            <div className="font-bold text-sm text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                {u.role} 
                                {u.role === 'guru' && u.kelas ? ` • Wali Kelas ${u.kelas}` : (u.kelas ? ` • ${u.kelas}` : '')}
                                {` • ${u.username}`}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => { setFormData(u); setIsEditing(true); }} className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Tab Admin Data (Settings) ---
export const TabAdminData = () => {
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ startRamadhanV1: '', startRamadhanV2: '', idulFitri: '' });
    
    // State for Literasi Material
    const [selectedDate, setSelectedDate] = useState(getWIBDate());
    const [literasiMaterial, setLiterasiMaterial] = useState<LiterasiMaterial>({ date: '', youtubeUrl: '', questions: [] });
    const [loadingLiterasi, setLoadingLiterasi] = useState(false);

    useEffect(() => {
        SupabaseService.getGlobalSettings().then(setGlobalSettings);
    }, []);

    // Effect to fetch Literasi Material when Date Changes
    useEffect(() => {
        const fetchMat = async () => {
            setLoadingLiterasi(true);
            const mat = await SupabaseService.getLiterasiMaterial(selectedDate);
            setLiterasiMaterial(mat);
            setLoadingLiterasi(false);
        };
        fetchMat();
    }, [selectedDate]);

    const saveGlobal = async () => {
        await SupabaseService.saveGlobalSettings(globalSettings);
        Swal.fire('Sukses', 'Pengaturan Global disimpan', 'success');
    };

    const saveLiterasi = async () => {
        await SupabaseService.saveLiterasiMaterial(literasiMaterial);
        Swal.fire('Sukses', `Materi literasi tanggal ${selectedDate} disimpan`, 'success');
    };

    const addQuestion = () => setLiterasiMaterial({...literasiMaterial, questions: [...literasiMaterial.questions, '']});
    const updateQuestion = (i: number, val: string) => {
        const newQ = [...literasiMaterial.questions];
        newQ[i] = val;
        setLiterasiMaterial({...literasiMaterial, questions: newQ});
    };
    const removeQuestion = (i: number) => {
        const newQ = literasiMaterial.questions.filter((_, idx) => idx !== i);
        setLiterasiMaterial({...literasiMaterial, questions: newQ});
    };

    return (
        <div className="p-6 pb-28 animate-slide-up space-y-8">
            {/* Global Settings */}
            <div className="glass-card p-6 rounded-[24px]">
                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-primary-500"></i> Pengaturan Tanggal
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Awal Ramadan (Pemerintah/NU)</label>
                        <input type="date" className="w-full p-3 rounded-xl border" value={globalSettings.startRamadhanV1} onChange={e => setGlobalSettings({...globalSettings, startRamadhanV1: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Awal Ramadan (Muhammadiyah)</label>
                        <input type="date" className="w-full p-3 rounded-xl border" value={globalSettings.startRamadhanV2} onChange={e => setGlobalSettings({...globalSettings, startRamadhanV2: e.target.value})} />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Idul Fitri</label>
                        <input type="date" className="w-full p-3 rounded-xl border" value={globalSettings.idulFitri} onChange={e => setGlobalSettings({...globalSettings, idulFitri: e.target.value})} />
                    </div>
                    <button onClick={saveGlobal} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md">Simpan Tanggal</button>
                </div>
            </div>

            {/* Literasi Config (BY DATE) */}
            <div className="glass-card p-6 rounded-[24px]">
                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                    <i className="fas fa-video text-red-500"></i> Konfigurasi Literasi
                </h3>
                <div className="space-y-4">
                    {/* Date Selector */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                         <label className="text-xs font-bold text-red-800 uppercase block mb-1">Pilih Tanggal Materi</label>
                         <input type="date" className="w-full p-3 rounded-xl border border-red-200 font-bold text-red-900" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                    </div>

                    {loadingLiterasi ? (
                        <div className="text-center py-4 text-slate-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Memuat materi...</div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Link YouTube / Kode Embed</label>
                                <input type="text" className="w-full p-3 rounded-xl border" placeholder="Link YouTube atau <iframe..." value={literasiMaterial.youtubeUrl} onChange={e => setLiterasiMaterial({...literasiMaterial, youtubeUrl: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">Daftar Pertanyaan</label>
                                {literasiMaterial.questions.map((q, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input className="flex-1 p-2 rounded-lg border text-sm" value={q} onChange={e => updateQuestion(i, e.target.value)} placeholder={`Pertanyaan ${i+1}`} />
                                        <button onClick={() => removeQuestion(i)} className="w-10 bg-red-100 text-red-500 rounded-lg"><i className="fas fa-trash"></i></button>
                                    </div>
                                ))}
                                <button onClick={addQuestion} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs border border-dashed border-slate-300">+ Tambah Pertanyaan</button>
                            </div>
                            <button onClick={saveLiterasi} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-md">Simpan Literasi ({selectedDate})</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
