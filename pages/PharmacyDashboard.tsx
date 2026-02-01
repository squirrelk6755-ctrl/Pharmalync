
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { UserRole, User, Prescription, MedicineInfo, DispenseLog, Order } from '../types';
import { db } from '../store';
import { Scanner } from '../components/Scanner';
import { checkMedicineSafety } from '../geminiService';
import { Search, Pill, ShieldCheck, AlertTriangle, CheckCircle, Smartphone, Loader2, Info, X, Phone, Clock, UserCheck, Activity, ShieldAlert, ShoppingBag } from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const [currentUser] = useState<User>(JSON.parse(localStorage.getItem('pl_current_user') || '{}'));
  const [showScanner, setShowScanner] = useState<'PATIENT' | 'MEDICINE' | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<number | null>(null);
  const [consentData, setConsentData] = useState({ phone: '', otp: '' });
  
  const [activePatient, setActivePatient] = useState<User | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<Order[]>([]);
  const [scannedMedInfo, setScannedMedInfo] = useState<MedicineInfo | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    refreshOrders();
  }, [currentUser.id]);

  useEffect(() => {
    let timer: number;
    if (isEmergencyMode && emergencyStartTime) {
      timer = window.setInterval(() => {
        const elapsed = (Date.now() - emergencyStartTime) / 1000;
        if (elapsed > 600) { // 10 minutes
          setIsEmergencyMode(false);
          setEmergencyStartTime(null);
          alert("Emergency access expired.");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isEmergencyMode, emergencyStartTime]);

  const refreshOrders = () => {
    setOnlineOrders(db.getOrdersByPharmacy(currentUser.id).filter(o => o.status === 'PENDING'));
  };

  const refreshPatientPrescriptions = (patientId: string) => {
    setPrescriptions(db.getPatientPrescriptions(patientId));
  };

  const handleVerifyConsent = () => {
    if (!isEmergencyMode && consentData.otp !== '123456') {
      alert("Invalid Patient OTP. Use 123456");
      return;
    }

    const patient = db.getPatientByPhoneOrCaregiverPhone(consentData.phone) || db.findOrCreatePatient(consentData.phone);
    if (patient) {
      setActivePatient(patient);
      refreshPatientPrescriptions(patient.id);
      setShowConsentModal(false);
      setConsentData({ phone: '', otp: '' });
      
      if (isEmergencyMode) {
        setEmergencyStartTime(Date.now());
        logEmergency(patient.id);
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

  const handleScanSuccess = (scannedValue: string) => {
    const patient = db.getUserById(scannedValue) || db.getPatientByPhoneOrCaregiverPhone(scannedValue);
    const targetPhone = patient ? patient.phone : scannedValue;

    // QR Bypass Logic: Direct lookup without OTP
    const p = db.findOrCreatePatient(targetPhone);
    if (p) {
      setActivePatient(p);
      refreshPatientPrescriptions(p.id);
      setShowScanner(null);
      if (isEmergencyMode) logEmergency(p.id);
    }
  };

  const handleProcessOrder = (order: Order) => {
    setConsentData({ phone: order.patientPhone, otp: '' });
    setShowConsentModal(true);
  };

  const handleMedScan = async (medName: string) => {
    setLoadingAI(true);
    setShowScanner(null);
    const info = await checkMedicineSafety(medName);
    setScannedMedInfo(info);
    setLoadingAI(false);
  };

  const handleDispense = (prescriptionId: string, medName: string, brand: string) => {
    const pres = db.getPrescriptionById(prescriptionId);
    if (!pres) return;

    // Check if this fulfills an online order
    const associatedOrder = onlineOrders.find(o => o.prescriptionId === prescriptionId);

    const log: DispenseLog = {
      id: `log_${Date.now()}`,
      prescriptionId: pres.id,
      patientId: pres.patientId,
      pharmacyId: currentUser.id,
      pharmacyName: currentUser.name,
      doctorId: pres.doctorId,
      medicineName: medName,
      brand: brand,
      quantity: 1,
      timestamp: new Date().toISOString(),
      isEmergency: pres.isEmergency || isEmergencyMode,
      orderId: associatedOrder?.id
    };

    db.dispenseMedicine(log);
    if (activePatient) refreshPatientPrescriptions(activePatient.id);
    refreshOrders();
    setScannedMedInfo(null);
    alert(`Dispense for "${medName}" complete.`);
  };

  const timeLeft = isEmergencyMode && emergencyStartTime 
    ? Math.max(0, 600 - Math.floor((Date.now() - emergencyStartTime) / 1000))
    : 0;

  return (
    <Layout role={UserRole.PHARMACY} userName={currentUser.name} isEmergency={isEmergencyMode}>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-50">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> Pharmacy Terminal
            </h3>

            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-2xl mb-4 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-red-700 font-black text-[10px] uppercase tracking-wider">
                  <ShieldAlert size={16} /> Emergency Mode
                </div>
                {isEmergencyMode && emergencyStartTime && (
                  <span className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
              onClick={() => setShowConsentModal(true)}
              className={`w-full py-3.5 rounded-xl font-black shadow-lg mb-4 uppercase text-xs tracking-widest ${isEmergencyMode ? 'bg-red-600 text-white shadow-red-100' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
            >
              Verify Patient / Caregiver
            </button>
            
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span>Health QR (OTP Bypass)</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            
            <button 
              onClick={() => setShowScanner('PATIENT')}
              className="w-full bg-slate-50 border border-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all mb-4 text-slate-600"
            >
              <Smartphone size={18} /> QR Identity Scan
            </button>
            <button 
              onClick={() => setShowScanner('MEDICINE')}
              className="w-full bg-indigo-50/50 text-indigo-600 border border-indigo-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
            >
              <Pill size={18} /> AI Clinical Safety
            </button>
          </div>

          {/* Pending Online Orders */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
              <ShoppingBag size={18} className="text-indigo-600" /> Pending Online Orders
            </h4>
            <div className="space-y-3">
              {onlineOrders.map(order => (
                <button 
                  key={order.id}
                  onClick={() => handleProcessOrder(order)}
                  className="w-full text-left p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-black text-slate-900 text-sm">{order.patientName}</p>
                    <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">Online Order</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(order.timestamp).toLocaleTimeString()}</p>
                </button>
              ))}
              {onlineOrders.length === 0 && (
                <p className="text-[10px] text-slate-400 font-bold italic text-center py-4">No active online orders.</p>
              )}
            </div>
          </div>

          {activePatient && (
            <div className={`rounded-3xl p-6 border animate-in fade-in slide-in-from-bottom-2 duration-500 ${isEmergencyMode ? 'bg-red-50 border-red-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <h4 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${isEmergencyMode ? 'text-red-600' : 'text-indigo-600'}`}>
                  <UserCheck size={16} /> Clinical Session Active
                </h4>
                <button onClick={() => setActivePatient(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16}/></button>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl shadow-sm border border-indigo-100">
                 <p className="font-black text-slate-900">{activePatient.name}</p>
                 <p className="text-xs text-indigo-700 font-bold opacity-75">{activePatient.phone}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
           {loadingAI ? (
             <div className="bg-white rounded-[2.5rem] p-20 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <Loader2 size={48} className="text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">AI Medical Insight</h3>
                <p className="text-slate-500 mt-2 font-medium max-w-xs">Connecting to verified pharmacopoeia...</p>
             </div>
           ) : scannedMedInfo ? (
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="bg-indigo-600 p-10 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Clinical Safety Report</span>
                      <h3 className="text-4xl font-black tracking-tight">{scannedMedInfo.name}</h3>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <Pill size={32} />
                    </div>
                  </div>
                  <p className="text-indigo-100 font-bold text-lg mt-4 opacity-90 leading-relaxed max-w-2xl">{scannedMedInfo.safetyStatus}</p>
                </div>
                <div className="p-10">
                   <div className="grid md:grid-cols-2 gap-8 mb-10">
                      <div className="space-y-4">
                         <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                           <CheckCircle size={18} className="text-green-500" /> Advantages
                         </h4>
                         <ul className="space-y-2">
                            {scannedMedInfo.advantages.map((adv, i) => <li key={i} className="text-sm text-slate-600 bg-green-50/50 px-4 py-3 rounded-xl border border-green-100/50 font-medium">{adv}</li>)}
                         </ul>
                      </div>
                      <div className="space-y-4">
                         <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                           <AlertTriangle size={18} className="text-orange-500" /> Disadvantages
                         </h4>
                         <ul className="space-y-2">
                            {scannedMedInfo.disadvantages.map((dis, i) => <li key={i} className="text-sm text-slate-600 bg-orange-50/50 px-4 py-3 rounded-xl border border-orange-100/50 font-medium">{dis}</li>)}
                         </ul>
                      </div>
                   </div>
                   <button onClick={() => setScannedMedInfo(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200">Return to prescriptions</button>
                </div>
             </div>
           ) : activePatient ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <Clock className="text-indigo-600" /> Pending Dispensations
                </h3>
                {prescriptions.map(pres => (
                  <div key={pres.id} className={`bg-white rounded-[2rem] p-8 shadow-sm border transition-all hover:shadow-md ${pres.isEmergency ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-6">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${pres.isEmergency ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {pres.doctorName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">Dr. {pres.doctorName}</h4>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{new Date(pres.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {pres.isEmergency && <span className="text-[8px] bg-red-600 text-white px-2 py-1 rounded-lg font-black uppercase mb-1 block">Emergency Priority</span>}
                        <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-mono font-black text-slate-600 uppercase">Vault: {pres.id.slice(-6)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {pres.medicines.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-50 transition-all"><Pill size={20} /></div>
                            <div>
                              <p className="font-black text-slate-900 text-base leading-none">{m.name}</p>
                              <p className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-tight">
                                {m.brand} • {m.mrg}-{m.aft}-{m.nyt} • Qty: {m.total || m.quantity}
                              </p>
                            </div>
                          </div>
                          {m.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleDispense(pres.id, m.name, m.brand)}
                              className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-green-100 hover:bg-green-700 transition-all uppercase tracking-widest"
                            >
                              <CheckCircle size={16} /> Dispense
                            </button>
                          ) : (
                            <div className="bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
                              <CheckCircle size={14} /> Issued
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           ) : (
             <div className="h-96 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                <div className="p-6 bg-white rounded-full shadow-sm mb-6 text-slate-200">
                  <ShoppingBag size={64} strokeWidth={1} />
                </div>
                <h3 className="font-black text-slate-600 text-lg tracking-tight uppercase">Pharmacy Network Node</h3>
                <p className="text-slate-400 max-w-xs mt-2 font-medium">Identify a patient or process an online order to begin dispensation.</p>
             </div>
           )}
        </div>
      </div>

      {showConsentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className={`${isEmergencyMode ? 'bg-red-600' : 'bg-indigo-600'} p-8 text-white flex justify-between items-center`}>
                 <div>
                   <h3 className="font-black text-xl tracking-tight uppercase">{isEmergencyMode ? 'Emergency Override' : 'Clinical Auth'}</h3>
                   <p className="text-indigo-100 text-[10px] font-black uppercase opacity-80 mt-1">{isEmergencyMode ? 'Bypassing OTP for critical care' : 'Secure patient consent'}</p>
                 </div>
                 <button onClick={() => setShowConsentModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-5">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg" value={consentData.phone} onChange={e => setConsentData({...consentData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                 </div>
                 {!isEmergencyMode && (
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Consent OTP (123456)</label>
                      <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black tracking-[0.5em] text-center focus:ring-2 focus:ring-indigo-500 outline-none text-2xl" placeholder="000000" maxLength={6} value={consentData.otp} onChange={e => setConsentData({...consentData, otp: e.target.value.replace(/\D/g, '')})} />
                   </div>
                 )}
                 {isEmergencyMode && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[10px] font-black uppercase text-center flex items-center gap-2 justify-center">
                      <ShieldAlert size={14} /> Emergency Protocol Active
                    </div>
                 )}
                 <button onClick={handleVerifyConsent} className={`w-full text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm mt-4 ${isEmergencyMode ? 'bg-red-600 shadow-red-200' : 'bg-indigo-600 shadow-indigo-100'}`}>
                   {isEmergencyMode ? 'Execute Emergency Access' : 'Authorize Patient Lookup'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showScanner === 'PATIENT' && <Scanner onScan={handleScanSuccess} onClose={() => setShowScanner(null)} title="Patient Identification" />}
      {showScanner === 'MEDICINE' && <Scanner onScan={handleMedScan} onClose={() => setShowScanner(null)} title="Medicine AI Verification" />}
    </Layout>
  );
};
