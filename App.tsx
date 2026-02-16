import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { LoginPage } from './LoginPage';
import { User, Tab, APP_LOGO_URL, RamadanTarget } from './types';
import { TabHarian, TabLiterasi, TabMateri, TabProfile, TabLeaderboard } from './StudentTabs';
import { TabAdminUsers, TabAdminData, TabMonitoring } from './AdminTabs';

// --- Simple Components ---
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

const TargetModal = ({ user, onClose }: { user: User, onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RamadanTarget>({ startDate: '', targetPuasa: '', targetTarawih: '', targetTadarus: '', targetKarakter: '' });
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
                            <input type="date" className="w-full p-3 bg-slate-100 rounded-xl" onChange={e => setFormData({...formData, startDate: e.target.value})} />
                         </div>
                         <button onClick={() => { if(formData.startDate) setStep(2); else Swal.fire('Pilih Tanggal', '', 'warning'); }} className="w-full py-4 bg-primary-600 text-white font-bold rounded-[20px] shadow-lg">Lanjut</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 className="text-xl font-black text-center mb-4 text-slate-800">Target Ramadan Kamu</h3>
                        <div className="space-y-3 mb-6">
                            <input type="text" className="w-full p-3 border rounded-xl text-sm" placeholder="Target Puasa (misal: Full)" onChange={e => setFormData({...formData, targetPuasa: e.target.value})} />
                            <input type="text" className="w-full p-3 border rounded-xl text-sm" placeholder="Target Tarawih" onChange={e => setFormData({...formData, targetTarawih: e.target.value})} />
                            <input type="text" className="w-full p-3 border rounded-xl text-sm" placeholder="Target Tadarus" onChange={e => setFormData({...formData, targetTadarus: e.target.value})} />
                            <input type="text" className="w-full p-3 border rounded-xl text-sm" placeholder="Target Karakter" onChange={e => setFormData({...formData, targetKarakter: e.target.value})} />
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = SupabaseService.getUser();
    if (u) {
        setUser(u);
        if (u.role === 'admin' || u.role === 'guru') setActiveTab('monitoring');
        else if (u.role === 'murid') {
            setActiveTab('harian');
            SupabaseService.getRamadanTarget(u.id).then(t => { if(!t) setShowTargetModal(true); });
        }
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
      if (u.role === 'admin' || u.role === 'guru') setActiveTab('monitoring');
      else {
          setActiveTab('harian');
          SupabaseService.getRamadanTarget(u.id).then(t => { if(!t) setShowTargetModal(true); });
      }
  };

  const handleLogout = () => {
      SupabaseService.logout();
      setUser(null);
  };

  if (loading) return null;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const TabBtn = ({ id, icon, label }: { id: Tab, icon: string, label: string }) => (
      <button onClick={() => setActiveTab(id)} className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors ${activeTab === id ? 'text-primary-600 scale-105' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className={`fas ${icon} text-lg mb-1 ${activeTab === id ? 'drop-shadow-sm' : ''}`}></i>
          <span className="text-[9px] font-bold tracking-wide">{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
        <Header user={user} activeTab={activeTab} />
        {showTargetModal && <TargetModal user={user} onClose={() => setShowTargetModal(false)} />}

        <main className="max-w-md mx-auto relative z-10">
            {activeTab === 'harian' && <TabHarian user={user} />}
            {activeTab === 'literasi' && <TabLiterasi user={user} />}
            {activeTab === 'leaderboard' && <TabLeaderboard />}
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

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-300/50 rounded-[32px] p-2 z-50 flex items-center justify-between">
             {user.role === 'murid' ? (
                <>
                    <TabBtn id="harian" icon="fa-home" label="Jurnal" />
                    <TabBtn id="literasi" icon="fa-video" label="Literasi" />
                    <TabBtn id="leaderboard" icon="fa-trophy" label="Top 50" />
                    <TabBtn id="materi" icon="fa-mosque" label="Materi" />
                    <TabBtn id="profile" icon="fa-user" label="Profil" />
                </>
             ) : (
                <>
                    <TabBtn id="monitoring" icon="fa-chart-pie" label="Monitor" />
                    <TabBtn id="users" icon="fa-users" label="Users" />
                    <TabBtn id="data" icon="fa-database" label="Data" />
                    <TabBtn id="profile" icon="fa-user" label="Profil" />
                </>
             )}
        </nav>
    </div>
  );
};

export default App;