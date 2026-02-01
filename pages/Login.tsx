
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRole, VerificationStatus } from '../types';
import { db } from '../store';
import { Smartphone, ArrowRight, ShieldAlert, CheckCircle2, HeartPulse, Activity } from 'lucide-react';

export const Login: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRole = role?.toUpperCase() as UserRole;

  const handleSendOtp = () => {
    if (phone.length < 10) {
      setError('Enter a valid 10-digit number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setError('');
      setStep(2);
      setLoading(false);
    }, 500);
  };

  const handleVerifyOtp = () => {
    if (otp !== '123456') {
      setError('Invalid OTP. Use 123456');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      let user = db.getUserByPhone(phone);

      if (selectedRole === UserRole.PATIENT) {
        // Patient login supports caregiver alias, but for direct login we fetch the actual account
        // findOrCreate handles alias internally
        user = db.findOrCreatePatient(phone);
      } else {
        // Strict check for professionals
        if (!user || user.role !== selectedRole) {
          setError(`${selectedRole} account not found. Admin verification required.`);
          setLoading(false);
          return;
        }
        if (user.status !== VerificationStatus.VERIFIED) {
          setError('Account verification pending. Contact PharmaLync Admin.');
          setLoading(false);
          return;
        }
      }

      localStorage.setItem('pl_current_user', JSON.stringify(user));
      navigate('/dashboard');
      setLoading(false);
    }, 500);
  };

  const getStyle = () => {
    switch(selectedRole) {
      case UserRole.ADMIN: return { color: 'blue', label: 'Network Admin', bg: 'bg-blue-600' };
      case UserRole.DOCTOR: return { color: 'blue', label: 'Doctor Login', bg: 'bg-blue-600' };
      case UserRole.PHARMACY: return { color: 'indigo', label: 'Pharmacist Login', bg: 'bg-indigo-600' };
      default: return { color: 'emerald', label: 'Patient Access', bg: 'bg-emerald-600' };
    }
  };

  const style = getStyle();

  return (
    <div className="min-h-screen flex items-center justify-center bg-medical-pattern p-6 relative overflow-hidden">
      {/* Background medical patterns */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.03] text-blue-900 pointer-events-none">
        <Activity size={400} />
      </div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white text-${style.color}-600 mb-6 shadow-2xl shadow-${style.color}-200/20 border border-white`}>
            <HeartPulse size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            PharmaLync
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">{style.label}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 border border-white">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in shake-in duration-300">
              <ShieldAlert size={20} /> {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Phone Authentication</label>
                <div className="relative">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-14 pr-4 py-5 text-xl font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
                {selectedRole === UserRole.PATIENT && (
                  <p className="text-[10px] text-slate-400 mt-3 font-medium px-1">Patients can use their primary phone or their <span className="text-emerald-600 font-black">caregiver's</span> number.</p>
                )}
              </div>
              <button 
                onClick={handleSendOtp}
                className={`w-full ${style.bg} text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-${style.color}-200 uppercase tracking-widest text-sm`}
              >
                Send Secure OTP <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={20} />
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-tight">OTP sent to +91 {phone.slice(0,3)}...{phone.slice(-3)}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">6-Digit Access Code</label>
                <input 
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-6 text-4xl font-black text-center tracking-[0.8em] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-100"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleVerifyOtp}
                  className={`w-full ${style.bg} text-white py-5 rounded-2xl font-black hover:opacity-90 transition-all shadow-xl shadow-${style.color}-200 uppercase tracking-widest text-sm`}
                >
                  Verify & Unlock Vault
                </button>
                <button onClick={() => setStep(1)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2">Change Phone Number</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] opacity-40">
          PharmaLync Clinical Network v3.1 • Hospital Trusted
        </div>
      </div>
    </div>
  );
};