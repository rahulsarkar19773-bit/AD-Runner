import logoUrl from "../assets/logo.png";
import { useEffect, useState, useRef, useMemo } from 'react';
import { UserProfile, LinkItem } from '../types';
import { collection, query, limit, getDocs, doc, updateDoc, increment, arrayUnion, where, setDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Play, Rocket, Star, CheckCircle, Pause, X, Heart, RefreshCw, ThumbsUp, ChevronRight, MoreHorizontal, Check, PictureInPicture2 } from 'lucide-react';

interface FeedProps {
  user: UserProfile;
  onUserClick?: (userId: string) => void;
}

const AD_URLS = [
  'https://www.effectivecpmnetwork.com/pihsma1gj?key=544c6413cee3682e343c26302caf9348',
  'https://www.effectivecpmnetwork.com/n3dzrg6n1?key=ce675b26e106de27b5c4d74d3b9e61f0',
  'https://www.effectivecpmnetwork.com/m7w6hdad?key=e48c485666b61174e79de0006bf9be76',
  'https://www.effectivecpmnetwork.com/fd00z979x?key=714a22e0037cc3a305030e5860da6d6a',
  'https://www.effectivecpmnetwork.com/rnsyp67gyh?key=6737e6805f05776dcfecbcc64c001746',
  'https://www.effectivecpmnetwork.com/qxfd4bhy0?key=ca71c5414a2661fe4014253c2991e97f'
];

const SPONSOR_ADS = Array.from({ length: 10 }).map((_, i) => ({
  id: `sponsor-ad-${i}`,
  url: AD_URLS[i % AD_URLS.length],
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

  // Single Visit Automated Flow State
  const [showSingleVisitModal, setShowSingleVisitModal] = useState(false);
  const [visitIndex, setVisitIndex] = useState(0);
  const [visitCountdown, setVisitCountdown] = useState(5);
  const [sessionCreditsEarned, setSessionCreditsEarned] = useState(0);
  const visitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showSingleVisitModal) {
      const activeList = links.length > 0 ? links : SPONSOR_ADS;
      if (activeList.length === 0) return;

      const currentItem = activeList[visitIndex % activeList.length];
      let url = currentItem.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

      setActiveIframes([{ id: currentItem.id, url }]);
      setVisitCountdown(5);

      visitTimerRef.current = setInterval(() => {
        setVisitCountdown(prev => {
          if (prev <= 1) {
            setSessionCreditsEarned(c => c + 1);
            if (visitIndex + 1 < activeList.length) {
              setVisitIndex(vi => vi + 1);
              return 5;
            } else {
              clearInterval(visitTimerRef.current!);
              setTimeout(() => {
                setShowSingleVisitModal(false);
                setActiveIframes([]);
              }, 1000);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (visitTimerRef.current) clearInterval(visitTimerRef.current);
      };
    } else {
      if (visitTimerRef.current) clearInterval(visitTimerRef.current);
    }
  }, [showSingleVisitModal, visitIndex, links]);

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
        // Do not show user's own links
        if (data.userId !== user.uid) {
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
          // Give 10 free starting credits so new users can get some initial traffic.
          // They must have > 0 total credits to have their ads shown to others.
          if (likesGiven + 10 > likesReceived) {
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
    setCountdown(6);
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
        }, 3000);
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
    if (isLiking) return;
    setIsLiking(true);

    let currentUrl = link.url;
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
        currentUrl = 'https://' + currentUrl;
    }

    // Set as single mini-popup player slot
    setActiveIframes([{ id: link.id, url: currentUrl }]);
    setIsAutoPlaying(true);

    try {
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
      }
    } catch (error) {
      console.error("Error visiting link:", error);
    } finally {
      // 3 to 6 seconds random dwell time per visit
      const randomTime = Math.floor(Math.random() * 4000) + 3000;
      setTimeout(() => {
        setIsLiking(false);
        setActiveIframes([]);
      }, randomTime);
    }
  };

  const startBatchVisit = () => {
    const batchSizes = [20, 50, 70];
    const selectedSize = batchSizes[Math.floor(Math.random() * batchSizes.length)];
    
    const generatedIframes = Array.from({ length: Math.min(selectedSize, 10) }).map((_, i) => {
      const adUrl = AD_URLS[i % AD_URLS.length];
      return {
        id: `batch-${Date.now()}-${i}`,
        url: adUrl
      };
    });

    setActiveIframes(generatedIframes);
    setIsAutoPlaying(true);
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
      {/* Single Visit Card matching the video */}
      <div className="bg-[#18153b] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden my-6 border border-indigo-900/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900/80 flex items-center justify-center border border-indigo-700/50">
              <Play className="w-6 h-6 text-cyan-400 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-white">Single Visit</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              </div>
              <p className="text-indigo-300 text-xs font-medium mt-0.5">{links.length || 15} links available</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setVisitIndex(0);
              setSessionCreditsEarned(0);
              setShowSingleVisitModal(true);
            }}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-slate-950 font-black py-3 px-7 rounded-2xl shadow-lg transform active:scale-95 transition-all text-base tracking-wide"
          >
            Visit
          </button>
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

      {/* Feed List Removed as requested - only Giant Visit Button & Ad Campaign Center remain */}

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
          <div className="relative group overflow-hidden rounded-2xl p-[2px]">
            <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite] opacity-80 shadow-lg"></div>
            <button 
              onClick={() => setShowFloatingIframes(!showFloatingIframes)}
              className="relative w-14 h-14 bg-blue-500 rounded-[14px] flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <PictureInPicture2 className="w-7 h-7 text-white" />
            </button>
          </div>
        )}
        <div className="relative group overflow-hidden rounded-2xl p-[2px]">
          {!isAutoPlaying && !isCampaignCompleted && (
            <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite] opacity-80 shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
          )}
          <button 
            onClick={toggleAutoPlay}
            disabled={isCampaignCompleted}
            className={`relative shadow-2xl rounded-[14px] flex items-center space-x-3 px-6 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isAutoPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#1e1b4b] text-white hover:bg-indigo-950'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span className="font-bold tracking-wider text-sm">
              {isAutoPlaying ? 'STOP PLAY' : 'AUTO PLAY'}
            </span>
          </button>
        </div>
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
                          Launch this campaign task and watch the sponsor ad for 5 seconds to receive your yield score credit. The tab will automatically close on completion.
                        </p>
                        <div className="relative w-full group overflow-hidden rounded-2xl p-[2px]">
                          {!isCompleted && !isAutoPlaying && (
                            <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                          )}
                          <button 
                            onClick={() => launchAd(link)}
                            disabled={isCompleted || isAutoPlaying}
                            className={`relative w-full py-3.5 rounded-[14px] flex justify-center items-center space-x-2 font-semibold transition-colors ${
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
                <div key={iframe.id} className="bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden border border-slate-700 w-32 h-48 md:w-48 md:h-72 flex flex-col relative pointer-events-auto transition-all">
                  {/* Mini Browser Header */}
                  <div className="flex items-center justify-between px-2.5 py-2 bg-slate-800 border-b border-slate-700">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm"></div>
                    </div>
                    <div className="flex-1 px-3">
                      <div className="bg-slate-900/50 rounded text-[9px] text-slate-400 px-2 py-0.5 text-center truncate w-full border border-slate-700/50">
                        Slot {index + 1}
                      </div>
                    </div>
                    <button onClick={() => removeIframe(iframe.id)} className="text-slate-400 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Iframe with 2x zoom effect to fit mobile layouts */}
                  <div className="flex-1 w-full bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-[200%] h-[200%] origin-top-left scale-50">
                      <iframe 
                        src={iframe.url} 
                        className="w-full h-full border-0" 
                        title={`Slot ${index + 1}`} 
                        referrerPolicy="no-referrer"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    </div>
                  </div>
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

      {/* Single Visit Automated Modal (Matching Video) */}
      {showSingleVisitModal && (() => {
        const activeList = links.length > 0 ? links : SPONSOR_ADS;
        const currentItem = activeList[visitIndex % activeList.length];
        const totalCount = activeList.length;

        return (
          <div className="fixed inset-0 z-50 bg-[#0c0a20] flex flex-col p-4 text-white overflow-y-auto animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6 max-w-md mx-auto w-full">
              <button 
                onClick={() => {
                  setShowSingleVisitModal(false);
                  setActiveIframes([]);
                }}
                className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="text-center">
                <h3 className="text-lg font-bold">Single Visit</h3>
                <p className="text-xs text-indigo-300">{visitIndex + 1} / {totalCount} links</p>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl font-bold text-sm">
                +{sessionCreditsEarned} cr
              </div>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto w-full bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
              <div 
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${((visitIndex + 1) / totalCount) * 100}%` }}
              ></div>
            </div>

            {/* Main Visit Card */}
            <div className="max-w-md mx-auto w-full bg-[#18153b] rounded-[2rem] p-6 shadow-2xl border border-indigo-900/60 flex flex-col items-center relative overflow-hidden mb-6">
              <div className="flex items-center space-x-3 mb-6 w-full bg-indigo-950/40 p-4 rounded-2xl border border-indigo-800/40">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shrink-0">
                  {currentItem?.userName ? currentItem.userName.charAt(0).toUpperCase() : 'TO'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-base truncate">Smartlink_{visitIndex + 1}</h4>
                  <p className="text-xs text-indigo-300 truncate">by {currentItem?.userName || 'Tonmoy_3'}</p>
                </div>
              </div>

              {/* Circular Timer & Live Ad Preview */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-4 w-full">
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-900/80"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-pulse" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
                  <div className="flex flex-col items-center justify-center bg-[#141133] w-28 h-28 rounded-full shadow-inner">
                    <span className="text-4xl font-black text-white">{visitCountdown}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">sec</span>
                  </div>
                </div>

                {/* Live Ad Mini Browser Preview */}
                <div className="flex-1 w-full bg-slate-900 rounded-2xl overflow-hidden border border-indigo-800/60 shadow-lg h-44 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-[#FF5F56]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono truncate px-2">{currentItem.url}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="flex-1 w-full bg-white relative overflow-hidden">
                    <iframe 
                      src={currentItem.url} 
                      className="w-full h-full border-0" 
                      title="User Ad Preview"
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-6">
                <span className="bg-[#1f1b52] text-purple-300 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-700/50 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Server Visit</span>
                </span>
              </div>

              {/* Visited Links History List inside modal */}
              <div className="w-full space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeList.slice(0, visitIndex + 1).map((item, idx) => {
                  const isDone = idx < visitIndex;
                  return (
                    <div key={item.id + idx} className="flex items-center justify-between bg-indigo-950/30 px-4 py-3 rounded-2xl border border-indigo-900/40 text-xs">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                          {idx + 1}
                        </div>
                        <span className="font-semibold text-slate-200">Smartlink_{idx + 1}</span>
                      </div>
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cancel Visit Button */}
            <div className="max-w-md mx-auto w-full pb-6 text-center">
              <button 
                onClick={() => {
                  setShowSingleVisitModal(false);
                  setActiveIframes([]);
                }}
                className="text-red-400 font-bold hover:text-red-300 transition-colors py-3 px-6 text-sm tracking-wide"
              >
                Cancel Visit
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
