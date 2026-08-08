import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  X, 
  Home, 
  Link as LinkIcon, 
  Compass, 
  User, 
  BarChart2, 
  Settings, 
  Megaphone,
  Bell,
  LogOut,
  Trophy
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile;
  currentView: string;
  setCurrentView: (view: 'feed' | 'mylinks' | 'profile' | 'notifications' | 'explore' | 'leaderboard') => void;
}

export default function Sidebar({ isOpen, setIsOpen, user, currentView, setCurrentView }: SidebarProps) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home, view: 'feed' },
    { id: 'mylinks', label: 'My Links', icon: LinkIcon, view: 'mylinks' },
    { id: 'notifications', label: 'Notifications', icon: Bell, view: 'notifications' },
    { id: 'explore', label: 'Explore', icon: Compass, view: 'explore' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, view: 'leaderboard' },
    { id: 'profile', label: 'Profile', icon: User, view: 'profile' },
    { id: 'stats', label: 'Stats', icon: BarChart2, view: 'feed' },
    { id: 'settings', label: 'Settings', icon: Settings, view: 'feed' },
    { id: 'campaign', label: 'Campaign', icon: Megaphone, view: 'feed' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-[#1e1b4b] text-white p-6 relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-6">
            <img src="/logo.png?v=6" alt="Logo" className="w-10 h-10 rounded-xl bg-[#1e1b4b] p-1" />
            <span className="font-bold text-xl tracking-tight">AD Runner</span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user.name}</h2>
              <div className="flex space-x-3 text-sm text-indigo-200 mt-1">
                <span><strong className="text-white">{user.followers}</strong> Followers</span>
                <span><strong className="text-white">{user.following}</strong> Following</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.view as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  currentView === item.view && item.view === item.id
                    ? 'bg-indigo-50 text-indigo-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.view && item.view === item.id ? 'text-indigo-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
