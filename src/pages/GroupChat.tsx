import React, { useState, useEffect, useRef } from 'react';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  Timestamp,
  handleFirestoreError,
  OperationType,
  updateDoc,
  deleteDoc
} from '../lib/firebase';
import { UserProfile, Message, Group, MessageType } from '../types';
import { ChatHeader } from '../components/ChatHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { AIHelpButton } from '../components/AIHelpButton';
import { OnlineMembersPanel } from '../components/OnlineMembersPanel';
import { askAI } from '../lib/gemini';
import { BookOpen, Menu } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

const DEFAULT_GROUP_ID = 'math-bac-science';

interface GroupChatProps {
  userProfile: UserProfile;
  onOpenSidebar: () => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({ userProfile, onOpenSidebar }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<UserProfile[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group Listener
  useEffect(() => {
    const groupRef = doc(db, 'groups', DEFAULT_GROUP_ID);
    const unsubscribe = onSnapshot(groupRef, (snapshot) => {
      if (snapshot.exists()) {
        setGroup({ id: snapshot.id, ...snapshot.data() } as Group);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `groups/${DEFAULT_GROUP_ID}`));

    return () => unsubscribe();
  }, []);

  // Messages Listener
  useEffect(() => {
    if (!group) return;

    const messagesRef = collection(db, 'groups', DEFAULT_GROUP_ID, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      scrollToBottom();
    }, (error) => handleFirestoreError(error, OperationType.LIST, `groups/${DEFAULT_GROUP_ID}/messages`));

    return () => unsubscribe();
  }, [group]);

  // Online Members Listener
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data() as UserProfile);
      setOnlineMembers(members);
    }, (error) => {
      console.error("Error fetching online members:", error);
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text: string, type: MessageType = 'text') => {
    if (!userProfile || !group) return;

    const messageData: Omit<Message, 'id'> = {
      text,
      senderId: userProfile.uid,
      senderName: userProfile.displayName,
      senderPhoto: userProfile.photoURL,
      type,
      createdAt: Timestamp.now()
    };

    try {
      await addDoc(collection(db, 'groups', group.id, 'messages'), messageData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `groups/${group.id}/messages`);
    }
  };

  const handleAskAI = async () => {
    if (!group || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const context = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
      const prompt = "Please provide a helpful summary or answer based on the current discussion or help with a specific question if asked.";
      
      const response = await askAI(prompt, context);
      
      const aiMessage: Omit<Message, 'id'> = {
        text: response || "I'm sorry, I couldn't generate a response.",
        senderId: 'ai-assistant',
        senderName: 'AI Study Assistant',
        type: 'ai',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'groups', group.id, 'messages'), aiMessage);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!group) return;
    try {
      await deleteDoc(doc(db, 'groups', group.id, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `groups/${group.id}/messages/${messageId}`);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!group) return;
    try {
      await updateDoc(doc(db, 'groups', group.id), { pinnedMessageId: messageId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${group.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      {/* Mobile Menu Button Overlay */}
      <button 
        onClick={onOpenSidebar}
        className="lg:hidden fixed top-3 left-4 z-20 p-2 bg-white dark:bg-gray-900 rounded-full shadow-md border border-gray-100 dark:border-gray-800"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {group && (
        <ChatHeader 
          group={group} 
          onlineCount={onlineMembers.length} 
          onBack={onOpenSidebar} 
          onInfo={() => setShowMembers(true)} 
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shadow-inner">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to {group?.name}</h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                This is the beginning of your study journey. Be respectful and help each other!
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-4" />
          </div>

          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.senderId === userProfile.uid}
                isModerator={userProfile.role === 'admin' || userProfile.role === 'teacher'}
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
};
