import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Star, 
  Brain, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trophy,
  Lightbulb,
  ChevronLeft
} from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiClient } from '../lib/gemini';
import { auth, db, collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot, getDocs, query, where } from '../lib/firebase';
import { BAC_SUBJECTS, BAC_CHAPTERS, BAC_BRANCHES } from '../data/baccalaureate';

type View = 'subjects' | 'chapters' | 'quiz' | 'result';

export default function Quiz() {
  const [view, setView] = useState<View>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainingMistakes, setExplainingMistakes] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data();
        let userBranch = profile.branch || 'sciences';
        
        // Normalize branch (handle old data where branch might be a name)
        const branchById = BAC_BRANCHES.find(b => b.id === userBranch);
        const branchByName = BAC_BRANCHES.find(b => b.name === userBranch);
        if (!branchById && branchByName) {
          userBranch = branchByName.id;
        }

        setSubjects(BAC_SUBJECTS[userBranch] || BAC_SUBJECTS['sciences']);
        setLoadingSubjects(false);
      } else {
        setSubjects(BAC_SUBJECTS['sciences']);
        setLoadingSubjects(false);
      }
    }, (error) => {
      console.error("Error fetching profile for quiz:", error);
      setSubjects(BAC_SUBJECTS['sciences']);
      setLoadingSubjects(false);
    });

    return () => unsubscribe();
  }, []);

  const generateQuiz = async (chapter: any) => {
    setLoading(true);
    setSelectedChapter(chapter);
    try {
      const ai = await getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate 5 multiple choice questions for Baccalaureate level in Algeria for chapter: ${chapter.name} in ${selectedSubject.name}. 
        Return as JSON array of objects with:
        - question (string)
        - options (array of 4 strings)
        - correctAnswer (string)
        - explanation (string: brief explanation)
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
            },
          },
        },
      });
      const data = JSON.parse(response.text || "[]");
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setView('quiz');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (userAnswers[currentQuestionIndex] !== undefined) return;
    setUserAnswers({ ...userAnswers, [currentQuestionIndex]: answer });
  };

  const finishQuiz = async () => {
    let finalScore = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) finalScore++;
    });
    setScore(finalScore);
    setView('result');
    
    const user = auth.currentUser;
    if (user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check daily limit
        const dailyQuizzesSnapshot = await getDocs(query(
          collection(db, 'quiz_sessions'),
          where('user_id', '==', user.uid),
          where('date', '==', today)
        ));
        
        if (dailyQuizzesSnapshot.size >= 5) {
          alert("لقد تجاوزت الحد اليومي للاختبارات (5 اختبارات). حاول غداً!");
          return;
        }

        await addDoc(collection(db, 'quiz_sessions'), {
          user_id: user.uid,
          user_name: user.displayName || 'مستخدم',
          score: finalScore,
          total_questions: questions.length,
          subject: selectedSubject.name,
          chapter: selectedChapter.name,
          date: today,
          created_at: serverTimestamp()
        });
      } catch (e) {
        console.error("Error saving quiz result:", e);
      }
    }
  };

  const explainMistakes = async () => {
    setExplainingMistakes(true);
    try {
      const mistakes = questions.filter((q, i) => userAnswers[i] !== q.correctAnswer);
      if (mistakes.length === 0) {
        setExplanation("أحسنت! لم ترتكب أي أخطاء.");
        return;
      }

      const prompt = `I took a quiz on ${selectedSubject.name} - ${selectedChapter.name}. 
      I got these questions wrong:
      ${mistakes.map((m, i) => `Q: ${m.question}\nMy answer: ${userAnswers[questions.indexOf(m)]}\nCorrect answer: ${m.correctAnswer}`).join('\n\n')}
      
      Please explain my mistakes simply in Arabic and give me tips to improve.`;

      const ai = await getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      setExplanation(response.text || "عذراً، لم أتمكن من توليد الشرح.");
    } catch (error) {
      console.error(error);
      setExplanation("حدث خطأ أثناء محاولة شرح الأخطاء.");
    } finally {
      setExplainingMistakes(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="text-indigo-600" size={28} />
              Quiz AI
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">اختبر معلوماتك بالذكاء الاصطناعي</p>
          </div>
          {view !== 'subjects' && (
            <button 
              onClick={() => {
                if (view === 'chapters') setView('subjects');
                else if (view === 'quiz') {
                  if (window.confirm('هل تريد حقاً الخروج من الاختبار؟')) setView('chapters');
                }
                else if (view === 'result') setView('subjects');
              }}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-90 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="px-6 mt-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'subjects' && (
            <motion.div 
              key="subjects"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              className="space-y-6"
            >
              {loadingSubjects ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                  <p className="text-slate-500 font-bold">جاري تحميل المواد الدراسية...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {subjects.map((s) => (
                    <button 
                      key={s.id} 
                      onClick={() => { setSelectedSubject(s); setView('chapters'); }} 
                      className={`${s.color} p-6 rounded-[2rem] flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95 border-b-4 border-black/10`}
                    >
                      <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                        {s.icon}
                      </div>
                      <span className="font-black text-sm text-center leading-tight">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'chapters' && (
            <motion.div 
              key="chapters"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${selectedSubject.color} rounded-2xl flex items-center justify-center text-2xl`}>
                  {selectedSubject.icon}
                </div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white">{selectedSubject.name}</h2>
                  <p className="text-xs text-slate-500">اختر فصلاً لبدء الاختبار</p>
                </div>
              </div>

              {(BAC_CHAPTERS[selectedSubject.id] || []).map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => generateQuiz(c)} 
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-900 border border-transparent transition-all active:scale-[0.98] group"
                >
                  <div className="text-right flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">{c.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                        c.difficulty === 'medium' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {c.difficulty === 'easy' ? 'سهل' : c.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{c.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {loading && selectedChapter?.id === c.id ? <Loader2 className="animate-spin" size={20} /> : <ChevronLeft size={20} />}
                  </div>
                </button>
              ))}

              {(!BAC_CHAPTERS[selectedSubject.id] || BAC_CHAPTERS[selectedSubject.id].length === 0) && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500">لا توجد فصول مسجلة لهذه المادة بعد.</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'quiz' && questions.length > 0 && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-500">
                  <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                  <span className="text-indigo-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 leading-relaxed text-center">
                  {currentQuestion.question}
                </h2>
                
                <div className="grid gap-4">
                  {currentQuestion.options.map((opt: string, idx: number) => {
                    const isSelected = userAnswers[currentQuestionIndex] === opt;
                    const isCorrect = opt === currentQuestion.correctAnswer;
                    const hasAnswered = userAnswers[currentQuestionIndex] !== undefined;

                    return (
                      <button 
                        key={idx} 
                        onClick={() => handleAnswer(opt)} 
                        disabled={hasAnswered}
                        className={`p-5 rounded-2xl font-bold text-right border-2 transition-all flex items-center justify-between group active:scale-[0.98] ${
                          isSelected 
                            ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400')
                            : (hasAnswered && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400')
                        }`}
                      >
                        <span className="flex-1">{opt}</span>
                        {hasAnswered && isCorrect && <CheckCircle2 size={20} className="shrink-0 ml-2" />}
                        {hasAnswered && isSelected && !isCorrect && <XCircle size={20} className="shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {userAnswers[currentQuestionIndex] !== undefined && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      <Lightbulb size={16} />
                      <span>توضيح:</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-4 mt-10">
                  <button 
                    disabled={currentQuestionIndex === 0} 
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} 
                    className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-all active:scale-95"
                  >
                    السابق
                  </button>
                  {currentQuestionIndex === questions.length - 1 ? (
                    <button 
                      disabled={userAnswers[currentQuestionIndex] === undefined}
                      onClick={finishQuiz} 
                      className="flex-[2] py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all active:scale-95"
                    >
                      إنهاء الاختبار
                    </button>
                  ) : (
                    <button 
                      disabled={userAnswers[currentQuestionIndex] === undefined}
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)} 
                      className="flex-[2] py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all active:scale-95"
                    >
                      السؤال التالي
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm text-center border border-slate-100 dark:border-slate-800">
                <div className="relative inline-block mb-6">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="absolute -top-2 -right-2 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white dark:border-slate-900"
                  >
                    {Math.round((score / questions.length) * 100)}%
                  </motion.div>
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">أحسنت!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">لقد أكملت اختبار {selectedChapter.name}</p>
                
                <div className="text-7xl font-black text-indigo-600 mb-10 tracking-tighter">
                  {score} <span className="text-3xl text-slate-300 dark:text-slate-700 font-medium">/ {questions.length}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-3xl border border-green-100 dark:border-green-900/50">
                    <div className="text-green-600 dark:text-green-400 font-black text-2xl">{score}</div>
                    <div className="text-green-500 text-[10px] font-bold uppercase tracking-wider">إجابة صحيحة</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/50">
                    <div className="text-red-600 dark:text-red-400 font-black text-2xl">{questions.length - score}</div>
                    <div className="text-red-50 text-[10px] font-bold uppercase tracking-wider">إجابة خاطئة</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {score < questions.length && (
                    <button 
                      onClick={explainMistakes} 
                      disabled={explainingMistakes}
                      className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border border-indigo-100 dark:border-indigo-900/50"
                    >
                      {explainingMistakes ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      اشرح لي أخطائي بالذكاء الاصطناعي
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setView('subjects')} 
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all"
                  >
                    اختبار جديد
                  </button>
                </div>

                {explanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-8 text-right bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400 font-bold">
                      <Brain size={18} />
                      <span>تحليل الذكاء الاصطناعي:</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {explanation}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-10 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <Brain className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">جاري توليد الاختبار...</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">يقوم الذكاء الاصطناعي الآن بتحليل الفصل وتجهيز أسئلة مخصصة لك</p>
        </div>
      )}
    </div>
  );
}

const Sparkles = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
