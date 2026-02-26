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
                                <span className="text-[8px] font-bold uppercase opacity-80">Total Poin Kelas</span>
                            </div>
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
                                                <p className="text-[10px] text-slate-500">
                                                    {item.submitted 
                                                        ? (item.is_draft ? '📝 Draft' : '✅ Sudah Lapor') 
                                                        : '❌ Belum'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {item.submitted ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-black text-primary-600">{item.points} Poin</span>
                                                    {item.is_draft && <span className="text-[9px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">Draft</span>}
                                                </div>
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
                                    
                                    {/* Validation Dropdown */}
                                    {s.submitted && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <select 
                                                className={`text-xs font-bold p-2 rounded-lg border outline-none ${s.validation === 'Perbaiki' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'}`}
                                                value={s.validation || 'Sesuai'}
                                                onChange={async (e) => {
                                                    const val = e.target.value as 'Sesuai' | 'Perbaiki';
                                                    // Optimistic Update
                                                    const newData = {...data};
                                                    const studentIdx = newData.students.findIndex(st => st.id === s.id);
                                                    if(studentIdx !== -1) {
                                                        newData.students[studentIdx].validation = val;
                                                        setData(newData);
                                                    }
                                                    
                                                    await SupabaseService.updateLiterasiValidation(s.id, date, val);
                                                }}
                                            >
                                                <option value="Sesuai">Sesuai</option>
                                                <option value="Perbaiki">Perbaiki</option>
                                            </select>
                                        </div>
                                    )}

                                    <i className={`fas fa-chevron-down text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`}></i>
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

// --- Tab Rekap Absensi (NEW) ---
export const TabRekapAbsensi = ({ currentUser }: { currentUser?: User }) => {
    const defaultClass = (currentUser?.role === 'guru' && currentUser?.kelas) ? currentUser.kelas : '7A';
    const [kelas, setKelas] = useState(defaultClass);
    
    // Default range: Last 7 days
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(formatDate(lastWeek));
    const [endDate, setEndDate] = useState(formatDate(today));
    
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'points', direction: 'asc' | 'desc' } | null>(null);
    const [minRerata, setMinRerata] = useState(210); // Default 210

    const isWaliKelas = currentUser?.role === 'guru' && !!currentUser?.kelas;

    useEffect(() => {
        SupabaseService.getGlobalSettings().then(settings => {
            if (settings.minRerataPoin) setMinRerata(settings.minRerataPoin);
        });
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await SupabaseService.getRekapAbsensi(kelas, startDate, endDate);
        
        // Pre-calculate total points for sorting (Displayed Range)
        const processedData = res.map((s: any) => {
            let totalPoints = 0;
            const dateRange = getDatesInRange(startDate, endDate);
            dateRange.forEach(d => {
                const dStr = dateString(d);
                const log = s.logs[dStr];
                if (log) totalPoints += (log.points || 0);
            });
            return { ...s, totalPoints };
        });

        setData(processedData);
        setLoading(false);
    };

    const handleSort = (key: 'name' | 'points') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        
        if (sortConfig.key === 'name') {
            if (a.name < b.name) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a.name > b.name) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        } else if (sortConfig.key === 'points') {
            if (a.totalPoints < b.totalPoints) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a.totalPoints > b.totalPoints) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        return 0;
    });

    // Generate array of dates for table header
    const getDatesInRange = (start: string, end: string) => {
        const dates = [];
        let curr = new Date(start);
        const last = new Date(end);
        while (curr <= last) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    const dateRange = getDatesInRange(startDate, endDate);

    // Format date for header (e.g., "18 Feb")
    const formatHeaderDate = (d: Date) => {
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const dateString = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate Days for Average
    const startCalcDate = new Date('2026-02-18');
    const todayDate = new Date(getWIBDate());
    startCalcDate.setHours(0,0,0,0);
    todayDate.setHours(0,0,0,0);
    const diffTime = Math.max(0, todayDate.getTime() - startCalcDate.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const requiredDays = Math.max(0, daysCount - 1);

    const handleExport = () => {
        if (data.length === 0) {
            Swal.fire('Info', 'Tidak ada data untuk diexport', 'info');
            return;
        }

        // 1. Build Header Row
        // Format: No, Nama, L/P, [Date1 Harian], [Date1 Literasi], ..., Total Poin, Rerata Poin, Keterangan
        let csvContent = "No,Nama,L/P";
        dateRange.forEach(d => {
            const dateStr = formatHeaderDate(d);
            csvContent += `,${dateStr} (Harian),${dateStr} (Literasi)`;
        });
        csvContent += ",Total Poin,Rerata Poin,Keterangan\n";

        // 2. Build Data Rows
        data.forEach((s, idx) => {
            let row = `${idx + 1},"${s.name}",${s.gender}`;
            let totalPoints = 0;
            
            dateRange.forEach(d => {
                const dStr = dateString(d);
                const log = s.logs[dStr];
                const hasLog = !!log;
                if (hasLog) totalPoints += (log.points || 0);
                
                // Harian Status
                let harianStatus = '-';
                if (hasLog) harianStatus = log.harian ? 'v' : 'x';
                else if (dStr < todayStr) harianStatus = 'x';
                
                // Literasi Status
                let literasiStatus = '-';
                if (hasLog) literasiStatus = log.literasi ? 'v' : (log.harian ? 'x' : '-');
                else if (dStr < todayStr) literasiStatus = 'x';

                row += `,${harianStatus},${literasiStatus}`;
            });
            
            // Calculate Average based on ALL points since Feb 18
            const averageVal = (s.totalPointsAllTime || 0) / daysCount;
            const averagePoints = averageVal.toFixed(1);
            
            const isFilledEveryDay = (s.daysFilled || 0) >= requiredDays;
            const keterangan = (averageVal >= minRerata && isFilledEveryDay) ? 'L' : 'TL';

            row += `,${s.totalPoints},${averagePoints},${keterangan}`;
            csvContent += row + "\n";
        });

        // 3. Create Download Link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Rekapitulasi_Kelas_${kelas}_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[24px] p-6 text-white mb-6 shadow-xl text-center">
                <i className="fas fa-table text-4xl mb-2 opacity-80"></i>
                <h2 className="text-xl font-bold">Rekapitulasi</h2>
                <p className="text-xs opacity-90">Pantau Harian & Literasi dalam rentang waktu</p>
            </div>

            <div className="glass-card p-4 rounded-[24px] mb-6 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dari Tanggal</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sampai Tanggal</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                    </div>
                </div>
                
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kelas</label>
                        <select 
                            value={kelas} 
                            onChange={e => setKelas(e.target.value)} 
                            disabled={isWaliKelas}
                            className={`w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white ${isWaliKelas ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                        >
                            {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                        </select>
                    </div>
                    <button onClick={loadData} className="px-4 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-colors">
                        Tampilkan
                    </button>
                    <button onClick={handleExport} className="px-4 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-colors">
                        <i className="fas fa-file-excel mr-2"></i> Export
                    </button>
                </div>
            </div>

            {loading ? <div className="p-10 text-center text-slate-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Memuat data...</div> : (
                <div className="glass-card rounded-[24px] overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-700">
                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th rowSpan={2} className="px-3 py-2 font-bold border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-32 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                                        Nama {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th rowSpan={2} className="px-2 py-2 font-bold border-r border-slate-200 text-center w-10">L/P</th>
                                    {dateRange.map((d, i) => (
                                        <th key={i} colSpan={2} className="px-2 py-2 font-bold border-r border-slate-200 text-center min-w-[80px]">
                                            {formatHeaderDate(d)}
                                        </th>
                                    ))}
                                    <th rowSpan={2} className="px-2 py-2 font-bold text-center w-16 bg-yellow-50 text-yellow-700 border-l border-slate-200 cursor-pointer hover:bg-yellow-100" onClick={() => handleSort('points')}>
                                        Total Poin {sortConfig?.key === 'points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th rowSpan={2} className="px-2 py-2 font-bold text-center w-16 bg-indigo-50 text-indigo-700 border-l border-slate-200">
                                        Rerata
                                    </th>
                                    <th rowSpan={2} className="px-2 py-2 font-bold text-center w-16 bg-emerald-50 text-emerald-700 border-l border-slate-200">
                                        Ket
                                    </th>
                                </tr>
                                <tr>
                                    {dateRange.map((_d, i) => (
                                        <React.Fragment key={i}>
                                            <th className="px-1 py-1 border-r border-slate-200 text-center bg-blue-50 text-blue-600 w-10">Har</th>
                                            <th className="px-1 py-1 border-r border-slate-200 text-center bg-pink-50 text-pink-600 w-10">Lit</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedData.map((s) => {
                                    let totalPoints = 0;
                                    return (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-bold border-r border-slate-100 sticky left-0 bg-white z-10 truncate max-w-[120px]">{s.name}</td>
                                        <td className="px-2 py-2 text-center border-r border-slate-100 font-bold">{s.gender}</td>
                                        {dateRange.map((d, i) => {
                                            const dStr = dateString(d);
                                            const log = s.logs[dStr];
                                            
                                            const hasLog = !!log;
                                            const harian = log?.harian;
                                            const literasi = log?.literasi;
                                            if (hasLog) totalPoints += (log.points || 0);

                                            const isPast = dStr < todayStr;
                                            
                                            return (
                                                <React.Fragment key={i}>
                                                    <td className="px-1 py-2 text-center border-r border-slate-100">
                                                        {hasLog ? (
                                                            harian ? <i className="fas fa-check-square text-blue-500 text-sm"></i> : <i className="fas fa-times text-red-300 font-bold"></i>
                                                        ) : (isPast ? <i className="fas fa-times text-red-300 font-bold"></i> : <span className="text-slate-300">-</span>)}
                                                    </td>
                                                    <td className="px-1 py-2 text-center border-r border-slate-100">
                                                        {hasLog ? (
                                                            literasi ? <i className="fas fa-check-square text-pink-500 text-sm"></i> : <i className="fas fa-times text-red-300 font-bold"></i>
                                                        ) : (isPast ? <i className="fas fa-times text-red-300 font-bold"></i> : <span className="text-slate-300">-</span>)}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="px-2 py-2 text-center font-bold bg-yellow-50 text-yellow-700 border-l border-slate-100">
                                            {totalPoints}
                                        </td>
                                        <td className="px-2 py-2 text-center font-bold bg-indigo-50 text-indigo-700 border-l border-slate-100">
                                            {((s.totalPointsAllTime || 0) / daysCount).toFixed(1)}
                                        </td>
                                        {(() => {
                                            const averageVal = (s.totalPointsAllTime || 0) / daysCount;
                                            const isFilledEveryDay = (s.daysFilled || 0) >= requiredDays;
                                            const isLulus = averageVal >= minRerata && isFilledEveryDay;
                                            return (
                                                <td className={`px-2 py-2 text-center font-bold border-l border-slate-100 ${isLulus ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {isLulus ? 'L' : 'TL'}
                                                </td>
                                            );
                                        })()}
                                    </tr>
                                    );
                                })}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={2 + (dateRange.length * 2)} className="p-6 text-center text-slate-400">Tidak ada data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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
                    <div>
                        <label className="text-xs font-bold text-slate-500">Batas Minimal Rerata Poin (Lulus)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 rounded-xl border font-bold text-emerald-600" 
                            value={globalSettings.minRerataPoin || 210} 
                            onChange={e => setGlobalSettings({...globalSettings, minRerataPoin: parseInt(e.target.value) || 0})} 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Siswa dengan rerata poin di atas nilai ini akan mendapatkan status "L" (Lulus).</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Status di Bawah Batas Minimal</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border text-red-600 font-bold" 
                            value={globalSettings.statusBelowMin || ''} 
                            placeholder="Contoh: BELUM MEMENUHI SYARAT..."
                            onChange={e => setGlobalSettings({...globalSettings, statusBelowMin: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Status di Atas Batas Minimal</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border text-emerald-600 font-bold" 
                            value={globalSettings.statusAboveMin || ''} 
                            placeholder="Contoh: MENERIMA KARTU PESERTA"
                            onChange={e => setGlobalSettings({...globalSettings, statusAboveMin: e.target.value})} 
                        />
                    </div>
                    <button onClick={saveGlobal} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md">Simpan Pengaturan</button>
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
