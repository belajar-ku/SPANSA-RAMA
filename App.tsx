import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { LoginPage } from './LoginPage';
import { User, Tab, APP_LOGO_URL, RamadanTarget, getWIBDate } from './types';
import { TabHarian, TabLiterasi, TabMateri, TabProfile, TabLeaderboard, TabProgress } from './StudentTabs';
import { TabAdminUsers, TabAdminData, TabMonitoring, TabKoreksiLiterasi } from './AdminTabs';

// --- Helper: Title Case (EYD) ---
export const toTitleCase = (str: string) => {
    const smallWords = /^(dan|di|ke|dari|pada|dalam|yaitu|kepada|daripada|untuk|bagi|ala|bak|tentang|mengenai|sebab|secara|terhadap|yang|atau|tetapi|melainkan|padahal|sedangkan|jika|jikalau|apabila|kalau|maka|sehingga|karena|agar|supaya|bila|bahwa)$/i;
    return str.replace(/[A-Za-z0-9\u00C0-\u00FF]+/g, (word, index) => {
        if (index > 0 && smallWords.test(word)) {
            return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
};

// --- Header Component ---
const Header = ({ user, activeTab }: { user: User, activeTab: string }) => (
    <div className="glass-nav sticky top-0 z-40 px-6 py-4 flex justify-between items-center transition-all duration-300 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/50 border border-white shadow-lg p-1.5 flex items-center justify-center backdrop-blur-sm">
             <img src={APP_LOGO_URL} className="w-full h-full object-contain drop-shadow-md" alt="Logo" />
        </div>
        <div>
           <p className="text-[10px] font-extrabold text-primary-600 uppercase tracking-widest leading-none mb-1">SPANSA RAMA</p>
           <h1 className="text-lg font-bold text-slate-800 leading-none tracking-tight capitalize">{activeTab}</h1>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-primary-50 border border-white shadow-md flex items-center justify-center text-primary-700 font-bold text-sm">
        {user.name.charAt(0)}
      </div>
    </div>
  );

// --- Target Modal ---
const TargetModal = ({ user, onClose, initialData }: { user: User, onClose: () => void, initialData: RamadanTarget | null }) => {
    // Cek apakah data sudah terisi lengkap untuk menentukan mode awal (View/Edit)
    const hasData = initialData && initialData.targetPuasa && initialData.targetTarawih;
    
    const [mode, setMode] = useState<'view' | 'edit'>(hasData ? 'view' : 'edit');
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState<RamadanTarget>({ 
        startDate: initialData?.startDate || '', 
        targetPuasa: initialData?.targetPuasa || '', 
        targetTarawih: initialData?.targetTarawih || '', 
        targetTadarus: initialData?.targetTadarus || '', 
        targetKarakter: initialData?.targetKarakter || '' 
    });
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        SupabaseService.getGlobalSettings().then(setSettings);
    }, []);

    const handleSave = async () => {
        await SupabaseService.saveRamadanTarget(user.id, formData);
        setMode('view'); 
    };

    // Validasi: Semua field harus diisi string panjang > 3
    const isValid = formData.targetPuasa.length > 3 && 
                    formData.targetTarawih.length > 3 && 
                    formData.targetTadarus.length > 3 && 
                    formData.targetKarakter.length > 3;

    return (
        // z-[100] agar di atas navbar. Modal diperlebar (max-w-md) dan h-auto agar tidak scroll
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-slide-up overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl relative flex flex-col h-auto my-auto">
                
                {/* Tombol Tutup Pojok Kanan Atas */}
                <button onClick={onClose} className="absolute top-4 right-5 text-slate-400 hover:text-slate-600 z-10">
                    <i className="fas fa-times text-xl"></i>
                </button>

                <div className="flex-1">
                    {/* --- VIEW MODE (Tampilan Data) --- */}
                    {mode === 'view' && (
                        <div className="animate-slide-up pt-2">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl shadow-inner">
                                    <i className="fas fa-bullseye"></i>
                                </div>
                                <h3 className="text-lg font-black text-slate-800">Target Ramadan-ku</h3>
                                <p className="text-xs text-slate-500 font-bold">Bismillah, aku pasti bisa!</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Awal Puasa</p>
                                    <p className="text-sm font-bold text-slate-800">{formData.startDate || '-'}</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1"><i className="fas fa-check-circle mr-1"></i> Target Puasa</p>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">{formData.targetPuasa}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1"><i className="fas fa-mosque mr-1"></i> Target Tarawih</p>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">{formData.targetTarawih}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1"><i className="fas fa-book-open mr-1"></i> Target Tadarus</p>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">{formData.targetTadarus}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                                    <p className="text-[10px] font-bold text-purple-600 uppercase mb-1"><i className="fas fa-heart mr-1"></i> Target Karakter</p>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">{formData.targetKarakter}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                 <button onClick={() => { setStep(1); setMode('edit'); }} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50">
                                     <i className="fas fa-edit mr-1"></i> Ubah
                                 </button>
                                 <button onClick={onClose} className="flex-1 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-primary-700">
                                     Tutup
                                 </button>
                            </div>
                        </div>
                    )}

                    {/* --- EDIT MODE --- */}
                    {mode === 'edit' && (
                        <>
                            {step === 1 && (
                                <div className="animate-slide-up pt-4">
                                    <h3 className="text-xl font-black text-center mb-6">Mulai Puasa</h3>
                                    <div className="space-y-4 mb-8">
                                        {settings.startRamadhanV1 && (
                                            <button onClick={() => setFormData({...formData, startDate: settings.startRamadhanV1})} className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${formData.startDate === settings.startRamadhanV1 ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'}`}>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Pilihan 1</p>
                                                <p className="font-black text-base">{settings.startRamadhanV1}</p>
                                            </button>
                                        )}
                                        {settings.startRamadhanV2 && (
                                            <button onClick={() => setFormData({...formData, startDate: settings.startRamadhanV2})} className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${formData.startDate === settings.startRamadhanV2 ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'}`}>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Pilihan 2</p>
                                                <p className="font-black text-base">{settings.startRamadhanV2}</p>
                                            </button>
                                        )}
                                        <div className="text-center text-xs text-slate-400 font-bold py-1">- atau manual -</div>
                                        <input type="date" className="w-full p-4 bg-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-200" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                    </div>
                                    <button onClick={() => { if(formData.startDate) setStep(2); else Swal.fire('Pilih Tanggal', '', 'warning'); }} className="w-full py-4 bg-primary-600 text-white font-bold text-base rounded-2xl shadow-lg">Lanjut <i className="fas fa-arrow-right ml-2"></i></button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-slide-up pt-2">
                                    <h3 className="text-lg font-black text-center mb-1 text-slate-800">Isi Targetmu</h3>
                                    <p className="text-xs text-slate-500 text-center mb-6">Harus diisi dengan niat yang kuat ya!</p>
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Target Puasa</label>
                                            <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-200 transition" 
                                                placeholder="Contoh: Saya Akan Berpuasa Dengan Jujur" 
                                                value={formData.targetPuasa} onChange={e => setFormData({...formData, targetPuasa: toTitleCase(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Target Tarawih</label>
                                            <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-200 transition" 
                                                placeholder="Contoh: Saya Akan Tarawih Di Masjid Setiap Hari" 
                                                value={formData.targetTarawih} onChange={e => setFormData({...formData, targetTarawih: toTitleCase(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Target Tadarus</label>
                                            <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-200 transition" 
                                                placeholder="Contoh: Saya Akan Berusaha Khatam 30 Juz" 
                                                value={formData.targetTadarus} onChange={e => setFormData({...formData, targetTadarus: toTitleCase(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Target Karakter</label>
                                            <textarea rows={2} className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-200 transition resize-none leading-snug" 
                                                placeholder="Contoh: Saya Akan Lebih Bertanggung Jawab" 
                                                value={formData.targetKarakter} onChange={e => setFormData({...formData, targetKarakter: toTitleCase(e.target.value)})} />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSave} 
                                        disabled={!isValid}
                                        className={`w-full py-4 font-bold text-base rounded-2xl shadow-lg transition-all ${isValid ? 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {isValid ? 'SIMPAN TARGET' : 'Lengkapi Dulu Ya'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('harian');
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetData, setTargetData] = useState<RamadanTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState(getWIBDate());

  // Function to load target and show modal
  const checkTargetAndShow = async (userId: string) => {
      const t = await SupabaseService.getRamadanTarget(userId);
      setTargetData(t);
      // Always show modal on login/load so they can see/edit
      setShowTargetModal(true); 
  };

  useEffect(() => {
    const u = SupabaseService.getUser();
    if (u) {
        setUser(u);
        if (u.role === 'admin' || u.role === 'guru') setActiveTab('monitoring');
        else if (u.role === 'murid') {
            setActiveTab('harian');
            checkTargetAndShow(u.id);
        }
    }
    setLoading(false);
  }, []);

  // --- SECURITY ENFORCEMENT FOR MURID ---
  useEffect(() => {
    if (user && user.role === 'murid') {
        // 1. Disable Context Menu (Right Click)
        const blockContextMenu = (e: Event) => e.preventDefault();

        // 2. Disable Copy/Cut/Paste Events
        const blockClipboard = (e: ClipboardEvent) => {
            e.preventDefault();
            Swal.fire({
                icon: 'warning',
                title: 'Fitur Dibatasi',
                text: 'Fitur Copy-Paste dimatikan untuk menjaga integritas pengisian.',
                timer: 2000,
                showConfirmButton: false
            });
        };

        // 3. Disable Shortcuts (Ctrl+C, Ctrl+V, etc)
        const blockKeys = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && ['c','v','x','p','a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };

        // Add Listeners
        document.addEventListener('contextmenu', blockContextMenu);
        document.addEventListener('copy', blockClipboard);
        document.addEventListener('paste', blockClipboard);
        document.addEventListener('cut', blockClipboard);
        document.addEventListener('keydown', blockKeys);

        // Add CSS for User Select None to Body
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        // Disable touch callout on iOS (magnifier)
        document.body.style.setProperty('-webkit-touch-callout', 'none');

        return () => {
            // Cleanup on Logout/Unmount
            document.removeEventListener('contextmenu', blockContextMenu);
            document.removeEventListener('copy', blockClipboard);
            document.removeEventListener('paste', blockClipboard);
            document.removeEventListener('cut', blockClipboard);
            document.removeEventListener('keydown', blockKeys);
            
            document.body.style.userSelect = 'auto';
            document.body.style.webkitUserSelect = 'auto';
            document.body.style.removeProperty('-webkit-touch-callout');
        };
    }
  }, [user]);

  const handleLogin = (u: User) => {
      setUser(u);
      if (u.role === 'admin' || u.role === 'guru') setActiveTab('monitoring');
      else {
          setActiveTab('harian');
          checkTargetAndShow(u.id);
      }
  };

  const handleLogout = () => {
      SupabaseService.logout();
      setUser(null);
  };

  const handleEditLog = (date: string, type: 'harian' | 'literasi') => {
      setSelectedDateForEdit(date);
      setActiveTab(type);
  };

  if (loading) return null;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  // Aesthetic Nav Button
  const TabBtn = ({ id, icon }: { id: Tab, icon: string }) => {
      const isActive = activeTab === id;
      return (
          <button 
            onClick={() => {
                setActiveTab(id);
                if(id === 'harian') setSelectedDateForEdit(getWIBDate());
                // Reset to current date for literasi if clicked directly from nav
                if(id === 'literasi') setSelectedDateForEdit(getWIBDate());
            }} 
            className={`nav-item flex flex-col items-center justify-center w-full h-full ${isActive ? 'active' : ''}`}
          >
              <div className="nav-icon-container relative">
                   <i className={`fas ${icon} text-xl ${isActive ? 'text-primary-500' : 'text-slate-400'}`}></i>
              </div>
          </button>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
        <Header user={user} activeTab={activeTab} />
        {showTargetModal && <TargetModal user={user} onClose={() => setShowTargetModal(false)} initialData={targetData} />}

        <main className="max-w-md mx-auto relative z-10">
            {activeTab === 'harian' && <TabHarian user={user} initialDate={selectedDateForEdit} />}
            {activeTab === 'literasi' && <TabLiterasi user={user} initialDate={selectedDateForEdit} />}
            {activeTab === 'progress' && <TabProgress user={user} onEdit={handleEditLog} />}
            {activeTab === 'leaderboard' && <TabLeaderboard user={user} />}
            {activeTab === 'materi' && <TabMateri />}
            {activeTab === 'profile' && <TabProfile user={user} onLogout={handleLogout} />}
            
            {/* ADMIN / GURU TABS */}
            {(user.role === 'admin' || user.role === 'guru') && (
                <>
                    {activeTab === 'monitoring' && <TabMonitoring currentUser={user} />}
                    {/* Guru only sees users/data if admin allows, but per request we hide it for Guru */}
                    {activeTab === 'users' && user.role === 'admin' && <TabAdminUsers />}
                    {activeTab === 'data' && user.role === 'admin' && <TabAdminData />}
                    {activeTab === 'koreksi' && <TabKoreksiLiterasi currentUser={user} />}
                </>
            )}
        </main>

        {/* NEW FLOATING DOCK NAVIGATION */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 nav-dock rounded-[24px] z-50 px-2">
             <div className="flex justify-between items-center h-full w-full">
                 {user.role === 'murid' ? (
                    <>
                        <TabBtn id="harian" icon="fa-home" />
                        <TabBtn id="progress" icon="fa-chart-pie" />
                        <TabBtn id="literasi" icon="fa-play-circle" />
                        <TabBtn id="leaderboard" icon="fa-trophy" />
                        <TabBtn id="materi" icon="fa-book-open" />
                        <TabBtn id="profile" icon="fa-user" />
                    </>
                 ) : user.role === 'guru' ? (
                    <>
                        <TabBtn id="monitoring" icon="fa-chart-pie" />
                        <TabBtn id="koreksi" icon="fa-clipboard-check" />
                        <TabBtn id="profile" icon="fa-user" />
                    </>
                 ) : (
                    /* ADMIN VIEW */
                    <>
                        <TabBtn id="monitoring" icon="fa-chart-pie" />
                        <TabBtn id="koreksi" icon="fa-clipboard-check" />
                        <TabBtn id="users" icon="fa-users" />
                        <TabBtn id="data" icon="fa-database" />
                        <TabBtn id="profile" icon="fa-user" />
                    </>
                 )}
             </div>
        </nav>
    </div>
  );
};

export default App;