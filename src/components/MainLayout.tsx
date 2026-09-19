import logoUrl from "../assets/logo.png";
import { useState } from 'react';
import { UserProfile } from '../types';
import Sidebar from './Sidebar';
import Feed from './Feed';
import MyLinks from './MyLinks';
import Profile from './Profile';
import Notifications from './Notifications';
import Explore from './Explore';
import PublicProfile from './PublicProfile';
import Leaderboard from './Leaderboard';
import AdsterraDashboard from './AdsterraDashboard';
import Shop from './Shop';
import { Menu, ArrowLeft, Home, Trophy, ShoppingCart, Megaphone } from 'lucide-react';

interface MainLayoutProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
}

export default function MainLayout({ user, setUser }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'mylinks' | 'profile' | 'notifications' | 'explore' | 'leaderboard' | 'adsterra' | 'shop'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackFromProfile = () => {
    setSelectedUserId(null);
  };

  return (
    <div className="relative min-h-screen bg-[#0c0a20] text-white flex flex-col">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
        currentView={currentView as any}
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedUserId(null);
        }}
      />
      
      <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto w-full pb-20">
        <header className="bg-[#0c0a20]/90 backdrop-blur-md sticky top-0 z-20 border-b border-indigo-950">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center">
              {selectedUserId ? (
                <>
                  <button 
                    onClick={handleBackFromProfile}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </button>
                  <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                    User Profile
                  </h1>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Menu className="w-6 h-6 text-white" />
                  </button>
                  {currentView === 'profile' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Profile
                    </h1>
                  ) : currentView === 'notifications' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Notifications
                    </h1>
                  ) : currentView === 'explore' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Explore
                    </h1>
                  ) : currentView === 'leaderboard' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Leaderboard
                    </h1>
                  ) : currentView === 'adsterra' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Adsterra
                    </h1>
                  ) : currentView === 'shop' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      Shop
                    </h1>
                  ) : currentView === 'mylinks' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                      My Links
                    </h1>
                  ) : (
                    <div className="flex items-center ml-2">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-[-30%] rounded-full bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] blur-sm opacity-40 animate-[spin_3s_linear_infinite]"></div>
                        <div className="absolute inset-0 rounded-lg overflow-hidden shadow-sm">
                          <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite]"></div>
                        </div>
                        <div className="absolute inset-[1px] bg-[#18153b] rounded-lg z-10 flex items-center justify-center"></div>
                        <img src={logoUrl} alt="Logo" className="relative z-20 w-6 h-6 object-contain" />
                      </div>
                      <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
                        AD Runner
                      </h1>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-indigo-950/80 px-3 py-1.5 rounded-full border border-indigo-900/60">
              <span className="text-xs font-bold text-emerald-400">$0.01/tdy</span>
              <span className="text-xs text-indigo-400">|</span>
              <span className="text-xs font-bold text-cyan-400">$0.11</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {selectedUserId ? (
            <PublicProfile userId={selectedUserId} onBack={handleBackFromProfile} />
          ) : currentView === 'feed' ? (
            <Feed user={user} onUserClick={handleUserClick} />
          ) : currentView === 'mylinks' ? (
            <MyLinks user={user} />
          ) : currentView === 'notifications' ? (
            <Notifications user={user} />
          ) : currentView === 'explore' ? (
            <Explore user={user} onUserClick={handleUserClick} />
          ) : currentView === 'leaderboard' ? (
            <Leaderboard user={user} onUserClick={handleUserClick} />
          ) : currentView === 'adsterra' ? (
            <AdsterraDashboard user={user} />
          ) : currentView === 'shop' ? (
            <Shop user={user} />
          ) : (
            <Profile user={user} />
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar matching video */}
      <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 bg-[#12102a]/95 backdrop-blur-lg border-t border-indigo-950 py-2.5 px-6 z-40 flex justify-around items-center max-w-lg mx-auto rounded-t-3xl shadow-2xl">
        <button 
          onClick={() => { setCurrentView('feed'); setSelectedUserId(null); }}
          className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'feed' && !selectedUserId ? 'text-cyan-400' : 'text-indigo-300 hover:text-white'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button 
          onClick={() => { setCurrentView('leaderboard'); setSelectedUserId(null); }}
          className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'leaderboard' ? 'text-cyan-400' : 'text-indigo-300 hover:text-white'}`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-bold">Leaderboard</span>
        </button>

        <button 
          onClick={() => { setCurrentView('shop'); setSelectedUserId(null); }}
          className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'shop' ? 'text-cyan-400' : 'text-indigo-300 hover:text-white'}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Shop</span>
        </button>

        <button 
          onClick={() => { setCurrentView('adsterra'); setSelectedUserId(null); }}
          className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'adsterra' ? 'text-cyan-400' : 'text-indigo-300 hover:text-white'}`}
        >
          <Megaphone className="w-5 h-5" />
          <span className="text-[10px] font-bold">Adsterra</span>
        </button>
      </nav>
    </div>
  );
}
