import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, UserRole, Gender, CLASSES, LiterasiConfig, GlobalSettings } from './types';

// --- Tab Monitoring (Guru) ---
export const TabMonitoring = () => {
    const [kelas, setKelas] = useState('7A');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const res = await SupabaseService.getMonitoringData(kelas, date);
        setData(res);
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
            <div className="glass-card p-4 rounded-[24px] mb-6 flex flex-col gap-3">
                <div className="flex gap-2">
                    <select value={kelas} onChange={e => setKelas(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white">
                        {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                </div>
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
                                {data.map(item => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold ${item.submitted ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">{item.name}</p>
                                                <p className="text-[10px] text-slate-500">{item.submitted ? '✅ Sudah Lapor' : '❌ Belum'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.submitted && <span className="text-xs font-bold text-primary-600">{item.points} Poin</span>}
                                        </div>
                                    </div>
                                ))}
                                {data.length === 0 && <div className="p-8 text-center text-slate-400">Tidak ada siswa.</div>}
                        </div>
                    )}
                </div>
            </div>
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
`1234567890,Spansa@1,Ahmad Siswa,murid,7A,L
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

            <input className="w-full p-3 rounded-[20px] border border-slate-200 mb-4 focus:ring-2 focus:ring-primary-200 outline-none" placeholder="Cari nama siswa/guru..." value={search} onChange={e => setSearch(e.target.value)} />
            
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
    const [literasiConfig, setLiterasiConfig] = useState<LiterasiConfig>({ youtubeUrl: '', questions: [] });
    
    useEffect(() => {
        SupabaseService.getGlobalSettings().then(setGlobalSettings);
        SupabaseService.getLiterasiConfig().then(setLiterasiConfig);
    }, []);

    const saveGlobal = async () => {
        await SupabaseService.saveGlobalSettings(globalSettings);
        Swal.fire('Sukses', 'Pengaturan Global disimpan', 'success');
    };

    const saveLiterasi = async () => {
        await SupabaseService.saveLiterasiConfig(literasiConfig);
        Swal.fire('Sukses', 'Konfigurasi Literasi disimpan', 'success');
    };

    const addQuestion = () => setLiterasiConfig({...literasiConfig, questions: [...literasiConfig.questions, '']});
    const updateQuestion = (i: number, val: string) => {
        const newQ = [...literasiConfig.questions];
        newQ[i] = val;
        setLiterasiConfig({...literasiConfig, questions: newQ});
    };
    const removeQuestion = (i: number) => {
        const newQ = literasiConfig.questions.filter((_, idx) => idx !== i);
        setLiterasiConfig({...literasiConfig, questions: newQ});
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

            {/* Literasi Config */}
            <div className="glass-card p-6 rounded-[24px]">
                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                    <i className="fas fa-video text-red-500"></i> Konfigurasi Literasi
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Link YouTube</label>
                        <input type="text" className="w-full p-3 rounded-xl border" placeholder="https://youtube.com/watch?v=..." value={literasiConfig.youtubeUrl} onChange={e => setLiterasiConfig({...literasiConfig, youtubeUrl: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Daftar Pertanyaan</label>
                        {literasiConfig.questions.map((q, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <input className="flex-1 p-2 rounded-lg border text-sm" value={q} onChange={e => updateQuestion(i, e.target.value)} placeholder={`Pertanyaan ${i+1}`} />
                                <button onClick={() => removeQuestion(i)} className="w-10 bg-red-100 text-red-500 rounded-lg"><i className="fas fa-trash"></i></button>
                            </div>
                        ))}
                        <button onClick={addQuestion} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs border border-dashed border-slate-300">+ Tambah Pertanyaan</button>
                    </div>
                    <button onClick={saveLiterasi} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-md">Simpan Literasi</button>
                </div>
            </div>
        </div>
    );
};