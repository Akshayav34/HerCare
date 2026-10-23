import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MedicalHistoryPage } from './pages/history/MedicalHistoryPage';
import { AllergiesPage } from './pages/allergies/AllergiesPage';
import { RecordsPage } from './pages/records/RecordsPage';
import { UploadReportPage } from './pages/records/UploadReportPage';
import { PrescriptionsPage } from './pages/prescriptions/PrescriptionsPage';
import { MedicationsPage } from './pages/medications/MedicationsPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { RemindersPage } from './pages/reminders/RemindersPage';
import { AiAssistantPage } from './pages/ai/AiAssistantPage';
import { NearbyHealthcarePage } from './pages/nearby/NearbyHealthcarePage';
import { EmergencyContactsPage } from './pages/emergency/EmergencyContactsPage';
import { EmergencyCardConfigPage } from './pages/emergency/EmergencyCardConfigPage';
import { QrScannerPage } from './pages/emergency/QrScannerPage';
import { EmergencyViewerPage } from './pages/emergency/EmergencyViewerPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/emergency/:token" element={<EmergencyViewerPage />} />
      </Route>

      {/* Authenticated Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/medical-history" element={<MedicalHistoryPage />} />
        <Route path="/allergies" element={<AllergiesPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/upload" element={<UploadReportPage />} />
        <Route path="/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/ai-assistant" element={<AiAssistantPage />} />
        <Route path="/nearby" element={<NearbyHealthcarePage />} />
        <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
        <Route path="/emergency-card" element={<EmergencyCardConfigPage />} />
        <Route path="/qr-scanner" element={<QrScannerPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
