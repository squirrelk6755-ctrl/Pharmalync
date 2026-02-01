
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { UserRole, User, VerificationStatus } from '../types';
import { db } from '../store';
import { CheckCircle, XCircle, UserCheck, Mail, Phone, Plus, UserPlus, ShieldCheck, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [currentUser] = useState<User>(JSON.parse(localStorage.getItem('pl_current_user') || '{}'));
  const [doctors, setDoctors] = useState<User[]>([]);
  const [pharmacies, setPharmacies] = useState<User[]>([]);
  const [showRegForm, setShowRegForm] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    refreshLists();
  }, []);

  const refreshLists = () => {
    setDoctors(db.getUsersByRole(UserRole.DOCTOR));
    setPharmacies(db.getUsersByRole(UserRole.PHARMACY));
  };

  const handleVerify = (id: string, status: VerificationStatus) => {
    db.verifyUser(id, status);
    refreshLists();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRegForm) return;
    const res = db.registerProfessional(formData.phone, formData.name, showRegForm, formData.email);
    if (res) {
      alert(`${showRegForm} registered successfully! Now proceed with verification.`);
      setFormData({ name: '', phone: '', email: '' });
      setShowRegForm(null);
      refreshLists();
    } else {
      alert("Registration failed. Phone already exists.");
    }
  };

  const UserList = ({ users, title, role }: { users: User[], title: string, role: UserRole }) => (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            {role === UserRole.DOCTOR ? <UserCheck className="text-blue-600" /> : <UserPlus className="text-indigo-600" />}
            {title}
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Directory</p>
        </div>
        <button 
          onClick={() => setShowRegForm(role)}
          className="bg-slate-900 text-white hover:bg-black px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-slate-200 uppercase tracking-wider"
        >
          <Plus size={16} /> Register
        </button>
      </div>

      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:bg-white hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border-2 ${u.status === VerificationStatus.VERIFIED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {u.name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight">{u.name}</p>
                <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                   <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {u.phone}</span>
                   {u.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-300" /> {u.email}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {u.status === VerificationStatus.PENDING ? (
                <>
                  <button 
                    onClick={() => handleVerify(u.id, VerificationStatus.VERIFIED)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 uppercase tracking-widest"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleVerify(u.id, VerificationStatus.REJECTED)}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-red-100 hover:bg-red-100 uppercase tracking-widest"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              ) : (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${u.status === VerificationStatus.VERIFIED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                   {u.status === VerificationStatus.VERIFIED ? <ShieldCheck size={14} /> : <XCircle size={14} />}
                   <span className="text-[10px] font-black uppercase tracking-widest">
                    {u.status === VerificationStatus.VERIFIED ? 'Verified' : 'Blocked'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <Activity size={40} className="mx-auto mb-4 opacity-10" />
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No entries found</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout role={UserRole.ADMIN} userName={currentUser.name}>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Professional Directory</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Governance & Credentialing Dashboard</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active nodes</span>
              <span className="text-2xl font-black text-slate-900 leading-none mt-1">{doctors.length + pharmacies.length}</span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
          <UserList users={doctors} title="Certified Doctors" role={UserRole.DOCTOR} />
          <UserList users={pharmacies} title="Licensed Pharmacies" role={UserRole.PHARMACY} />
        </div>

        {showRegForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
             <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                   <div>
                     <h3 className="font-black text-xl tracking-tight">Node Registration</h3>
                     <p className="text-slate-400 text-xs font-medium mt-1">Onboarding for {showRegForm}</p>
                   </div>
                   <button onClick={() => setShowRegForm(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><XCircle size={28}/></button>
                </div>
                <form onSubmit={handleRegister} className="p-8 space-y-5">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Legal Name</label>
                      <input 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Dr. John Smith"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Verified Phone</label>
                      <input 
                        required 
                        type="tel"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="10-digit mobile"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                      <input 
                        required 
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="name@institution.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                   <button 
                     type="submit"
                     className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs mt-4 shadow-2xl shadow-slate-200 transition-all hover:bg-black"
                   >
                     Initiate Credentialing
                   </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
