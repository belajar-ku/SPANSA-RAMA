import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { LoginPage } from './LoginPage';
import { User, Tab, APP_LOGO_URL, RamadanTarget, getWIBDate } from './types';
import { TabHarian, TabLiterasi, TabMateri, TabProfile, TabLeaderboard, TabProgress } from './StudentTabs';
import { TabAdminUsers, TabAdminData, TabMonitoring } from './AdminTabs';

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
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-slide-up">
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl">
                {step === 1 && (
                    <div className="animate-slide-up">
                         <h3 className="text-xl font-black text-center mb-4">Awal Ramadan</h3>
                         <div className="space-y-3 mb-6">
                            {settings.startRamadhanV1 && (
                                <button onClick={() => setFormData({...formData, startDate: settings.startRamadhanV1})} className={`w-full p-4 rounded-xl border-2 text-left ${formData.startDate === settings.startRamadhanV1 ? 'border-primary-500 bg-primary-50' : 'border-slate-100'}`}>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Versi Pemerintah/NU</p>
                                    <p className="font-black text-lg">{settings.startRamadhanV1}</p>
                                </button>
                            )}
                            {settings.startRamadhanV2 && (
                                <button onClick={() => setFormData({...formData, startDate: settings.startRamadhanV2})} className={`w-full p-4 rounded-xl border-2 text-left ${formData.startDate === settings.startRamadhanV2 ? 'border-primary-500 bg-primary-50' : 'border-slate-100'}`}>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Versi Muhammadiyah</p>
                                    <p className="font-black text-lg">{settings.startRamadhanV2}</p>
                                </button>
                            )}
                            <div className="text-center text-xs text-slate-400">- atau pilih manual -</div>
                            <input type="date" className="w-full p-3 bg-slate-100 rounded-xl" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                         </div>
                         <button onClick={() => { if(formData.startDate) setStep(2); else Swal.fire('Pilih Tanggal', '', 'warning'); }} className="w-full py-4 bg-primary-600 text-white font-bold rounded-[20px] shadow-lg">Lanjut</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 className="text-xl font-black text-center mb-4 text-slate-800">Target Ramadan Kamu</h3>
                        <p className="text-xs text-slate-500 text-center mb-4">Edit targetmu kapan saja di sini.</p>
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Puasa</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700" placeholder="Contoh: Full 30 Hari" value={formData.targetPuasa} onChange={e => setFormData({...formData, targetPuasa: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Tarawih</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700" placeholder="Contoh: Tidak Bolong" value={formData.targetTarawih} onChange={e => setFormData({...formData, targetTarawih: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Tadarus</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700" placeholder="Contoh: Khatam 1x" value={formData.targetTadarus} onChange={e => setFormData({...formData, targetTadarus: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Karakter</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700" placeholder="Contoh: Lebih Sabar" value={formData.targetKarakter} onChange={e => setFormData({...formData, targetKarakter: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-4 mt-2 bg-primary-600 text-white font-bold rounded-[20px] shadow-lg">Simpan Target</button>
                    </div>
                )}
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
            
            {(user.role === 'admin' || user.role === 'guru') && (
                <>
                    {activeTab === 'monitoring' && <TabMonitoring />}
                    {activeTab === 'users' && <TabAdminUsers />}
                    {activeTab === 'data' && <TabAdminData />}
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
                 ) : (
                    <>
                        <TabBtn id="monitoring" icon="fa-chart-pie" />
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