import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Info, 
  MoreVertical,
  Loader2,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  limit, 
  increment,
  Timestamp,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { UserProfile, Message, Group, MessageType } from '../types';
import { ChatHeader } from '../components/ChatHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { AIHelpButton } from '../components/AIHelpButton';
import { OnlineMembersPanel } from '../components/OnlineMembersPanel';
import { askAI } from '../lib/gemini';

export default function ChatRoom() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<UserProfile[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const user = auth.currentUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    const fetchProfile = async () => {
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setUserProfile({
              ...data,
              displayName: data.full_name || data.displayName
            } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();

    const groupRef = doc(db, 'chat_groups', groupId);
    const unsubscribeGroup = onSnapshot(groupRef, (snapshot) => {
      if (snapshot.exists()) {
        setGroup({ id: snapshot.id, ...snapshot.data() } as Group);
      } else {
        navigate('/groups');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `chat_groups/${groupId}`));

    // Update active member count
    updateDoc(groupRef, { memberCount: increment(1) }).catch(console.error);

    const q = query(
      collection(db, 'chat_messages'),
      where('group_id', '==', groupId),
      orderBy('created_at', 'asc'),
      limit(100)
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        senderId: doc.data().sender_id,
        senderName: doc.data().sender_name,
        senderPhoto: doc.data().sender_avatar,
        type: doc.data().type,
        fileUrl: doc.data().file_url,
        fileName: doc.data().file_name,
        youtubeId: doc.data().youtube_id,
        createdAt: doc.data().created_at,
        isPinned: doc.data().is_pinned || false
      } as Message));
      setMessages(messagesData);
      setLoading(false);
      scrollToBottom();
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chat_messages`));

    // Online Members Listener (simplified for demo)
    const usersRef = collection(db, 'profiles');
    const unsubscribeUsers = onSnapshot(query(usersRef, limit(20)), (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data() as UserProfile);
      setOnlineMembers(members);
    });

    return () => {
      unsubscribeGroup();
      unsubscribeMessages();
      unsubscribeUsers();
      if (groupId) {
        updateDoc(doc(db, 'chat_groups', groupId), { memberCount: increment(-1) }).catch(console.error);
      }
    };
  }, [groupId, navigate, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text: string, type: MessageType = 'text') => {
    if (!groupId || !user || !userProfile || group?.isLocked) return;

    try {
      const messageData: any = {
        group_id: groupId,
        text,
        sender_id: user.uid,
        sender_name: userProfile.displayName || 'مستخدم',
        sender_avatar: userProfile.photoURL || '',
        type,
        created_at: serverTimestamp()
      };

      // Handle YouTube ID extraction if type is youtube
      if (type === 'youtube') {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/;
        const match = text.match(youtubeRegex);
        if (match && match[1]) {
          messageData.youtube_id = match[1];
        }
      }

      await addDoc(collection(db, 'chat_messages'), messageData);

      await updateDoc(doc(db, 'chat_groups', groupId), {
        lastMessage: {
          text: type === 'text' ? text : `أرسل ${type}`,
          senderName: userProfile.displayName || 'مستخدم',
          createdAt: serverTimestamp()
        }
      });

      scrollToBottom();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chat_messages`);
    }
  };

  const handleAskAI = async () => {
    if (!groupId || !user || !userProfile || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const context = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
      const prompt = "ساعدني في فهم هذا الدرس أو حل هذا التمرين بناءً على المحادثة الحالية.";
      
      const response = await askAI(prompt, context);
      
      const aiMessage: any = {
        group_id: groupId,
        text: response || "عذراً، لم أستطع معالجة طلبك الآن.",
        sender_id: 'ai-assistant',
        sender_name: 'المساعد الذكي',
        sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=study-ai',
        type: 'ai',
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'chat_messages'), aiMessage);
      scrollToBottom();
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!groupId) return;
    try {
      await deleteDoc(doc(db, 'chat_messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chat_messages/${messageId}`);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!groupId) return;
    try {
      await updateDoc(doc(db, 'chat_messages', messageId), { is_pinned: true });
      await updateDoc(doc(db, 'chat_groups', groupId), { pinnedMessageId: messageId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chat_messages/${messageId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-white dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري دخول الغرفة...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {group && (
        <ChatHeader 
          group={group} 
          onlineCount={onlineMembers.length} 
          onBack={() => navigate('/groups')} 
          onInfo={() => setShowMembers(true)} 
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center shadow-inner">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">أهلاً بك في {group?.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                هذه هي بداية رحلتك الدراسية. كن محترماً وساعد زملائك!
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-4" />
          </div>

          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.senderId === user?.uid}
                isModerator={userProfile?.role === 'admin'}
                onDelete={handleDeleteMessage}
                onPin={handlePinMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <AIHelpButton onClick={handleAskAI} isLoading={isAiLoading} />

      <MessageInput onSendMessage={handleSendMessage} disabled={group?.isLocked} />

      <AnimatePresence>
        {showMembers && (
          <OnlineMembersPanel 
            isOpen={showMembers}
            members={onlineMembers} 
            onClose={() => setShowMembers(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
