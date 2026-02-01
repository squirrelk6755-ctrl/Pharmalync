
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { UserRole, User, Prescription, DispenseLog, Order } from '../types';
import { db } from '../store';
import QRCode from 'react-qr-code';
import { History, Calendar, Pill, User as UserIcon, Printer, Share2, ClipboardCheck, Phone, MapPin, Clock, Heart, Edit2, Check, X, Bell, ShoppingCart, Loader2 } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(JSON.parse(localStorage.getItem('pl_current_user') || '{}'));
  const [history, setHistory] = useState<Prescription[]>([]);
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditingCaregiver, setIsEditingCaregiver] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState<{presId: string} | null>(null);
  const [pharmacies, setPharmacies] = useState<User[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [caregiverForm, setCaregiverForm] = useState({
    name: currentUser.caregiverName || '',
    phone: currentUser.caregiverPhone || '',
    relationship: currentUser.caregiverRelationship || ''
  });

  useEffect(() => {
    refreshData();
    setPharmacies(db.getUsersByRole(UserRole.PHARMACY));
  }, [currentUser.id]);

  const refreshData = () => {
    setHistory(db.getPatientPrescriptions(currentUser.id));
    setLogs(db.getDispenseLogsByPatient(currentUser.id));
    setOrders(db.getOrdersByPatient(currentUser.id));
  };

  const handleSaveCaregiver = () => {
    if (!caregiverForm.name || caregiverForm.phone.length < 10) {
      alert("Please provide valid Caregiver name and phone number.");
      return;
    }
    db.updatePatientCaregiver(currentUser.id, caregiverForm.name, caregiverForm.phone, caregiverForm.relationship);
    const updatedUser = db.getUserById(currentUser.id)!;
    setCurrentUser(updatedUser);
    localStorage.setItem('pl_current_user', JSON.stringify(updatedUser));
    setIsEditingCaregiver(false);
  };

  const handlePlaceOrder = () => {
    if (!selectedPharmacy || !showOrderModal) return;
    
    const order: Order = {
      id: `ord_${Date.now()}`,
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientPhone: currentUser.phone,
      pharmacyId: selectedPharmacy,
      prescriptionId: showOrderModal.presId,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };
    
    db.placeOrder(order);
    setShowOrderModal(null);
    refreshData();
    alert("Medicine order placed successfully! The pharmacy will process it shortly.");
  };

  // Helper to get active reminders from prescriptions
  const getReminders = () => {
    const reminders: {medName: string, time: string, label: string}[] = [];
    history.forEach(pres => {
      pres.medicines.forEach(m => {
        if (m.status === 'PENDING') {
          if (m.mrg && m.mrg > 0) reminders.push({ medName: m.name, time: '07:00 AM - 09:00 AM', label: 'Morning' });
          if (m.aft && m.aft > 0) reminders.push({ medName: m.name, time: '12:00 PM - 02:00 PM', label: 'Afternoon' });
          if (m.nyt && m.nyt > 0) reminders.push({ medName: m.name, time: '07:00 PM - 09:00 PM', label: 'Night' });
        }
      });
    });
    return reminders;
  };

  const currentReminders = getReminders();

  return (
    <Layout role={UserRole.PATIENT} userName={currentUser.name}>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {/* Health Vault Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500/20"></div>
             <div className="inline-block p-6 bg-slate-50 rounded-[2.5rem] mb-6 shadow-inner border border-slate-100">
               <QRCode value={currentUser.id} size={180} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">{currentUser.name}</h3>
             <p className="text-slate-400 font-mono text-[10px] mt-2 uppercase tracking-[0.3em] font-bold">Clinical Vault ID: {currentUser.id}</p>
             
             <div className="flex gap-2 mt-8">
               <button onClick={() => window.print()} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-xs uppercase tracking-wider">
                 <Printer size={18} /> Print Card
               </button>
               <button className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs uppercase tracking-wider">
                 <Share2 size={18} /> Share Vault
               </button>
             </div>
          </div>

          {/* Reminders Section */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest mb-6">
              <Bell size={18} className="text-emerald-600" /> Active Dose Reminders
            </h4>
            <div className="space-y-3">
              {currentReminders.length > 0 ? currentReminders.slice(0, 5).map((rem, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                  <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Clock size={16}/></div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 leading-none">{rem.medName}</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 uppercase">{rem.label} ({rem.time})</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 font-bold italic text-center py-4">No active dose schedules found.</p>
              )}
            </div>
          </div>

          {/* Caregiver Section */}
          <div className="bg-emerald-50/50 rounded-[2rem] p-8 border border-emerald-100 relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h4 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
                 <Heart size={18} className="text-emerald-600 fill-emerald-600/10" /> Primary Caregiver
               </h4>
               {!isEditingCaregiver ? (
                 <button onClick={() => setIsEditingCaregiver(true)} className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-colors">
                   <Edit2 size={14} />
                 </button>
               ) : (
                 <div className="flex gap-1">
                    <button onClick={handleSaveCaregiver} className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm border border-emerald-100 hover:bg-emerald-700 transition-colors">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setIsEditingCaregiver(false)} className="p-2 bg-white rounded-xl text-red-500 shadow-sm border border-red-100 hover:bg-red-50 transition-colors">
                      <X size={14} />
                    </button>
                 </div>
               )}
             </div>

             {!isEditingCaregiver ? (
               <div className="space-y-4">
                 <div className="bg-white/80 p-5 rounded-3xl shadow-sm border border-emerald-100">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Caregiver Profile</p>
                   <p className="font-black text-slate-900 text-lg">{currentUser.caregiverName || 'Not Set'}</p>
                   <p className="text-xs text-emerald-700 font-bold opacity-75">{currentUser.caregiverRelationship || 'Relative'}</p>
                   <div className="mt-4 pt-4 border-t border-emerald-50">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Access Phone</p>
                     <p className="font-black text-slate-800 text-xl flex items-center gap-2">
                       <Phone size={18} className="text-emerald-500" /> {currentUser.caregiverPhone || '---'}
                     </p>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="space-y-3">
                   <input className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Full Name" value={caregiverForm.name} onChange={e => setCaregiverForm({...caregiverForm, name: e.target.value})} />
                   <input className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Relationship (e.g. Spouse)" value={caregiverForm.relationship} onChange={e => setCaregiverForm({...caregiverForm, relationship: e.target.value})} />
                   <input className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Phone Number" value={caregiverForm.phone} onChange={e => setCaregiverForm({...caregiverForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold px-1 italic leading-tight">* This caregiver can access your vault in emergencies.</p>
               </div>
             )}
          </div>
        </div>

        {/* Health Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <h3 className="font-black text-3xl text-slate-900 mb-10 flex items-center gap-3 tracking-tight">
              <History className="text-emerald-600" /> Clinical Health Timeline
            </h3>
            
            <div className="space-y-12 relative before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {history.map((pres) => (
                <div key={pres.id} className="relative pl-12">
                  <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-white border-4 border-emerald-500 shadow-md z-10 flex items-center justify-center">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="bg-slate-50/30 rounded-[2.5rem] p-8 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-emerald-100/30 group">
                    <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                          <Calendar size={12} /> {new Date(pres.date).toLocaleDateString()}
                        </span>
                        <h4 className="font-black text-slate-900 text-2xl tracking-tight">Dr. {pres.doctorName}</h4>
                      </div>
                      <div className="flex gap-2">
                        {pres.medicines.some(m => m.status === 'PENDING') && (
                          <button 
                            onClick={() => setShowOrderModal({presId: pres.id})}
                            className="bg-emerald-600 text-white text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            <ShoppingCart size={14}/> Buy Medicines Online
                          </button>
                        )}
                        <span className="bg-white text-slate-400 text-[10px] px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border border-slate-100 shadow-sm">Verified</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {pres.medicines.map((m, i) => {
                        const dispenseLog = logs.find(l => l.prescriptionId === pres.id && l.medicineName === m.name);
                        return (
                          <div key={i} className="flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`p-3 rounded-2xl ${m.status === 'DISPENSED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-400'}`}>
                                <Pill size={24} />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-black text-slate-900 leading-none">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-tight">{m.brand} • {m.mrg}-{m.aft}-{m.nyt}</p>
                              </div>
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                               {m.status === 'DISPENSED' && dispenseLog ? (
                                 <div className="flex flex-col gap-0.5">
                                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                     <MapPin size={10} /> {dispenseLog.pharmacyName}
                                   </span>
                                   <span className="text-[9px] text-slate-400 font-bold">{new Date(dispenseLog.timestamp).toLocaleString()}</span>
                                 </div>
                               ) : (
                                 <div className="flex flex-col gap-0.5">
                                   <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                     <Clock size={10} /> Pending
                                   </span>
                                   <span className="text-[9px] text-slate-400 font-bold italic">At any verified outlet</span>
                                 </div>
                               )}
                               {m.status === 'DISPENSED' && <ClipboardCheck size={18} className="text-emerald-500" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <p className="font-black text-slate-400 uppercase tracking-widest">No clinical timeline found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                 <div>
                   <h3 className="font-black text-xl tracking-tight uppercase">Place Online Order</h3>
                   <p className="text-emerald-100 text-[10px] font-black uppercase opacity-80 mt-1">Select a verified pharmacy</p>
                 </div>
                 <button onClick={() => setShowOrderModal(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Verified Pharmacy Network</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                      value={selectedPharmacy}
                      onChange={e => setSelectedPharmacy(e.target.value)}
                    >
                      <option value="">Select a Pharmacy</option>
                      {pharmacies.map(ph => (
                        <option key={ph.id} value={ph.id}>{ph.name} - {ph.phone}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                   <p className="text-[9px] text-emerald-800 font-black uppercase mb-2">Order Summary</p>
                   <ul className="space-y-1">
                     {history.find(p => p.id === showOrderModal.presId)?.medicines.filter(m => m.status === 'PENDING').map((m, i) => (
                       <li key={i} className="text-xs font-bold text-slate-600 flex justify-between">
                         <span>{m.name}</span>
                         <span>Qty: {m.total || m.quantity}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <button 
                  onClick={handlePlaceOrder}
                  disabled={!selectedPharmacy}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 uppercase tracking-widest text-sm disabled:opacity-50"
                 >
                   Confirm Order Placement
                 </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};
