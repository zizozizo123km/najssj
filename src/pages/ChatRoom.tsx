import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  MoreVertical, 
  Trash2, 
  Lock, 
  Unlock,
  Bot,
  User,
  Clock,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc, 
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  limit,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: any;
  type: 'text' | 'image' | 'ai';
  imageUrl?: string;
}

interface ChatGroup {
  id: string;
  name: string;
  branchId: string;
  subjectId: string;
  memberCount: number;
  isLocked: boolean;
}

export default function ChatRoom() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showModeration, setShowModeration] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    // Check admin status
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else if (
          auth.currentUser.email === "dzs325105@gmail.com" || 
          auth.currentUser.email === "nacero123@gmail.com"
        ) {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();

    // Fetch group info
    const fetchGroup = async () => {
      const groupDoc = await getDoc(doc(db, 'chatGroups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as ChatGroup);
        
        // Increment member count (simulated for now)
        await updateDoc(doc(db, 'chatGroups', groupId), {
          memberCount: increment(1)
        });
      } else {
        navigate('/groups');
      }
    };
    fetchGroup();

    // Listen to messages
    const q = query(
      collection(db, 'chatGroups', groupId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Decrement member count when leaving
      if (groupId) {
        updateDoc(doc(db, 'chatGroups', groupId), {
          memberCount: increment(-1)
        }).catch(console.error);
      }
    };
  }, [groupId, navigate]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !groupId || !auth.currentUser || group?.isLocked) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const messageData = {
        text,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'طالب',
        senderAvatar: auth.currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        type: 'text'
      };

      await addDoc(collection(db, 'chatGroups', groupId, 'messages'), messageData);
      
      // Update last message in group
      await updateDoc(doc(db, 'chatGroups', groupId), {
        lastMessage: {
          text,
          sender: auth.currentUser.displayName || 'طالب',
          timestamp: Date.now()
        }
      });

      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleAiAsk = async () => {
    if (!inputText.trim() || !groupId || !auth.currentUser || isAiLoading) return;

    const prompt = inputText.trim();
    setInputText('');
    setIsAiLoading(true);

    // Add user message first
    try {
      await addDoc(collection(db, 'chatGroups', groupId, 'messages'), {
        text: prompt,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'طالب',
        senderAvatar: auth.currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        type: 'text'
      });

      // Call Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "أنت مساعد دراسي ذكي لطلاب البكالوريا في الجزائر. قدم إجابات دقيقة، مختصرة، وباللغة العربية. ساعد في حل التمارين، شرح الدروس، وتقديم نصائح دراسية."
        }
      });

      const aiText = response.text || "عذراً، لم أستطع معالجة طلبك الآن.";

      await addDoc(collection(db, 'chatGroups', groupId, 'messages'), {
        text: aiText,
        senderId: 'ai-assistant',
        senderName: 'المساعد الذكي',
        senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=study-ai',
        timestamp: serverTimestamp(),
        type: 'ai'
      });

      scrollToBottom();
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin || !groupId) return;
    try {
      await deleteDoc(doc(db, 'chatGroups', groupId, 'messages', messageId));
      setShowModeration(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const toggleLockGroup = async () => {
    if (!isAdmin || !groupId || !group) return;
    try {
      await updateDoc(doc(db, 'chatGroups', groupId), {
        isLocked: !group.isLocked
      });
      setGroup({ ...group, isLocked: !group.isLocked });
    } catch (error) {
      console.error("Error toggling lock:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">جاري دخول المجموعة...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 z-20">
        <button 
          onClick={() => navigate('/groups')}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <ArrowRight size={24} className="text-gray-600" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 truncate">{group?.name}</h2>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {group?.memberCount} طالب نشط
            </span>
            {group?.isLocked && (
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <Lock size={10} /> مغلق
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <button 
            onClick={toggleLockGroup}
            className={`p-2 rounded-xl transition-all ${group?.isLocked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}
          >
            {group?.isLocked ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
              <MessageCircle size={40} />
            </div>
            <div>
              <p className="font-bold text-gray-900">ابدأ المحادثة!</p>
              <p className="text-xs text-gray-500">كن أول من يرسل رسالة في هذه المجموعة.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            const isAi = msg.type === 'ai';
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img 
                    src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} 
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full bg-gray-200 shrink-0 border border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="space-y-1">
                    {!isMe && (
                      <span className="text-[10px] font-bold text-gray-500 px-1">
                        {msg.senderName}
                      </span>
                    )}
                    
                    <div 
                      onContextMenu={(e) => {
                        if (isAdmin) {
                          e.preventDefault();
                          setShowModeration(msg.id);
                        }
                      }}
                      className={`relative p-3 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : isAi 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tl-none'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {isAi && <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-300" />}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      
                      {isAdmin && showModeration === msg.id && (
                        <div className="absolute top-0 left-full ml-2 flex gap-1">
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="bg-red-500 text-white p-1.5 rounded-lg shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            onClick={() => setShowModeration(null)}
                            className="bg-gray-500 text-white p-1.5 rounded-lg shadow-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-1 text-[9px] text-gray-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <Clock size={8} />
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100 pb-8">
        {group?.isLocked ? (
          <div className="flex items-center justify-center gap-2 text-red-500 font-bold py-2 bg-red-50 rounded-xl">
            <Lock size={18} />
            هذه المجموعة مغلقة حالياً من قبل المشرف
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleAiAsk}
                disabled={!inputText.trim() || isAiLoading}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${
                  inputText.trim() && !isAiLoading
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                اسأل الذكاء الاصطناعي
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                >
                  <Smile size={20} />
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className={`p-3 rounded-2xl transition-all ${
                  inputText.trim() && !sending
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            
            <div className="flex gap-4 px-2">
              <button type="button" className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <ImageIcon size={14} className="text-blue-500" />
                صورة
              </button>
              <button type="button" className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Sparkles size={14} className="text-purple-500" />
                ملخص سريع
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Helper component for message circle
function MessageCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
    </svg>
  );
}
