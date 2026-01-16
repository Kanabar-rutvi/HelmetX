import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  HardHat, 
  MapPin, 
  Clock, 
  FileText, 
  Settings, 
  Activity,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  role: 'worker' | 'supervisor' | 'admin';
}

const Layout = ({ children, role }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => 
    location.pathname === path 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50';

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer font-medium ${isActive(path)}`} 
      onClick={() => {
        navigate(path);
        setIsMobileMenuOpen(false);
      }}
    >
      <Icon size={20} strokeWidth={2} /> 
      <span>{label}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-0 z-40 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col w-72 transform transition-transform duration-300 border-r border-slate-200 dark:border-slate-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
             <div className="bg-blue-600 p-2 rounded-lg">
                <HardHat className="text-white" size={24} />
             </div>
             <span className="bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
               SmartSafe
             </span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-800 dark:hover:text-white">
             <X size={24} />
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Menu</div>
          
          {role === 'admin' && (
            <>
              <NavItem path="/admin" icon={LayoutDashboard} label="Dashboard" />
              <NavItem path="/admin/users" icon={Users} label="User Management" />
              <NavItem path="/admin/devices" icon={HardHat} label="Device Management" />
              <NavItem path="/admin/sites" icon={MapPin} label="Site & Geo-fencing" />
              <NavItem path="/admin/attendance" icon={Clock} label="Shift & Attendance" />
              <NavItem path="/admin/alerts" icon={ShieldAlert} label="Alerts & Incidents" />
              <NavItem path="/admin/reports" icon={FileText} label="Analytics & Reports" />
              <NavItem path="/admin/audit" icon={Activity} label="Audit Logs" />
              <NavItem path="/admin/settings" icon={Settings} label="System Settings" />
            </>
          )}
          
          {role === 'supervisor' && (
            <>
              <NavItem path="/supervisor" icon={LayoutDashboard} label="Monitor" />
              <NavItem path="/supervisor/safety" icon={ShieldAlert} label="Safety" />
              <NavItem path="/supervisor/attendance" icon={Clock} label="Attendance" />
              <NavItem path="/supervisor/dpr-approval" icon={FileText} label="DPR Approval" />
              <NavItem path="/supervisor/materials-approval" icon={Users} label="Materials" />
            </>
          )}
          
          {role === 'worker' && (
            <>
              <NavItem path="/worker" icon={LayoutDashboard} label="Dashboard" />
              <NavItem path="/worker/attendance" icon={Clock} label="Attendance" />
              <NavItem path="/worker/tasks" icon={Activity} label="My Tasks" />
              <NavItem path="/worker/materials" icon={Users} label="Request Materials" />
              <NavItem path="/worker/dpr" icon={FileText} label="Submit DPR" />
            </>
          )}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/50 px-3">
             <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white transition-all duration-200"
             >
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
             </button>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200 mt-2"
             >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
             </button>
          </div>
        </nav>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize font-medium">{role}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900">
         {/* Mobile Header */}
         <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-20">
             <div className="flex items-center gap-2">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 dark:text-slate-300 p-1">
                     <Menu size={24} />
                 </button>
                 <span className="font-bold text-slate-800 dark:text-white">SmartSafe</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                 {user?.name?.[0] || 'U'}
             </div>
         </div>

         <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            {children}
         </main>
      </div>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
