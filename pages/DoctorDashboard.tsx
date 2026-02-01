
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { UserRole, User, Prescription, DispenseLog, Medicine } from '../types';
import { db } from '../store';
import { Scanner } from '../components/Scanner';
import { Search, User as UserIcon, Plus, History, Calendar, Pill, ShieldCheck, Smartphone, X, Activity, HeartPulse, ShieldAlert, Trash2, Clock } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [currentUser] = useState<User>(JSON.parse(localStorage.getItem('pl_current_user') || '{}'));
  const [showScanner, setShowScanner] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<number | null>(null);
  const [consentData, setConsentData] = useState({ phone: '', otp: '' });
  
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [history, setHistory] = useState<Prescription[]>([]);
  const [dispenseLogs, setDispenseLogs] = useState<DispenseLog[]>([]);
  const [meds, setMeds] = useState<Partial<Medicine>[]>([{ name: '', brand: '', dosage: '1-0-1', quantity: 1, mrg: 1, aft: 0, nyt: 1, timing: 'AFTER_FOOD', days: 5, total: 10 }]);

  useEffect(() => {
    let timer: number;
    if (isEmergencyMode && emergencyStartTime) {
      timer = window.setInterval(() => {
        const elapsed = (Date.now() - emergencyStartTime) / 1000;
        if (elapsed > 600) { // 10 minutes
          setIsEmergencyMode(false);
          setEmergencyStartTime(null);
          alert("Emergency access expired (10-minute limit).");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isEmergencyMode, emergencyStartTime]);

  const refreshPatientData = (patientId: string) => {
    setHistory(db.getPatientPrescriptions(patientId));
    setDispenseLogs(db.getDispenseLogsByPatient(patientId));
  };

  const handleScan = (value: string) => {
    const patient = db.getUserById(value) || db.getPatientByPhoneOrCaregiverPhone(value);
    const targetPhone = patient ? patient.phone : value;
    
    // QR Bypass Logic: Direct access if valid patient found via scan
    const p = db.findOrCreatePatient(targetPhone);
    if (p) {
      setSelectedPatient(p);
      refreshPatientData(p.id);
      setShowScanner(false);
      
      if (isEmergencyMode) {
        logEmergency(p.id);
      }
    }
  };

  const logEmergency = (patientId: string) => {
    db.logEmergencyAccess({
      id: `elog_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      patientId: patientId,
      timestamp: new Date().toISOString()
    });
  };

  const handleVerify = () => {
    if (!isEmergencyMode && consentData.otp !== '123456') { 
      alert("Invalid OTP. Use 123456"); 
      return; 
    }
    const patient = db.findOrCreatePatient(consentData.phone);
    if (patient) {
      setSelectedPatient(patient);
      refreshPatientData(patient.id);
      setShowConsent(false);
      
      if (isEmergencyMode) {
        setEmergencyStartTime(Date.now());
        logEmergency(patient.id);
      }
    }
  };

  const updateMed = (index: number, field: keyof Medicine, value: any) => {
    const newMeds = [...meds];
    const med = { ...newMeds[index], [field]: value };
    
    // Auto-calculate Total Tablets
    if (['mrg', 'aft', 'nyt', 'days'].includes(field)) {
      const m = Number(med.mrg || 0);
      const a = Number(med.aft || 0);
      const n = Number(med.nyt || 0);
      const d = Number(med.days || 0);
      med.total = (m + a + n) * d;
      med.quantity = med.total;
    }
    
    newMeds[index] = med;
    setMeds(newMeds);
  };

  const handleSubmit = () => {
    if (!selectedPatient) return;
    if (meds.some(m => !m.name)) {
      alert("Please fill in medicine name.");
      return;
    }
    const pres: Prescription = {
      id: `pres_${Date.now()}`,
      patientId: selectedPatient.id,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      doctorPhone: currentUser.phone,
      date: new Date().toISOString(),
      isEmergency: isEmergencyMode,
      medicines: meds.map(m => ({
        name: m.name || '',
        brand: m.brand || '',
        dosage: `${m.mrg}-${m.aft}-${m.nyt}`,
        mrg: m.mrg,
        aft: m.aft,
        nyt: m.nyt,
        timing: m.timing,
        days: m.days,
        total: m.total,
        quantity: m.total || 0,
        status: 'PENDING'
      })) as Medicine[]
    };
    db.addPrescription(pres);
    refreshPatientData(selectedPatient.id);
    setMeds([{ name: '', brand: '', dosage: '1-0-1', quantity: 1, mrg: 1, aft: 0, nyt: 1, timing: 'AFTER_FOOD', days: 5, total: 10 }]);
    alert(isEmergencyMode ? "EMERGENCY Prescription Issued." : "Prescription synced successfully.");
  };

  const timeLeft = isEmergencyMode && emergencyStartTime 
    ? Math.max(0, 600 - Math.floor((Date.now() - emergencyStartTime) / 1000))
    : 0;

  return (
    <Layout role={UserRole.DOCTOR} userName={currentUser.name} isEmergency={isEmergencyMode}>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> Clinical Diagnosis
            </h3>

            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-2xl mb-4 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-red-700 font-black text-[10px] uppercase tracking-wider">
                  <ShieldAlert size={16} /> Emergency Mode
                </div>
                {isEmergencyMode && emergencyStartTime && (
                  <span className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  if(!isEmergencyMode) {
                    setIsEmergencyMode(true);
                    setEmergencyStartTime(Date.now());
                  } else {
                    setIsEmergencyMode(false);
                    setEmergencyStartTime(null);
                  }
                }}
                className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none ${isEmergencyMode ? 'bg-red-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEmergencyMode ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <button 
              onClick={() => setShowConsent(true)} 
              className={`w-full py-3 rounded-xl font-bold mb-3 transition-colors shadow-md ${isEmergencyMode ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
            >
              {isEmergencyMode ? 'Emergency Patient Search' : 'Verify Patient / Caregiver'}
            </button>
            
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span>QR Link (Bypass OTP)</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            
            <button 
              onClick={() => setShowScanner(true)} 
              className="w-full bg-slate-50 border border-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-slate-600"
            >
              <Smartphone size={18} /> {isEmergencyMode ? 'Emergency QR Scan' : 'Scan Health Card'}
            </button>
          </div>

          {selectedPatient && (
            <div className={`rounded-3xl p-6 border animate-in fade-in slide-in-from-bottom-2 duration-500 ${isEmergencyMode ? 'bg-red-50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border ${isEmergencyMode ? 'text-red-600 border-red-100' : 'text-blue-600 border-blue-100'}`}>
                  <UserIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 leading-tight">{selectedPatient.name}</p>
                  <p className={`text-xs font-bold opacity-75 ${isEmergencyMode ? 'text-red-700' : 'text-blue-700'}`}>{selectedPatient.phone}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1 text-slate-300 hover:text-slate-600"><X size={16}/></button>
              </div>
              <div className="space-y-2">
                <p className={`text-[10px] font-black bg-white border px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-sm ${isEmergencyMode ? 'text-red-600 border-red-100' : 'text-blue-600 border-blue-100'}`}>
                  <ShieldCheck size={14} /> {isEmergencyMode ? 'EMERGENCY SESSION ACTIVE' : 'CLINICAL SESSION ACTIVE'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              <div className={`bg-white rounded-3xl p-8 shadow-sm border ${isEmergencyMode ? 'border-red-100' : 'border-blue-50'}`}>
                <h3 className="font-black text-xl mb-6 flex items-center justify-between text-slate-900 tracking-tight">
                  <div className="flex items-center gap-2">
                    <Plus className={isEmergencyMode ? 'text-red-600' : 'text-blue-600'} /> 
                    {isEmergencyMode ? 'Emergency Prescription' : 'Digital Prescription'}
                  </div>
                </h3>
                
                <div className="overflow-x-auto -mx-8 px-8 mb-6">
                  <table className="w-full border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                        <th className="pb-2 pl-4">Medicine & Brand</th>
                        <th className="pb-2">Dose (M-A-N)</th>
                        <th className="pb-2">Food</th>
                        <th className="pb-2">Days</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="space-y-4">
                      {meds.map((m, i) => (
                        <tr key={i} className={`rounded-2xl border ${isEmergencyMode ? 'bg-red-50/30 border-red-50' : 'bg-slate-50/50 border-slate-100'}`}>
                          <td className="p-4 rounded-l-2xl">
                            <input className="w-full bg-white rounded-lg p-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-blue-400 mb-2" placeholder="Medicine Name" value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} />
                            <input className="w-full bg-white rounded-lg p-2 text-xs outline-none ring-1 ring-slate-200 focus:ring-blue-400" placeholder="Brand" value={m.brand} onChange={e => updateMed(i, 'brand', e.target.value)} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <input type="number" className="w-10 bg-white rounded-lg p-2 text-sm text-center ring-1 ring-slate-200" value={m.mrg} onChange={e => updateMed(i, 'mrg', parseInt(e.target.value) || 0)} />
                              <span className="text-slate-300">-</span>
                              <input type="number" className="w-10 bg-white rounded-lg p-2 text-sm text-center ring-1 ring-slate-200" value={m.aft} onChange={e => updateMed(i, 'aft', parseInt(e.target.value) || 0)} />
                              <span className="text-slate-300">-</span>
                              <input type="number" className="w-10 bg-white rounded-lg p-2 text-sm text-center ring-1 ring-slate-200" value={m.nyt} onChange={e => updateMed(i, 'nyt', parseInt(e.target.value) || 0)} />
                            </div>
                          </td>
                          <td className="p-4">
                            <select className="bg-white rounded-lg p-2 text-[10px] font-bold ring-1 ring-slate-200 outline-none" value={m.timing} onChange={e => updateMed(i, 'timing', e.target.value)}>
                              <option value="AFTER_FOOD">After Food</option>
                              <option value="BEFORE_FOOD">Before Food</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <input type="number" className="w-12 bg-white rounded-lg p-2 text-sm text-center ring-1 ring-slate-200" value={m.days} onChange={e => updateMed(i, 'days', parseInt(e.target.value) || 0)} />
                          </td>
                          <td className="p-4">
                            <div className="w-12 bg-slate-200/50 text-slate-600 rounded-lg p-2 text-sm text-center font-black">{m.total}</div>
                          </td>
                          <td className="p-4 rounded-r-2xl">
                            {meds.length > 1 && (
                              <button onClick={() => setMeds(meds.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setMeds([...meds, { name: '', brand: '', mrg: 1, aft: 0, nyt: 1, timing: 'AFTER_FOOD', days: 5, total: 10 }])} className={`${isEmergencyMode ? 'text-red-600' : 'text-blue-600'} text-xs font-black hover:opacity-80 flex items-center gap-1 uppercase tracking-widest`}>
                    <Plus size={16} /> Add Medicine
                  </button>
                  <button onClick={handleSubmit} className={`flex-1 py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all uppercase tracking-wider text-sm ${isEmergencyMode ? 'bg-red-600 text-white shadow-red-200' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                    Issue {isEmergencyMode ? 'Emergency' : 'Secure'} Prescription
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-900 tracking-tight">
                  <History className="text-blue-600" /> Patient Clinical History
                </h3>
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {history.map(pres => (
                    <div key={pres.id} className="relative pl-8">
                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 shadow-sm z-10 ${pres.isEmergency ? 'border-red-500' : 'border-blue-500'}`}></div>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Calendar size={12} /> {new Date(pres.date).toLocaleString()}</p>
                          {pres.isEmergency && <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Emergency Record</span>}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          {pres.medicines.map((m, i) => {
                            const log = dispenseLogs.find(l => l.prescriptionId === pres.id && l.medicineName === m.name);
                            return (
                              <div key={i} className="bg-slate-50 px-4 py-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl bg-white shadow-sm ${m.status === 'DISPENSED' ? 'text-green-600' : 'text-orange-400'}`}>
                                    <Pill size={16} />
                                  </div>
                                  <div className="flex-1">
                                    <span className="font-black text-slate-800 text-sm block leading-none">{m.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">{m.mrg}-{m.aft}-{m.nyt} • {m.days} Days</span>
                                  </div>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${m.status === 'DISPENSED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{m.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <History size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="font-bold text-sm uppercase tracking-widest">No prior clinical history found</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-96 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="p-6 bg-white rounded-full shadow-sm mb-6 text-slate-200">
                <HeartPulse size={64} strokeWidth={1} />
              </div>
              <p className="font-black text-slate-600 text-lg tracking-tight">Clinical Diagnosis Hub</p>
              <p className="text-sm mt-2 max-w-xs font-medium text-slate-400">Search for a patient or scan their Health QR to start session.</p>
            </div>
          )}
        </div>
      </div>

      {showConsent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className={`${isEmergencyMode ? 'bg-red-600' : 'bg-blue-600'} p-8 text-white flex justify-between items-center`}>
              <div>
                <h3 className="font-black text-xl tracking-tight uppercase">{isEmergencyMode ? 'Emergency Unlock' : 'Patient Consent'}</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase opacity-80 mt-1">{isEmergencyMode ? 'Direct access protocol triggered' : 'Enter phone to verify identity'}</p>
              </div>
              <button onClick={() => setShowConsent(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg" placeholder="10-digit number" value={consentData.phone} onChange={e => setConsentData({...consentData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
              </div>
              {!isEmergencyMode && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Consent OTP (123456)</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-center tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500 transition-all text-2xl" placeholder="000000" maxLength={6} value={consentData.otp} onChange={e => setConsentData({...consentData, otp: e.target.value.replace(/\D/g, '')})} />
                </div>
              )}
              {isEmergencyMode && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[10px] font-black uppercase text-center flex items-center gap-2 justify-center">
                  <ShieldAlert size={14} /> Critical Access - OTP Bypassed
                </div>
              )}
              <button onClick={handleVerify} className={`w-full text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm mt-4 ${isEmergencyMode ? 'bg-red-600 shadow-red-200' : 'bg-blue-600 shadow-blue-100'}`}>
                {isEmergencyMode ? 'Authorize Emergency Session' : 'Start Clinical Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} title={isEmergencyMode ? "Emergency QR Scan" : "Patient QR Verification"} />}
    </Layout>
  );
};
