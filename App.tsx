
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { PharmacyDashboard } from './pages/PharmacyDashboard';
import { UserRole } from './types';
import { Activity, ShieldCheck, HeartPulse, Pill, Users } from 'lucide-react';

const DashboardRouter = () => {
  const userStr = localStorage.getItem('pl_current_user');
  if (!userStr) return <Navigate to="/" replace />;
  
  try {
    const user = JSON.parse(userStr);
    switch (user.role) {
      case UserRole.ADMIN: return <AdminDashboard />;
      case UserRole.DOCTOR: return <DoctorDashboard />;
      case UserRole.PATIENT: return <PatientDashboard />;
      case UserRole.PHARMACY: return <PharmacyDashboard />;
      default: return <Navigate to="/" replace />;
    }
  } catch (e) {
    localStorage.removeItem('pl_current_user');
    return <Navigate to="/" replace />;
  }
};

const Home = () => (
  <div className="min-h-screen bg-medical-pattern flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-4xl w-full">
      <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl mb-12 border-b-4 border-blue-800">
        <Activity size={32} />
        <span className="text-3xl font-black tracking-tight">PharmaLync</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight drop-shadow-sm">Digital Prescriptions <br/> <span className="text-blue-600">Safe & Secure.</span></h1>
      <p className="text-slate-500 text-lg mb-12 font-medium max-w-2xl mx-auto">The secure bridge for modern healthcare, connecting doctors, patients, and pharmacies through one verified clinical network.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { role: 'admin', label: 'Admin', icon: ShieldCheck, color: 'blue' },
          { role: 'doctor', label: 'Doctor', icon: HeartPulse, color: 'blue' },
          { role: 'patient', label: 'Patient', icon: Users, color: 'emerald' },
          { role: 'pharmacy', label: 'Pharmacy', icon: Pill, color: 'indigo' },
        ].map((item) => (
          <Link 
            key={item.role} 
            to={`/login/${item.role}`}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:scale-105 transition-all flex flex-col items-center group"
          >
            <div className={`w-16 h-16 rounded-3xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-4 group-hover:bg-${item.color}-600 group-hover:text-white transition-colors shadow-inner`}>
              <item.icon size={32} />
            </div>
            <span className="font-black text-slate-800 uppercase tracking-widest text-xs">{item.label} Portal</span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;