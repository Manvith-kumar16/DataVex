import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { LayoutDashboard, LogOut, Zap, History, GitCompareArrows, Sun, Moon, Compass, Camera } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/compare', label: 'Compare', icon: GitCompareArrows },
  { path: '/history', label: 'History', icon: History },
];

export function Sidebar() {
  const { user, logout, updateProfilePic } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col hidden lg:flex z-30 transition-all duration-300 shadow-[20px_0_40px_-20px_hsl(var(--accent)/0.15)]">
      <div className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-foreground/5 flex items-center justify-center shadow-accent overflow-hidden group-hover:scale-110 transition-transform duration-300 border border-accent/30">
            <img src="/favicon.ico" alt="Datavex.ai Logo" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <span className="text-lg font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Datavex.ai</span>
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase font-medium opacity-70">Enterprise Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-accent rounded-r-full" />
              )}
              <item.icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/20 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all group"
        >
          <div className="relative h-4 w-4">
            <Sun className={`h-4 w-4 absolute transition-all duration-500 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
            <Moon className={`h-4 w-4 absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'}`} />
          </div>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="px-2 py-2">
          <div className="flex items-center gap-3 p-2 group relative overflow-hidden">
            <div
              className="relative h-10 w-10 rounded-xl overflow-hidden cursor-pointer group/avatar"
              onClick={handleProfileClick}
            >
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 z-40">
      <div className="flex items-center gap-3" onClick={() => navigate('/dashboard')}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent-foreground/10 flex items-center justify-center shadow-lg shadow-accent/5 border border-accent/20">
          <img src="/favicon.ico" alt="Datavex.ai Logo" className="h-5 w-5 object-contain" />
        </div>
        <span className="font-display font-bold text-base tracking-tight">Datavex.ai</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
        >
          <Sun className={`h-4 w-4 absolute transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
          <Moon className={`h-4 w-4 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'}`} />
        </button>
        <div
          className="h-9 w-9 rounded-xl overflow-hidden border border-border/50 shadow-sm"
          onClick={() => navigate('/dashboard')}
        >
          {user?.profilePic ? (
            <img src={user.profilePic} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
