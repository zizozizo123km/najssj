import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, BookOpen, HelpCircle, Save, Trash2, Loader2, Youtube, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiConfig } from '../lib/gemini';
import MessageBubble from '../components/teacher/MessageBubble';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { auth, db, doc, onSnapshot, collection, addDoc, serverTimestamp } from '../lib/firebase';
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
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  // ... inside VirtualTeacher component ...
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'مرحباً بك! أنا أستاذك الافتراضي لمساعدتك في التحضير للبكالوريا. يمكنك سؤالي عن أي درس، أو إرسال تمرين لنحله معاً خطوة بخفوة. في أي مادة تريد البدء اليوم؟',
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

  const unlockAudio = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.01);
      }
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Audio unlock skipped or failed:', e);
    }
  };

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

  const handleSaveTeacherMessage = async (text: string) => {
    if (!auth.currentUser) {
      alert('يرجى تسجيل الدخول أولاً لتتمكن من حفظ هذا المخطط كملخص دراسي.');
      return;
    }
    try {
      await addDoc(collection(db, 'summaries'), {
        user_id: auth.currentUser.uid,
        title: `شرح الأستاذ لدرس: mادة ${selectedSubject || 'عامة'}`,
        content: text,
        subject: selectedSubject || 'عامة',
        created_at: serverTimestamp()
      });
      alert('تم حفظ الشرح في ملفك الشخصي وعلامات النشاط بنجاح! 💾✨');
    } catch (e) {
      console.error("Error saving teacher explanation:", e);
      alert('حدث خطأ أثناء حفظ الشرح كملخص.');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("عذراً، متصفحك لا يدعم التعرف على الصوت. يرجى استخدام متصفح Google Chrome.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-DZ';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? " " : "") + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const sendMessage = async (textOverride?: string) => {
    // Unlocks browser audio upon user interaction to allow auto-play of subsequent asynchronously loaded TTS voice
    unlockAudio();

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
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMessage = 'عذراً، أواجه مشكلة في الاتصال حالياً. يرجى المحاولة مرة أخرى.';
      if (error.message && error.message.includes("429")) {
        errorMessage = "لقد تجاوزت الحد المسموح به من الطلبات المجانية. يرجى المحاولة بعد قليل.";
      } else if (error.message) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.error && parsedError.error.code === 429) {
            errorMessage = "لقد تجاوزت الحد المسموح به من الطلبات المجانية. يرجى المحاولة بعد قليل.";
          }
        } catch (e) {
          // Ignore parse error
        }
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: errorMessage,
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
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full bg-[#F3F7FA] dark:bg-gray-950 font-sans max-w-xl md:max-w-4xl mx-auto shadow-xl overflow-hidden border border-gray-150 dark:border-gray-900 pb-20 rounded-3xl" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <TeacherAvatar />
          <div>
            <h1 className="font-black text-[15px] text-gray-900 dark:text-white">الأستاذ الافتراضي</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">متصل الآن لمساعدتك</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextMode = !isVoiceMode;
              setIsVoiceMode(nextMode);
              if (nextMode) {
                unlockAudio();
              }
            }}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all text-[11px] font-bold ${
              isVoiceMode 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 shadow-sm shadow-emerald-500/10' 
                : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-100'
            }`}
            title={isVoiceMode ? "الوضع الصوتي نشط - الأستاذ يتحدث تلقائياً" : "الوضع الصوتي متوقف"}
          >
            {isVoiceMode ? <Volume2 size={14} className="animate-bounce" /> : <VolumeX size={14} />}
            <span>الوضع الصوتي</span>
          </button>

          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-700 dark:text-gray-300 outline-none"
          >
            {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onSave={handleSaveTeacherMessage} 
              autoPlay={idx === messages.length - 1 && msg.role === 'model'}
            />
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
            placeholder={isListening ? "جاري الاستماع إليك... تحدث الآن" : "اسأل أستاذك عن أي شيء..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button 
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
            title={isListening ? "إيقاف الاستماع" : "التحدث بصوتك"}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>
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
