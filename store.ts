
import { User, UserRole, VerificationStatus, Prescription, DispenseLog, Order, EmergencyLog } from './types';

const INITIAL_USERS: User[] = [
  { 
    id: 'admin_1', 
    phone: '1112223334', 
    name: 'System Admin', 
    role: UserRole.ADMIN, 
    status: VerificationStatus.VERIFIED 
  },
  { 
    id: 'patient_1', 
    phone: '9876543210', 
    name: 'John Doe', 
    role: UserRole.PATIENT, 
    status: VerificationStatus.VERIFIED, 
    caregiverPhone: '9000000000',
    caregiverName: 'Mary Doe',
    caregiverRelationship: 'Spouse'
  }
];

class DBStore {
  private users: User[] = [];
  private prescriptions: Prescription[] = [];
  private dispenseLogs: DispenseLog[] = [];
  private orders: Order[] = [];
  private emergencyLogs: EmergencyLog[] = [];

  constructor() {
    const savedUsers = localStorage.getItem('pl_users');
    const savedPrescriptions = localStorage.getItem('pl_prescriptions');
    const savedLogs = localStorage.getItem('pl_logs');
    const savedOrders = localStorage.getItem('pl_orders');
    const savedEmergencyLogs = localStorage.getItem('pl_emergency_logs');

    this.users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    this.prescriptions = savedPrescriptions ? JSON.parse(savedPrescriptions) : [];
    this.dispenseLogs = savedLogs ? JSON.parse(savedLogs) : [];
    this.orders = savedOrders ? JSON.parse(savedOrders) : [];
    this.emergencyLogs = savedEmergencyLogs ? JSON.parse(savedEmergencyLogs) : [];
  }

  private save() {
    localStorage.setItem('pl_users', JSON.stringify(this.users));
    localStorage.setItem('pl_prescriptions', JSON.stringify(this.prescriptions));
    localStorage.setItem('pl_logs', JSON.stringify(this.dispenseLogs));
    localStorage.setItem('pl_orders', JSON.stringify(this.orders));
    localStorage.setItem('pl_emergency_logs', JSON.stringify(this.emergencyLogs));
  }

  getUsersByRole(role: UserRole) {
    return this.users.filter(u => u.role === role);
  }

  getUserByPhone(phone: string) {
    return this.users.find(u => u.phone === phone);
  }

  getPatientByPhoneOrCaregiverPhone(phone: string): User | undefined {
    return this.users.find(u => 
      u.role === UserRole.PATIENT && (u.phone === phone || u.caregiverPhone === phone)
    );
  }

  getUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  registerProfessional(phone: string, name: string, role: UserRole, email: string) {
    if (this.getUserByPhone(phone)) return null;
    const newUser: User = {
      id: `${role.toLowerCase()}_${Date.now()}`,
      phone,
      name,
      role,
      status: VerificationStatus.PENDING,
      email
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  findOrCreatePatient(phone: string): User {
    let user = this.getPatientByPhoneOrCaregiverPhone(phone);
    if (!user) {
      user = {
        id: `p_${Date.now()}`,
        phone,
        name: `Patient ${phone.slice(-4)}`,
        role: UserRole.PATIENT,
        status: VerificationStatus.VERIFIED,
        caregiverPhone: '9999999999',
        caregiverName: 'Default Caregiver',
        caregiverRelationship: 'Family'
      };
      this.users.push(user);
      this.save();
    }
    return user;
  }

  updatePatientCaregiver(patientId: string, name: string, phone: string, relationship: string) {
    const user = this.users.find(u => u.id === patientId && u.role === UserRole.PATIENT);
    if (user) {
      user.caregiverName = name;
      user.caregiverPhone = phone;
      user.caregiverRelationship = relationship;
      this.save();
    }
  }

  verifyUser(userId: string, status: VerificationStatus) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      if (status === VerificationStatus.VERIFIED) {
        user.trialStartDate = new Date().toISOString();
      }
      this.save();
    }
  }

  addPrescription(prescription: Prescription) {
    this.prescriptions.unshift(prescription);
    this.save();
  }

  getPatientPrescriptions(patientId: string) {
    return this.prescriptions.filter(p => p.patientId === patientId);
  }

  getPrescriptionById(id: string) {
    return this.prescriptions.find(p => p.id === id);
  }

  dispenseMedicine(log: DispenseLog) {
    const exists = this.dispenseLogs.find(l => l.prescriptionId === log.prescriptionId && l.medicineName === log.medicineName);
    if (exists) return;

    this.dispenseLogs.unshift(log);
    const pres = this.prescriptions.find(p => p.id === log.prescriptionId);
    if (pres) {
      const med = pres.medicines.find(m => m.name === log.medicineName);
      if (med) {
        med.status = 'DISPENSED';
      }
    }
    
    // If it was an online order, mark it as processed
    if (log.orderId) {
      const order = this.orders.find(o => o.id === log.orderId);
      if (order) order.status = 'PROCESSED';
    }

    this.save();
  }

  getDispenseLogsByPatient(patientId: string) {
    return this.dispenseLogs.filter(l => l.patientId === patientId);
  }

  placeOrder(order: Order) {
    this.orders.unshift(order);
    this.save();
  }

  getOrdersByPharmacy(pharmacyId: string) {
    return this.orders.filter(o => o.pharmacyId === pharmacyId);
  }

  getOrdersByPatient(patientId: string) {
    return this.orders.filter(o => o.patientId === patientId);
  }

  logEmergencyAccess(log: EmergencyLog) {
    this.emergencyLogs.unshift(log);
    this.save();
  }

  getEmergencyLogs() {
    return this.emergencyLogs;
  }
}

export const db = new DBStore();
