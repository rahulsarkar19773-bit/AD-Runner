import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { collection, query, getDocs, limit, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Check } from 'lucide-react';

interface ExploreProps {
  user: UserProfile;
  onUserClick?: (userId: string) => void;
}

export default function Explore({ user, onUserClick }: ExploreProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchFollowing();
  }, [user.uid]);

  const fetchFollowing = async () => {
    try {
      const followingQuery = query(collection(db, 'users', user.uid, 'following'));
      const followingSnap = await getDocs(followingQuery);
      const ids = new Set<string>();
      followingSnap.forEach(docSnap => {
        ids.add(docSnap.id);
      });
      setFollowingIds(ids);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserProfile[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if (data.uid !== user.uid) {
          fetchedUsers.push(data);
        }
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser: UserProfile) => {
    if (!targetUser.uid || targetUser.uid === user.uid) return;
    
    const isFollowing = followingIds.has(targetUser.uid);
    const newFollowingIds = new Set(followingIds);
    
    if (isFollowing) {
      newFollowingIds.delete(targetUser.uid);
      setFollowingIds(newFollowingIds);
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'following', targetUser.uid));
        await updateDoc(doc(db, 'users', user.uid), { following: increment(-1) });
        await updateDoc(doc(db, 'users', targetUser.uid), { followers: increment(-1) });
      } catch (error) {
        console.error("Error unfollowing:", error);
        setFollowingIds(followingIds); // revert
      }
    } else {
      newFollowingIds.add(targetUser.uid);
      setFollowingIds(newFollowingIds);
      try {
        await setDoc(doc(db, 'users', user.uid, 'following', targetUser.uid), {
          followedAt: Date.now()
        });
        await updateDoc(doc(db, 'users', user.uid), { following: increment(1) });
        await updateDoc(doc(db, 'users', targetUser.uid), { followers: increment(1) });
        
        // Notify
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          userId: targetUser.uid,
          fromUserId: user.uid,
          fromUserName: user.name || 'User',
          type: 'follow',
          read: false,
          createdAt: Date.now()
        });
      } catch (error) {
        console.error("Error following:", error);
        setFollowingIds(followingIds); // revert
      }
    }
  };

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search users..." 
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Follow Suggestions</h2>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.uid} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center space-x-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{u.name}</h3>
                  <p className="text-slate-500 text-sm">@{u.name.toLowerCase().replace(/\s+/g, '')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="font-bold text-lg text-[#1e1b4b]">{Number(u.likesGiven) || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Links</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="font-bold text-lg text-[#1e1b4b]">{Number(u.followers) || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Followers</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                  <div className="bg-green-500 rounded p-1 mb-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-slate-500">Gate</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => onUserClick?.(u.uid)}
                  className="flex-1 bg-indigo-50 text-indigo-900 font-bold py-3 rounded-xl flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => handleFollowToggle(u)}
                  className={`flex-[2] font-bold py-3 rounded-xl transition-colors shadow-sm ${
                    followingIds.has(u.uid)
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-[#1e1b4b] text-white hover:bg-indigo-900'
                  }`}
                >
                  {followingIds.has(u.uid) ? 'Following' : '+ Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
