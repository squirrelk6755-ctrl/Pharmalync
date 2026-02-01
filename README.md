# PharmaLync 💊🔗  
**Secure Digital Prescription & Medicine Verification System**

PharmaLync is a healthcare web application that replaces **paper-based prescriptions** with a **secure, digital, and verifiable workflow**, ensuring the **right patient gets the right medicine at the right time**.

🔗 **Live Deployment:** https://pharmalync.onrender.com/

---

## 🚨 Problem
Healthcare systems still rely heavily on **paper prescriptions** and **disconnected processes**, which leads to:

- Prescription misuse, loss, and duplication  
- Fake or expired medicines entering circulation  
- No complete medicine history for patients  
- Unsafe medicine collection for elderly patients  
- Delays and confusion during emergencies  

These gaps result in **medication errors, fraud, and lack of trust** in the healthcare ecosystem.

---

## 💡 Solution
PharmaLync replaces physical prescriptions with a **secure digital workflow** connecting **doctors, patients, pharmacies, and caregivers**.

### How it works:
- Doctors issue **digital prescriptions** to verified patient profiles  
  *(future-ready for Aadhaar / Gov-ID integration)*  
- Patients can authorize **family members or caregivers** to collect medicines on their behalf  
- Pharmacies dispense medicines only after **dual verification**:
  - ✅ Patient / Caregiver QR Code  
  - ✅ Medicine QR Code  
- An **intelligent safety engine** checks:
  - Misuse  
  - Expiry  
  - Dosage conflicts  
- **Emergency Mode** allows instant medicine access while maintaining audit logs  

✅ This ensures **accuracy, safety, and trust — without paper**.

---

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- QR Scanner (Web Camera API)

### Backend
- Node.js
- Express.js
- TypeScript
- JWT Authentication
- Role-Based Access Control (RBAC)

### Database
- PostgreSQL (Supabase) **or** MongoDB  
  *(Stores prescriptions, scans, consent & audit logs)*

### AI / Intelligence Layer
- No external APIs
- Rule-based safety engine for misuse detection

### Deployment
- Frontend: Vercel  
- Backend: Render  

---

## ⭐ USP (Unique Selling Point)

### PharmaLync vs Existing Solutions
- Unified **digital prescription + secure verification**
- **Dual QR verification** at pharmacy (patient + medicine)
- Built-in **caregiver authorization**
- **Emergency Mode** that never blocks treatment
- Intelligent safety logic *(AI-based rules, no external APIs)*
- Complete and auditable **medicine history**
- Simple, scalable, and easy to deploy

### Innovation Highlights
- Dual-scan verification at pharmacy  
- Caregiver-based medicine collection  
- Emergency Mode with audit trail  
- Intelligent safety engine (AI logic, no APIs)  
- Future-ready for national integration  
- PharmaLync doesn’t just digitize prescriptions —  
  **it rebuilds trust in medicine delivery**

---

## 🧪 Run Locally
```bash
npm install
npm run dev
