import { Routes, Route, Navigate } from 'react-router-dom';
import { Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from './context/useAuth';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminTables from './pages/AdminTables';
import AdminStaff from './pages/AdminStaff';
import Tables from './pages/Tables';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Inventory from './pages/Inventory';
import Cafe from './pages/Cafe';
import CafeOrderDetail from './pages/CafeOrderDetail';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'super_admin' ? children : <Navigate to="/" replace />;
}

function StaffRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'super_admin' ? <Navigate to="/admin" replace /> : children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return <Navigate to={user.role === 'super_admin' ? '/admin' : '/'} replace />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'super_admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <TablesRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <AdminRoute>
            <AdminStaff />
          </AdminRoute>
        }
      />
      {/* Session routes */}
      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/cafe/orders/:id" element={<StaffRoute><CafeOrderDetail /></StaffRoute>} />
      {/* Placeholder routes for remaining sidebar navigation */}
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/cafe" element={<StaffRoute><Cafe /></StaffRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function TablesRouter() {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? <AdminTables /> : <Tables />;
}

function PlaceholderPage({ title, icon: IconComponent }) {
  return (
    <div className="bg-background min-h-screen md:ml-[240px] pt-16 p-4 md:p-gutter flex items-center justify-center">
      <div className="bg-paper rounded-card p-xl border border-outline-variant/20 text-center">
        <IconComponent size={48} strokeWidth={1.5} className="text-on-surface-variant mb-md mx-auto" />
        <h1 className="font-title text-title text-on-surface mb-xs">{title}</h1>
        <p className="font-body text-body text-on-surface-variant">Coming soon</p>
      </div>
    </div>
  );
}
