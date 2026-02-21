import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Zap, History, GitCompareArrows } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/compare', label: 'Compare', icon: GitCompareArrows },
  { path: '/history', label: 'History', icon: History },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex-col hidden lg:flex z-30">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span className="text-base font-display font-bold tracking-tight">VexIntel</span>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Enterprise Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 text-accent border-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.role || 'User'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-accent" />
        <span className="font-display font-bold text-sm">VexIntel</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-xs text-muted-foreground hover:text-foreground">
          <LayoutDashboard className="h-4 w-4" />
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
