import { useEffect, useState } from 'react';
import { UserProfile, LinkItem } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Edit2, Plus, ExternalLink } from 'lucide-react';
import LinkModal from './LinkModal';

interface MyLinksProps {
  user: UserProfile;
}

export default function MyLinks({ user }: MyLinksProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const fetchMyLinks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'links'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedLinks: LinkItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLinks.push({ id: doc.id, ...doc.data() } as LinkItem);
      });
      setLinks(fetchedLinks.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching my links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLinks();
  }, [user.uid]);

  const handleEdit = (link: LinkItem) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    if (links.length >= 20) {
      alert("Maximum limit of 20 links reached.");
      return;
    }
    setEditingLink(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage Links</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            <span className={links.length >= 20 ? 'text-red-500' : 'text-indigo-600'}>
              {links.length}
            </span> / 20 Links Used
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          disabled={links.length >= 10}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl p-3 flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900"></div>
          </div>
        ) : links.length > 0 ? (
          links.map((link) => (
            <div key={link.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-slate-800 font-medium truncate mb-1">
                  {link.description || 'No description'}
                </p>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate">{link.url}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center px-3 border-r border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Likes</p>
                  <p className="font-bold text-slate-700">{link.likes}</p>
                </div>
                <button 
                  onClick={() => handleEdit(link)}
                  className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 mb-4">You haven't added any links yet.</p>
            <button 
              onClick={handleAddNew}
              className="text-indigo-600 font-medium hover:underline"
            >
              Add your first link
            </button>
          </div>
        )}
      </div>

      <LinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        link={editingLink} 
        user={user}
        onSuccess={fetchMyLinks}
      />
    </div>
  );
}
