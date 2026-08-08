import { useState, useEffect } from 'react';
import { UserProfile, LinkItem } from '../types';
import { doc, setDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Trash2 } from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkItem | null;
  user: UserProfile;
  onSuccess: () => void;
}

export default function LinkModal({ isOpen, onClose, link, user, onSuccess }: LinkModalProps) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (link) {
      setUrl(link.url);
      setDescription(link.description);
    } else {
      setUrl('');
      setDescription('');
    }
    setError('');
  }, [link, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (link) {
        // Update
        const linkRef = doc(db, 'links', link.id);
        await updateDoc(linkRef, {
          url,
          description
        });
      } else {
        // Create
        const newLinkRef = doc(collection(db, 'links'));
        await setDoc(newLinkRef, {
          id: newLinkRef.id,
          userId: user.uid,
          userName: user.name || 'User',
          userPhoto: user.photoURL || null,
          url,
          description,
          likes: 0,
          createdAt: Date.now()
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!link || !window.confirm("Are you sure you want to delete this link?")) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'links', link.id));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal / Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none p-4">
        <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out translate-y-0 relative overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">
              {link ? 'Edit Link' : 'Add New Link'}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <form id="link-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or Adsterra link"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this link about?"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </form>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between space-x-4">
            {link ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="p-3 text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : <div />}
            
            <button
              form="link-form"
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1e1b4b] hover:bg-indigo-950 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span>{link ? 'Save Changes' : 'Create Link'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
