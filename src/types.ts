import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  branch?: string;
  enrolledSubjects?: string[];
  role: UserRole;
  lastSeen?: Timestamp;
}

export type MessageType = 'text' | 'image' | 'pdf' | 'ai' | 'youtube';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  youtubeId?: string;
  createdAt: Timestamp;
  isPinned?: boolean;
  reactions?: Record<string, string>;
}

export interface Group {
  id: string;
  name: string;
  branch: string;
  subject: string;
  description?: string;
  isLocked?: boolean;
  isPrivate?: boolean;
  creatorId?: string;
  memberIds?: string[];
  pinnedMessageId?: string;
  lastMessage?: {
    text: string;
    senderName: string;
    createdAt: Timestamp;
  };
  memberCount?: number;
  createdAt: Timestamp;
}
