export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  followers: number;
  following: number;
  likesGiven: number;
  likesReceived: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  fromUserId: string;
  fromUserName: string;
  linkId?: string;
  linkUrl?: string;
  type: 'like' | 'follow' | 'comment';
  read: boolean;
  createdAt: number;
}

export interface LinkItem {
  id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  url: string;
  description: string;
  likes: number;
  likedBy?: string[];
  createdAt: number;
}
