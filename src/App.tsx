import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SupportProvider } from './context/SupportContext';
import ProtectedRoute from './components/ProtectedRoute';
import ApiStatusBanner from './components/ApiStatusBanner';

import HeroSection from './features/marketplace/HeroSection';
import LoginForm from './features/auth/components/login-form';
import RegisterForm from './features/auth/components/register-form';
import ForgetPasswordForm from './features/auth/components/forgot-password-form';
import VerifyOtpForm from './features/auth/components/otp-form';
import ResetPasswordForm from './features/auth/components/ResetPassword';
import Marketplace from './features/marketplace/MarketPlace';
import DeviceDetailsPage from './features/marketplace/pages/device-details-page';
import ToastNotification from './features/marketplace/ToastNotification';
import CheckoutPage from './features/marketplace/pages/CheckoutPage';
import SellDevice from './features/marketplace/SellDevices';
import AboutPage from './features/marketplace/AboutPage';
import AdminDashboard from './features/dashboard/admin/AdminDashboard';
import TechnicianPage from './pages/TechnicianPage';
import FinancePage from './pages/FinancePage';
import CustomerProfile from './pages/CustomerProfile';
import AgentDashboard from './features/dashboard/agent/AgentDashboard';

function App() {
  return (
    <AuthProvider>
      <SupportProvider>
      <CartProvider>
        <ApiStatusBanner />
        <ToastNotification />
        <Routes>
          {/* Public routes */}
          <Route path='/'                element={<HeroSection />} />
          <Route path='/login'           element={<LoginForm />} />
          <Route path='/register'        element={<RegisterForm />} />
          <Route path='/forget-password' element={<ForgetPasswordForm />} />
          <Route path='/VerifyOtpForm'   element={<VerifyOtpForm />} />
          <Route path='/ResetPassword'   element={<ResetPasswordForm />} />
          <Route path='/marketplace'     element={<Marketplace />} />
          <Route path='/marketplace/:id' element={<DeviceDetailsPage />} />
          <Route path='/Sell-Your-Device' element={<SellDevice />} />
          <Route path='/checkout'        element={<CheckoutPage />} />
          <Route path='/about'           element={<AboutPage />} />

          {/* Protected — role-gated dashboard routes */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/technician'
            element={
              <ProtectedRoute role="technician">
                <TechnicianPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/finance'
            element={
              <ProtectedRoute role="finance">
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute role="customer">
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/agent'
            element={
              <ProtectedRoute role="agent">
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </CartProvider>
      </SupportProvider>
    </AuthProvider>
  );
}

export default App;
