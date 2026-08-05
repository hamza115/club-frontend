import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import DashboardTab from '../components/reports/DashboardTab';
import RevenueTab from '../components/reports/RevenueTab';
import SessionTab from '../components/reports/SessionTab';
import TableUsageTab from '../components/reports/TableUsageTab';
import CafeSalesTab from '../components/reports/CafeSalesTab';
import InventoryTab from '../components/reports/InventoryTab';
import ExpenseTab from '../components/reports/ExpenseTab';
import ProfitTab from '../components/reports/ProfitTab';
import CustomerTab from '../components/reports/CustomerTab';
import PaymentTab from '../components/reports/PaymentTab';
import DailyClosingTab from '../components/reports/DailyClosingTab';
import InsightsTab from '../components/reports/InsightsTab';
import {
  LayoutDashboard,
  TrendingUp,
  Timer,
  UtensilsCrossed,
  Coffee,
  Package,
  CreditCard,
  Landmark,
  Users,
  Wallet,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', LucideIcon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue', icon: 'trending_up', LucideIcon: TrendingUp },
  { key: 'sessions', label: 'Sessions', icon: 'timer', LucideIcon: Timer },
  { key: 'table-usage', label: 'Table Usage', icon: 'table_restaurant', LucideIcon: UtensilsCrossed },
  { key: 'cafe-sales', label: 'Cafe Sales', icon: 'coffee', LucideIcon: Coffee },
  { key: 'inventory', label: 'Inventory', icon: 'inventory_2', LucideIcon: Package },
  { key: 'expense', label: 'Expenses', icon: 'payments', LucideIcon: CreditCard },
  { key: 'profit', label: 'Profit', icon: 'account_balance', LucideIcon: Landmark },
  { key: 'customer', label: 'Customers', icon: 'group', LucideIcon: Users },
  { key: 'payment', label: 'Payments', icon: 'credit_card', LucideIcon: Wallet },
  { key: 'daily-closing', label: 'Daily Closing', icon: 'task_alt', LucideIcon: CheckCircle2 },
  { key: 'insights', label: 'Insights', icon: 'lightbulb', LucideIcon: Lightbulb },
];

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  revenue: RevenueTab,
  sessions: SessionTab,
  'table-usage': TableUsageTab,
  'cafe-sales': CafeSalesTab,
  inventory: InventoryTab,
  expense: ExpenseTab,
  profit: ProfitTab,
  customer: CustomerTab,
  payment: PaymentTab,
  'daily-closing': DailyClosingTab,
  insights: InsightsTab,
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-title text-headline text-on-surface">Reports & Analytics</h1>
          <p className="font-body text-body text-on-surface-variant mt-1">Comprehensive business insights and reporting</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mb-6 -mx-4 md:-mx-gutter px-4 md:px-gutter overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max pb-2">
          {TABS.map(tab => {
            const TabIcon = tab.LucideIcon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-item-title text-item-title whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <TabIcon size={18} strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <ActiveComponent />
    </AppLayout>
  );
}
