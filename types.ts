
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  PHARMACY = 'PHARMACY'
}

export enum VerificationStatus {
  PENDING = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  status: VerificationStatus;
  email?: string;
  trialStartDate?: string;
  caregiverPhone?: string;
  caregiverName?: string;
  caregiverRelationship?: string;
}

export interface Medicine {
  name: string;
  brand: string;
  dosage: string; // Keep legacy dosage for backward compatibility
  mrg?: number;
  aft?: number;
  nyt?: number;
  timing?: 'BEFORE_FOOD' | 'AFTER_FOOD';
  days?: number;
  total?: number;
  quantity: number; // Keep for backward compatibility
  status: 'PENDING' | 'DISPENSED';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorPhone: string;
  date: string;
  isEmergency: boolean;
  medicines: Medicine[];
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  pharmacyId: string;
  prescriptionId: string;
  status: 'PENDING' | 'PROCESSED' | 'CANCELLED';
  timestamp: string;
}

export interface EmergencyLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  patientId: string;
  timestamp: string;
}

export interface DispenseLog {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  pharmacyName: string;
  doctorId: string;
  medicineName: string;
  brand: string;
  quantity: number;
  timestamp: string;
  isEmergency: boolean;
  orderId?: string;
}

export interface MedicineInfo {
  name: string;
  safetyStatus: string;
  advantages: string[];
  disadvantages: string[];
}
