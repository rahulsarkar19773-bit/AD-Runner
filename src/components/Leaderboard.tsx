import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, Heart } from 'lucide-react';

interface LeaderboardProps {
  user: UserProfile;
  onUserClick?: (userId: string) => void;
}

export default function Leaderboard({ user, onUserClick }: LeaderboardProps) {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('likesReceived', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          users.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        setTopUsers(users);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e1b4b]"></div>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return <Medal className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400 fill-slate-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return <span className="text-lg font-bold text-slate-400 w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#2e2b5b] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold">Top Influencers</h2>
          </div>
          <p className="text-indigo-200">The most liked users in the AD Runner community</p>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {topUsers.map((topUser, index) => (
            <div 
              key={topUser.uid} 
              className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-50 ${topUser.uid === user.uid ? 'bg-indigo-50/50' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8">
                  {getRankBadge(index)}
                </div>
                
                <button 
                  onClick={() => onUserClick?.(topUser.uid)}
                  className="relative block shrink-0"
                >
                  {topUser.photoURL ? (
                    <img src={topUser.photoURL} alt={topUser.name} className="w-12 h-12 rounded-full object-cover bg-slate-100 p-0.5" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {topUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {index < 3 && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <div className="w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  )}
                </button>
                
                <div className="flex flex-col text-left">
                  <button 
                    onClick={() => onUserClick?.(topUser.uid)}
                    className="font-bold text-slate-800 hover:underline text-left truncate max-w-[120px] sm:max-w-[200px]"
                  >
                    {topUser.name}
                    {topUser.uid === user.uid && <span className="ml-2 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">You</span>}
                  </button>
                  <span className="text-sm text-slate-500">
                    {topUser.followers || 0} followers
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1.5 bg-rose-50 px-3 py-1.5 rounded-xl">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="font-bold text-rose-600">{topUser.likesReceived || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {topUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No users found in the leaderboard yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
