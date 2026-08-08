import { useEffect, useState, useRef, useMemo } from 'react';
import { UserProfile, LinkItem } from '../types';
import { collection, query, limit, getDocs, doc, updateDoc, increment, arrayUnion, where, setDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Play, Rocket, Star, CheckCircle, Pause, X, Heart, RefreshCw, ThumbsUp, ChevronRight, MoreHorizontal, Check, Layers } from 'lucide-react';

interface FeedProps {
  user: UserProfile;
  onUserClick?: (userId: string) => void;
}

const SPONSOR_ADS = Array.from({ length: 10 }).map((_, i) => ({
  id: `sponsor-ad-${i}`,
  url: 'https://www.effectivecpmnetwork.com/qxfd4bhy0?key=ca71c5414a2661fe4014253c2991e97f',
  title: `Sponsor Ad Task #${i + 1}`,
}));

export default function Feed({ user, onUserClick }: FeedProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sponsor ads state
  const [completedAds, setCompletedAds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`completedAds_${user.uid}`) || '[]');
    } catch {
      return [];
    }
  });

  const [currentAd, setCurrentAd] = useState<{id: string, url: string} | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Normal feed state
  const [activeIframes, setActiveIframes] = useState<{id: string, url: string}[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(4);
  const [isLiking, setIsLiking] = useState(false);
  const [showFloatingIframes, setShowFloatingIframes] = useState(true);

  const isCampaignCompleted = SPONSOR_ADS.every(ad => completedAds.includes(ad.id));
  const completedInCurrentBatch = SPONSOR_ADS.filter(ad => completedAds.includes(ad.id)).length;

  useEffect(() => {
    localStorage.setItem(`completedAds_${user.uid}`, JSON.stringify(completedAds));
    if (isCampaignCompleted) {
      setShowCampaignModal(false);
    } else {
      setShowCampaignModal(true);
    }
  }, [completedAds, user.uid, isCampaignCompleted]);

  // If campaign is not completed, we render ONLY the campaign view (or lock them in the modal).
  // But wait, earlier I changed the initial state? I'll just rely on this useEffect.

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const fetchFollowing = async () => {
    try {
      const followingQuery = query(collection(db, 'users', user.uid, 'following'));
      const followingSnap = await getDocs(followingQuery);
      const ids = new Set<string>();
      followingSnap.forEach(docSnap => {
        ids.add(docSnap.id);
      });
      setFollowingIds(ids);
      return ids;
    } catch (error) {
      console.error("Error fetching following:", error);
      return new Set<string>();
    }
  };

  const fetchSuggestedUsers = async (currentFollowingIds?: Set<string>) => {
    setLoadingSuggestions(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserProfile[] = [];
      const followSet = currentFollowingIds || followingIds;
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if (data.uid !== user.uid && !followSet.has(data.uid)) {
          fetchedUsers.push(data);
        }
      });
      
      // Shuffle and pick 5
      const shuffled = fetchedUsers.sort(() => 0.5 - Math.random());
      setSuggestedUsers(shuffled.slice(0, 5));
    } catch (error) {
      console.error("Error fetching suggested users:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchFollowing().then((ids) => {
      fetchSuggestedUsers(ids);
    });
  }, [user.uid]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch up to 100 recent links to find available ones
      const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      const fetchedLinks: LinkItem[] = [];
      const userIds = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Do not show user's own links AND do not show links they already liked
        if (data.userId !== user.uid && (!data.likedBy || !data.likedBy.includes(user.uid))) {
          fetchedLinks.push({ id: doc.id, ...data } as LinkItem);
          userIds.add(data.userId);
        }
      });
      
      const uniqueUserIds = Array.from(userIds);
      const validUserIds = new Set<string>();
      
      // Fetch user profiles to check if they have enough credits (likesGiven > likesReceived)
      for (let i = 0; i < uniqueUserIds.length; i += 10) {
        const chunk = uniqueUserIds.slice(i, i + 10);
        if (chunk.length === 0) continue;
        
        const usersQuery = query(collection(db, 'users'), where('uid', 'in', chunk));
        const usersSnap = await getDocs(usersQuery);
        
        usersSnap.forEach((docSnap) => {
          const userData = docSnap.data();
          const likesGiven = Number(userData.likesGiven) || 0;
          const likesReceived = Number(userData.likesReceived) || 0;
          
          // User earns 1 credit per like given, and loses 1 credit per like received on their ads.
          // They must have > 0 credits to have their ads shown to others.
          if (likesGiven > likesReceived) {
            validUserIds.add(userData.uid);
          }
        });
      }
      
      // Filter links to only those from valid users with credits
      const validLinks = fetchedLinks.filter(link => validUserIds.has(link.userId));
      
      // Shuffle the links to show a "new batch" on refresh
      const shuffledLinks = validLinks.sort(() => Math.random() - 0.5);
      // Pick up to 5 links to display
      const selectedLinks = shuffledLinks.slice(0, 5);
      
      setLinks(selectedLinks);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const launchAd = (ad: {id: string, url: string}) => {
    setCurrentAd(ad);
    setCountdown(15);
  };

  useEffect(() => {
    if (currentAd) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAdComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentAd]);

  const handleAdComplete = async () => {
    if (!currentAd) return;
    const adToComplete = currentAd;
    setCurrentAd(null);
    
    setCompletedAds(prev => {
      if (!prev.includes(adToComplete.id)) {
        return [...prev, adToComplete.id];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (isAutoPlaying && !currentAd) {
      const nextAd = SPONSOR_ADS.find(l => !completedAds.includes(l.id));
      if (nextAd) {
        const timeout = setTimeout(() => {
          launchAd(nextAd);
        }, 1500);
        return () => clearTimeout(timeout);
      }
    }
  }, [isAutoPlaying, currentAd, completedAds]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAutoPlaying && !isLiking && links.length > 0) {
      const nextLink = links.find(l => !l.likedBy?.includes(user.uid));
      if (nextLink) {
        timeout = setTimeout(() => {
          handleLike(nextLink);
        }, 500);
      } else {
        const nextAd = SPONSOR_ADS.find(l => !completedAds.includes(l.id));
        if (!nextAd) {
          setIsAutoPlaying(false);
        }
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying, isLiking, links, user.uid]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const closeAdManually = () => {
    setCurrentAd(null);
    setIsAutoPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFollowToggle = async (targetUserId: string, targetUserName: string) => {
    if (!targetUserId || targetUserId === user.uid) return;
    
    const isFollowing = followingIds.has(targetUserId);
    const newFollowingIds = new Set(followingIds);
    
    if (isFollowing) {
      newFollowingIds.delete(targetUserId);
      setFollowingIds(newFollowingIds);
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'following', targetUserId));
        await updateDoc(doc(db, 'users', user.uid), { following: increment(-1) });
        await updateDoc(doc(db, 'users', targetUserId), { followers: increment(-1) });
      } catch (error) {
        console.error("Error unfollowing:", error);
        setFollowingIds(followingIds); // revert
      }
    } else {
      newFollowingIds.add(targetUserId);
      setFollowingIds(newFollowingIds);
      try {
        await setDoc(doc(db, 'users', user.uid, 'following', targetUserId), {
          followedAt: Date.now()
        });
        await updateDoc(doc(db, 'users', user.uid), { following: increment(1) });
        await updateDoc(doc(db, 'users', targetUserId), { followers: increment(1) });
        
        // Notify
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          userId: targetUserId,
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

  const handleLike = async (link: LinkItem) => {
    if (link.likedBy?.includes(user.uid) || isLiking) {
      return;
    }
    
    setIsLiking(true);

    try {
      // Optimistic update - remove the link from feed since it's already liked
      setLinks(links.filter(l => l.id !== link.id));
      
      const linkRef = doc(db, 'links', link.id);
      await updateDoc(linkRef, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid)
      });
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        likesGiven: increment(1)
      });

      if (link.userId) {
        const ownerRef = doc(db, 'users', link.userId);
        await updateDoc(ownerRef, {
          likesReceived: increment(1)
        });

        if (link.userId !== user.uid) {
          const notificationRef = doc(collection(db, 'notifications'));
          await setDoc(notificationRef, {
            id: notificationRef.id,
            userId: link.userId,
            fromUserId: user.uid,
            fromUserName: user.name || 'User',
            linkId: link.id,
            linkUrl: link.url,
            type: 'like',
            read: false,
            createdAt: Date.now()
          });
        }
      }

      let currentUrl = link.url;
      if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
          currentUrl = 'https://' + currentUrl;
      }
      
      setActiveIframes(prev => {
          const next = [...prev, {id: link.id, url: currentUrl}];
          if (next.length > 3) return next.slice(next.length - 3);
          return next;
      });
      
      // Auto remove the ad slot after 15 seconds
      setTimeout(() => {
        setActiveIframes(prev => prev.filter(iframe => iframe.id !== link.id));
      }, 15000);
    } catch (error) {
      console.error("Error liking link:", error);
    } finally {
      // 3 second cooldown before allowing another like
      setTimeout(() => {
        setIsLiking(false);
      }, 3000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshCountdown(4);
    
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchFeed().then(() => {
            setIsRefreshing(false);
            setCompletedAds([]);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const removeIframe = (id: string) => {
      setActiveIframes(prev => prev.filter(iframe => iframe.id !== id));
  };

  return (
    <div className="space-y-4 pb-24 relative min-h-[calc(100vh-8rem)]">
      {/* Header and Stats */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Your Stats</h2>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex mb-6">
        <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-100">
          <div className="flex items-center space-x-2 text-[#1e1b4b] mb-1">
            <ThumbsUp className="w-5 h-5 fill-current" />
            <span className="text-2xl font-black">{Number(user.likesGiven) || 0}</span>
          </div>
          <span className="text-slate-500 text-sm font-medium">Given Today</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 text-red-500 mb-1">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-2xl font-black text-slate-800">{Number(user.likesReceived) || 0}</span>
          </div>
          <span className="text-slate-500 text-sm font-medium">Received Today</span>
        </div>
      </div>

      {/* Ad Campaigns Button */}
      <button 
        onClick={() => setShowCampaignModal(true)}
        className="w-full bg-gradient-to-r from-[#1e1b4b] to-[#2e2b5b] rounded-3xl p-5 flex flex-col shadow-md text-left transition-transform active:scale-[0.98] relative overflow-hidden"
      >
        <div className="flex items-center justify-between w-full relative z-10 mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Ad Campaigns</h3>
              <p className="text-indigo-200 text-sm mt-0.5">View sponsors & boost your score</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </div>
        
        <div className="w-full relative z-10">
          <div className="flex justify-between text-xs text-indigo-200 mb-2 font-medium">
            <span>Progress before refresh</span>
            <span>{completedInCurrentBatch} / {SPONSOR_ADS.length} Tasks</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(completedInCurrentBatch / SPONSOR_ADS.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </button>

      {/* Suggested Users Section */}
      <div className="pt-2 pb-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Suggested for you</h2>
          <button 
            onClick={() => fetchSuggestedUsers()} 
            disabled={loadingSuggestions}
            className="p-2 text-[#1e1b4b] hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-4 px-1 gap-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {loadingSuggestions ? (
            <div className="flex justify-center p-8 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e1b4b]"></div>
            </div>
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map(suggestedUser => (
              <div key={suggestedUser.uid} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center min-w-[140px] shrink-0 snap-start">
                <button 
                  onClick={() => onUserClick?.(suggestedUser.uid)}
                  className="mb-3 relative"
                >
                  {suggestedUser.photoURL ? (
                    <img referrerPolicy="no-referrer" src={suggestedUser.photoURL} alt={suggestedUser.name} className="w-16 h-16 rounded-full object-cover p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-tr from-cyan-400 to-blue-500">
                      {suggestedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <button 
                  onClick={() => onUserClick?.(suggestedUser.uid)}
                  className="font-bold text-slate-900 text-sm mb-0.5 truncate w-full text-center hover:underline"
                >
                  {suggestedUser.name.toUpperCase()}
                </button>
                <p className="text-xs text-slate-400 mb-4 truncate w-full text-center">@{suggestedUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                <button
                  onClick={() => handleFollowToggle(suggestedUser.uid, suggestedUser.name)}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                    followingIds.has(suggestedUser.uid)
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-[#1e1b4b] text-white hover:bg-indigo-900'
                  }`}
                >
                  {followingIds.has(suggestedUser.uid) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center w-full p-4 text-slate-500">
              No suggestions available right now.
            </div>
          )}
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4 pt-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e1b4b]"></div>
          </div>
        ) : links.length > 0 ? (
          links.map((link) => {
            const hasLiked = link.likedBy?.includes(user.uid);
            return (
              <div key={link.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-slate-50">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => onUserClick?.(link.userId)}
                      className="relative block"
                    >
                      <img referrerPolicy="no-referrer" src={link.userPhoto || "/logo.png?v=6"} alt={link.userName || "User"} className="w-12 h-12 rounded-full bg-[#1e1b4b] p-0.5 object-cover" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </button>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <button 
                          onClick={() => onUserClick?.(link.userId)}
                          className="font-bold text-slate-800 hover:underline text-left"
                        >
                          {link.userName || 'Anonymous'}
                        </button>
                        {link.userId !== user.uid && (
                          <button
                            onClick={() => handleFollowToggle(link.userId, link.userName || 'Anonymous')}
                            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors uppercase tracking-wider ${
                              followingIds.has(link.userId) 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-[#1e1b4b] text-white hover:bg-indigo-900'
                            }`}
                          >
                            {followingIds.has(link.userId) ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-400 font-medium space-x-1">
                        <span>🌍</span>
                        <span>Published : {new Date(link.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert("Task reported for review. Thank you.")}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Rocket className="w-5 h-5 text-[#1e1b4b]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Task ID</p>
                          <p className="font-bold text-slate-800 tracking-tight">#{link.id.substring(0, 8).toUpperCase()}...</p>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                        Unknown
                      </div>
                    </div>
                    
                    <p className="text-slate-700 text-sm mb-3">
                      {link.description || 'Stay connected for more Opportunities! Keep the tasks coming your way. ✅'}
                    </p>
                    
                    <div className="flex items-center text-xs text-slate-500 space-x-1.5">
                      <span className="opacity-70">📅</span>
                      <span>Published: {new Date(link.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-medium">Create*Best Community</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500 text-sm font-medium">({link.likes}) Likes</span>
                    <button 
                      onClick={() => handleLike(link)}
                      disabled={hasLiked || isLiking}
                      className={`w-12 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        hasLiked ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-indigo-400' : 'fill-current'}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500">No community tasks found.</p>
          </div>
        )}
      </div>

      {/* Notices */}
      <div className="mb-6 mt-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Notices</h2>
          <button onClick={handleRefresh} className="p-2 text-[#1e1b4b] hover:bg-slate-200 rounded-full transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium text-sm leading-relaxed mb-2">
              ⚔️ আমাদের সকল আপডেট সবার আগে পেতে অবশ্যই আমাদের Telegram এ যুক্ত থাকুন।
            </p>
            <p className="text-red-700 font-medium text-sm leading-relaxed">
              👉 Join Telegram: সাপোর্ট গ্রুপ 🔗 <a href="https://t.me/+HIwGARHGlnc5MGFl" target="_blank" rel="noopener noreferrer" className="break-all font-bold">https://t.me/+HIwGARHGlnc5MGFl</a>
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-medium text-sm leading-relaxed">
              যারা আমাদের Regular user, Earning দ্বিগুণ করতে করতে, #adsterra থেকে ২০ টা লিংক নিয়ে এড করেন কাজ শুরু করেন
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <p className="text-purple-700 font-medium text-sm leading-relaxed">
              অবশ্যই Follow শেষ করতে হবে<br/>
              ফলো শেষ না করলে সবার সাথে Connection হবে না<br/>
              নতুন ইউজার Add হওয়ার সাথে সাথেই Follow করতে হবে
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 md:bottom-8 z-30 flex flex-col items-end space-y-3">
        {activeIframes.length > 0 && (
          <button 
            onClick={() => setShowFloatingIframes(!showFloatingIframes)}
            className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Layers className="w-6 h-6 text-slate-800" />
          </button>
        )}
        <button 
          onClick={toggleAutoPlay}
          disabled={isCampaignCompleted}
          className={`shadow-2xl rounded-2xl flex items-center space-x-3 px-6 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isAutoPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#1e1b4b] text-white hover:bg-indigo-950'
          }`}
        >
          {isAutoPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          <span className="font-bold tracking-wider text-sm">
            {isAutoPlaying ? 'STOP PLAY' : 'AUTO PLAY'}
          </span>
        </button>
      </div>

      {/* Campaigns Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
          <div className="sticky top-0 bg-slate-50 p-4 z-10 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Sponsor Campaigns</h2>
            {isCampaignCompleted && (
              <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                <X className="w-6 h-6 text-slate-800" />
              </button>
            )}
          </div>
          
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            {/* Start Campaign Hero */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col items-center text-center">
              <div className="bg-[#1e1b4b] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                {!isCampaignCompleted ? 'Mandatory Task' : 'High-Yield Option'}
              </div>
              <div className="w-16 h-16 bg-[#1e1b4b] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {!isCampaignCompleted ? 'Welcome! Complete Campaigns' : 'Start Campaign'}
              </h2>
              <p className="text-slate-600 mb-6 max-w-sm">
                {!isCampaignCompleted 
                  ? 'You must complete the mandatory sponsor campaigns before accessing the main feed.' 
                  : 'Unlock higher CPM and better revenue stream by viewing targeted sponsor campaigns.'}
              </p>
              
              <div className="flex w-full space-x-3 mb-6">
                <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                    <span className="font-bold text-indigo-600">{SPONSOR_ADS.length}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Ads Available</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{completedInCurrentBatch} Completed</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                    <Play className="w-5 h-5 text-blue-500 fill-current" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Ready Status</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const nextAd = SPONSOR_ADS.find(l => !completedAds.includes(l.id));
                  if (nextAd) launchAd(nextAd);
                }}
                disabled={isCampaignCompleted}
                className="relative w-full bg-[#1e1b4b] hover:bg-indigo-950 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isCampaignCompleted && completedInCurrentBatch === 0 && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl whitespace-nowrap animate-bounce z-10 before:content-[''] before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-indigo-600">
                    Click here to start! (Must complete {SPONSOR_ADS.length})
                  </div>
                )}
                <Rocket className="w-5 h-5" />
                <span>{isCampaignCompleted ? 'All Tasks Completed' : 'Start Campaign'}</span>
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {SPONSOR_ADS.map((link, index) => {
                const isCompleted = completedAds.includes(link.id);
                return (
                  <div key={link.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3.5 rounded-2xl shrink-0 ${isCompleted ? 'bg-slate-50' : 'bg-green-50'}`}>
                        <Star className={`w-6 h-6 fill-current ${isCompleted ? 'text-slate-300' : 'text-green-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{link.title}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-3">High CPM Yield Campaign</p>
                        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                          Launch this campaign task and watch the sponsor ad for 15 seconds to receive your yield score credit. The tab will automatically close on completion.
                        </p>
                        <button 
                          onClick={() => launchAd(link)}
                          disabled={isCompleted || isAutoPlaying}
                          className={`relative w-full py-3.5 rounded-2xl flex justify-center items-center space-x-2 font-semibold transition-colors ${
                            isCompleted 
                              ? 'bg-green-50 text-green-600' 
                              : isAutoPlaying
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-[#1e1b4b] text-white hover:bg-indigo-950 shadow-sm'
                          }`}
                        >
                          {!isCampaignCompleted && index === completedInCurrentBatch && !isAutoPlaying && (
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-pulse z-10 before:content-[''] before:absolute before:-bottom-1.5 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-blue-600">
                               Launch this next!
                             </div>
                          )}
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                          <span>{isCompleted ? 'Completed' : 'Launch Campaign Ad'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Iframes */}
          {activeIframes.length > 0 && showFloatingIframes && (
            <div className="fixed bottom-24 left-4 md:bottom-8 md:left-8 flex space-x-2 z-40 items-end pointer-events-none">
              {activeIframes.map((iframe, index) => (
                <div key={iframe.id} className="bg-[#0B0B0B] rounded-xl shadow-2xl overflow-hidden border border-slate-700 w-24 h-40 md:w-32 md:h-56 flex flex-col relative pointer-events-auto">
                  <div className="flex justify-between items-center px-2 py-1.5 bg-black text-white text-[10px] md:text-xs font-medium">
                      <span>Slot {index + 1}</span>
                      <button onClick={() => removeIframe(iframe.id)} className="text-slate-400 hover:text-red-400 p-1 -mr-1">
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                  </div>
                  <iframe 
                    src={iframe.url} 
                    className="flex-1 w-full bg-white border-0" 
                    title={`Slot ${index + 1}`} 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          )}

      {/* Full Screen Ad Viewer Overlay */}
      {currentAd && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0B] flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center px-4 py-3 bg-[#1e1b4b] text-white shadow-md z-10">
            <div className="flex items-center space-x-3 overflow-hidden">
              <button 
                onClick={closeAdManually} 
                className="p-2 hover:bg-white/10 rounded-full shrink-0 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">In-App Browser</span>
                <span className="text-xs text-white/70 truncate flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                  {currentAd.url}
                </span>
              </div>
            </div>
            <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full shrink-0 border border-white/20">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse mr-2"></div>
              <span className="text-sm font-bold text-white">
                {countdown}s
              </span>
            </div>
          </div>
          <div className="flex-1 w-full bg-white relative">
            <iframe 
              src={currentAd.url} 
              className="absolute inset-0 w-full h-full border-0" 
              title="Sponsor Ad"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Refresh Countdown Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 relative">
              <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-[#1e1b4b] rounded-full border-t-transparent animate-spin"></div>
              <span className="text-5xl font-bold text-[#1e1b4b]">{refreshCountdown}</span>
            </div>
            
            <div className="space-y-3 pt-4">
              <h3 className="text-2xl font-bold text-slate-900">অপেক্ষা করুন...</h3>
              <p className="text-slate-600 font-medium text-lg">
                {refreshCountdown} সেকেন্ডে নতুন বিজ্ঞাপন লোড হচ্ছে
              </p>
              <p className="text-slate-400 text-sm">
                দয়া করে একটু ধৈর্য ধরুন 🙏
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
