import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import stockSyncLogo from '@/assets/stocksync-logo.jpg';
import MobileBottomNav from './MobileBottomNav';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ListPlus,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/listings', icon: Package },
  { name: 'Add Item', href: '/listings/new', icon: PlusCircle },
  { name: 'Bulk List', href: '/bulk', icon: ListPlus },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: ShieldCheck },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Single-stack header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={stockSyncLogo} 
                alt="ListPro.AI Logo" 
                className="h-8 w-8 rounded-lg object-cover"
              />
              <div className="hidden sm:block">
                <span className="font-semibold">ListPro.AI</span>
                <p className="text-xs text-muted-foreground">Multi-Platform Inventory</p>
              </div>
            </Link>
          </div>

          {/* Right: Admin + Logout */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5"
            >
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">admin</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 top-14 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:top-0 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content - add bottom padding for mobile nav, extra for landscape */}
        <main className="flex-1 overflow-auto p-4 pb-24 landscape:pb-28 sm:p-6 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
