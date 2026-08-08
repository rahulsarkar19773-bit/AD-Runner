import { useState, useEffect } from 'react';
import { UserProfile, LinkItem } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link as LinkIcon, Heart } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
}

export default function Profile({ user }: ProfileProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLinks();
  }, [user.uid]);

  const fetchUserLinks = async () => {
    try {
      const q = query(
        collection(db, 'links'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedLinks: LinkItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLinks.push({ id: doc.id, ...doc.data() } as LinkItem);
      });
      
      const sortedLinks = fetchedLinks.sort((a, b) => b.createdAt - a.createdAt);
      setLinks(sortedLinks);
    } catch (error) {
      console.error("Error fetching user links:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-12 space-y-8 animate-in fade-in duration-300">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-green-400 via-blue-500 to-indigo-600 p-1">
            <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-white overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mx-auto max-w-sm">
        <div className="flex justify-between items-center text-center">
          <div className="flex-1">
            <p className="text-2xl font-bold text-[#1e1b4b]">{Number(user.likesGiven) || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Likes Given</p>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-[#1e1b4b]">{Number(user.followers) || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Followers</p>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-[#1e1b4b]">{Number(user.following) || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Following</p>
          </div>
        </div>
      </div>

      {/* Published Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">Published Links</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e1b4b]"></div>
          </div>
        ) : links.length > 0 ? (
          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center space-x-4 transition-all hover:shadow-md">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <LinkIcon className="w-5 h-5 text-indigo-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium truncate mb-1">
                    {link.url}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center text-red-400">
                      <Heart className="w-3.5 h-3.5 mr-1 fill-current" />
                      {link.likes || 0}
                    </span>
                    <span className="flex items-center text-slate-400">
                      <span className="mr-1">🕒</span>
                      {new Date(link.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500">You haven't published any links yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
