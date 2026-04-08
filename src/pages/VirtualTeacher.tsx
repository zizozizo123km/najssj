import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, BookOpen, HelpCircle, Save, Trash2, Loader2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiConfig } from '../lib/gemini';
import MessageBubble from '../components/teacher/MessageBubble';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { auth, db, doc, onSnapshot } from '../lib/firebase';
import { BAC_SUBJECTS, BAC_BRANCHES } from '../data/baccalaureate';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
}

export default function VirtualTeacher() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  // ... inside VirtualTeacher component ...
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'مرحباً بك! أنا أستاذك الافتراضي لمساعدتك في التحضير للبكالوريا. يمكنك سؤالي عن أي درس، أو إرسال تمرين لنحله معاً خطوة بخطوة. في أي مادة تريد البدء اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Added error state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data();
        setUserProfile(profile);
        const branch = profile.branch || 'sciences';
        const subjects = BAC_SUBJECTS[branch] || BAC_SUBJECTS['sciences'];
        setAvailableSubjects(subjects);
        if (!selectedSubject && subjects.length > 0) {
          setSelectedSubject(subjects[0].name);
        }
      }
    }, (error) => {
      console.error("Error fetching profile for virtual teacher:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !image) return;

    // Word count check
    const wordCount = textToSend.trim().split(/\s+/).length;
    if (wordCount > 50) {
      setError('عذراً، يجب ألا يتجاوز سؤالك 50 كلمة.');
      return;
    }

    // Daily limit check
    const today = new Date().toDateString();
    const dailyUsage = JSON.parse(localStorage.getItem('ai_usage') || '{"date": "", "count": 0}');
    
    if (dailyUsage.date === today && dailyUsage.count >= 20) {
      setError('لقد وصلت إلى الحد الأقصى للأسئلة اليومية (20 سؤالاً).');
      return;
    }

    setError(''); // Clear errors
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      image: image || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setLoading(true);

    // Update usage count
    const newCount = dailyUsage.date === today ? dailyUsage.count + 1 : 1;
    localStorage.setItem('ai_usage', JSON.stringify({ date: today, count: newCount }));

    try {
      const { client: ai, model } = await getGeminiConfig();
      const branchName = BAC_BRANCHES.find(b => b.id === userProfile?.branch)?.name || 'علوم تجريبية';
      const studentName = userProfile?.full_name || 'تلميذي العزيز';

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: `أنت "الأستاذ الافتراضي" (Virtual Teacher)، خبير في المناهج التعليمية الجزائرية للبكالوريا. 
          أنت تخاطب الطالب "${studentName}" من شعبة "${branchName}".
          مهمتك هي مساعدة الطلاب في فهم الدروس، حل التمارين خطوة بخطوة، وتقديم ملخصات واختبارات سريعة.
          المواد المتاحة للطالب حالياً: ${availableSubjects.map(s => s.name).join(', ')}.
          أسلوبك: مشجع، واضح، تعليمي، ومبسط. 
          هام جداً: تكلم بلهجة جزائرية (دارجة) مفهومة ومحببة للطلاب لتكون قريباً منهم، لكن حافظ على دقة المصطلحات العلمية والتقنية.
          عند حل التمارين، لا تعطي الحل مباشرة، بل اشرح الخطوات والقواعد المستخدمة.
          المادة الحالية المختارة: ${selectedSubject}.
          قيد هام: يجب ألا يتجاوز ردك 50 كلمة كحد أقصى.`
        }
      });

      let response;
      if (userMessage.image) {
        const base64Data = userMessage.image.split(',')[1];
        response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              parts: [
                { text: textToSend || "حل هذا التمرين من فضلك" },
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
              ]
            }
          ]
        });
      } else {
        response = await chat.sendMessage({ message: textToSend });
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'عذراً، حدث خطأ في معالجة طلبك.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'عذراً، أواجه مشكلة في الاتصال حالياً. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickAction = (type: 'explain' | 'exercise' | 'quiz') => {
    let prompt = '';
    switch (type) {
      case 'explain': prompt = `اشرح لي درس [اسم الدرس] في مادة ${selectedSubject} كأنني مبتدئ.`; break;
      case 'exercise': prompt = `أعطني تمريناً تدريبياً في مادة ${selectedSubject} حول [الموضوع].`; break;
      case 'quiz': prompt = `قم بإنشاء اختبار قصير (Quiz) من 3 أسئلة في مادة ${selectedSubject}.`; break;
    }
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans max-w-4xl mx-auto shadow-xl rounded-2xl overflow-hidden border border-gray-200 pb-20">
      {/* Header */}
      <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <TeacherAvatar />
          <div>
            <h1 className="font-bold text-gray-900">الأستاذ الافتراضي</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium">متصل الآن لمساعدتك</span>
            </div>
          </div>
        </div>
        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="text-xs bg-gray-100 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
        >
          {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-6"
            >
              <TeacherAvatar />
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={18} />
                <span className="text-sm text-gray-500 italic">الأستاذ يفكر...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-50 scrollbar-none">
        <button 
          onClick={() => quickAction('explain')}
          className="flex items-center gap-1.5 whitespace-nowrap bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
        >
          <Sparkles size={14} /> اشرح لي كأنني مبتدئ
        </button>
        <button 
          onClick={() => quickAction('exercise')}
          className="flex items-center gap-1.5 whitespace-nowrap bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors"
        >
          <BookOpen size={14} /> أعطني تمريناً
        </button>
        <button 
          onClick={() => quickAction('quiz')}
          className="flex items-center gap-1.5 whitespace-nowrap bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-100 transition-colors"
        >
          <HelpCircle size={14} /> أنشئ اختباراً
        </button>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xs text-center mb-2">
            {error}
          </div>
        )}
        {image && (
          <div className="relative inline-block mb-3">
            <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500 shadow-md" />
            <button 
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-transform hover:scale-110"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ImageIcon size={22} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="اسأل أستاذك عن أي شيء..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button 
            onClick={() => sendMessage()}
            disabled={loading || (!input.trim() && !image)}
            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
