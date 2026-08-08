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
import { Menu, ArrowLeft } from 'lucide-react';

interface MainLayoutProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
}

export default function MainLayout({ user, setUser }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'mylinks' | 'profile' | 'notifications' | 'explore' | 'leaderboard'>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackFromProfile = () => {
    setSelectedUserId(null);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedUserId(null); // Reset selected user when changing views from sidebar
        }}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-50 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center">
              {selectedUserId ? (
                <>
                  <button 
                    onClick={handleBackFromProfile}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-slate-800" />
                  </button>
                  <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                    User Profile
                  </h1>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Menu className="w-6 h-6 text-slate-800" />
                  </button>
                  {currentView === 'profile' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                      Profile
                    </h1>
                  ) : currentView === 'notifications' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                      Notifications
                    </h1>
                  ) : currentView === 'explore' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                      Explore
                    </h1>
                  ) : currentView === 'leaderboard' ? (
                    <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                      Leaderboard
                    </h1>
                  ) : (
                    <div className="flex items-center ml-2">
                      <img src="/logo.png?v=6" alt="Logo" className="w-8 h-8 rounded-lg bg-[#1e1b4b] p-0.5" />
                      <h1 className="ml-2 text-xl font-bold tracking-tight text-[#1e1b4b]">
                        AD Runner
                      </h1>
                    </div>
                  )}
                </>
              )}
            </div>
            {!selectedUserId && currentView !== 'profile' && currentView !== 'notifications' && currentView !== 'explore' && currentView !== 'leaderboard' && <span className="text-[#1e1b4b] font-bold text-lg">Adsterra</span>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-3xl mx-auto">
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
          ) : (
            <Profile user={user} />
          )}
        </main>
      </div>
    </div>
  );
}
