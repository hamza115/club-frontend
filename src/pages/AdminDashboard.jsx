import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { CircleDot, Users, Settings, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import AppLayout from '../components/AppLayout';
import Toast from '../components/Toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    try {
      const [tablesRes, staffRes] = await Promise.all([
        api.get('/tables'),
        api.get('/users'),
      ]);
      setTables(tablesRes.data.data.tables || []);
      setStaff(staffRes.data.data.users || []);
    } catch {
      setTables([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const org = user?.organization || {};
  const available = tables.filter((t) => t.status === 'available').length;
  const occupied = tables.filter((t) => t.status === 'occupied').length;
  const managers = staff.filter((s) => s.role === 'manager').length;
  const cashiers = staff.filter((s) => s.role === 'cashier').length;

  return (
    <AppLayout>
      <Toast message={toast} type="success" />

      {/* Org Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="font-headline text-headline-mobile md:text-headline text-on-background">Admin Dashboard</h2>
        <p className="font-body text-body text-on-surface-variant mt-1">
          {org.name || 'Your Organization'} — {org.orgId || '—'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-paper rounded-xl p-card-padding-sm flex flex-col justify-between h-24 md:h-28">
          <span className="font-caption text-caption text-secondary">Total Tables</span>
          <span className="font-title text-title text-primary">{tables.length}</span>
        </div>
        <div className="bg-paper rounded-xl p-card-padding-sm flex flex-col justify-between h-24 md:h-28">
          <span className="font-caption text-caption text-secondary">Available</span>
          <span className="font-title text-title text-good">{available}</span>
        </div>
        <div className="bg-paper rounded-xl p-card-padding-sm flex flex-col justify-between h-24 md:h-28">
          <span className="font-caption text-caption text-secondary">Occupied</span>
          <span className="font-title text-title text-data">{occupied}</span>
        </div>
        <div className="bg-paper rounded-xl p-card-padding-sm flex flex-col justify-between h-24 md:h-28">
          <span className="font-caption text-caption text-secondary">Staff</span>
          <span className="font-title text-title text-primary">{staff.length}</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/tables"
          className="bg-surface rounded-[18px] p-4 md:p-5 border border-outline-variant/20 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <CircleDot size={20} strokeWidth={1.8} />
            </div>
            <h3 className="font-item-title text-item-title text-on-surface">Tables</h3>
            <ArrowRight size={20} strokeWidth={1.8} className="text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="font-caption text-caption text-on-surface-variant">{tables.length} tables • {available} available</p>
        </Link>

        <Link
          to="/staff"
          className="bg-surface rounded-[18px] p-4 md:p-5 border border-outline-variant/20 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-data-tint flex items-center justify-center text-data">
              <Users size={20} strokeWidth={1.8} />
            </div>
            <h3 className="font-item-title text-item-title text-on-surface">Staff</h3>
            <ArrowRight size={20} strokeWidth={1.8} className="text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="font-caption text-caption text-on-surface-variant">{staff.length} members • {managers} managers • {cashiers} cashiers</p>
        </Link>

        <Link
          to="/settings"
          className="bg-surface rounded-[18px] p-4 md:p-5 border border-outline-variant/20 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-warn-tint flex items-center justify-center text-warn">
              <Settings size={20} strokeWidth={1.8} />
            </div>
            <h3 className="font-item-title text-item-title text-on-surface">Settings</h3>
            <ArrowRight size={20} strokeWidth={1.8} className="text-on-surface-variant ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="font-caption text-caption text-on-surface-variant">Organization settings & preferences</p>
        </Link>
      </div>
    </AppLayout>
  );
}
