import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Star } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BAC_SUBJECTS } from '../data/baccalaureate';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function Quiz() {
  const [view, setView] = useState<'subjects' | 'chapters' | 'quiz' | 'result'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserBranch = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const branch = userDoc.data().branch || 'sciences';
          setSubjects(BAC_SUBJECTS[branch] || BAC_SUBJECTS['sciences']);
        }
      }
    };
    fetchUserBranch();

    const q = query(collection(db, 'quizSessions'), orderBy('score', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
    });
    return () => unsubscribe();
  }, []);

  const generateQuiz = async (chapter: string) => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 to 10 multiple choice questions for Baccalaureate level in Algeria for chapter: ${chapter} in ${selectedSubject.name}. 
        Return as JSON array of objects with:
        - question (string)
        - options (array of 4 strings)
        - correctAnswer (string)
        - explanation (string: explain why this is the correct answer and why the others are incorrect)
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
      setQuestions(JSON.parse(response.text || "[]"));
      setView('quiz');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers({ ...userAnswers, [currentQuestionIndex]: answer });
  };

  const finishQuiz = async () => {
    let finalScore = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) finalScore++;
    });
    setScore(finalScore);
    setView('result');
    
    if (auth.currentUser) {
      await addDoc(collection(db, 'quizSessions'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'مستخدم',
        score: finalScore,
        totalQuestions: questions.length,
        subject: selectedSubject.name,
        createdAt: Date.now()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white p-6 rounded-b-3xl shadow-sm mb-6">
        <h1 className="text-3xl font-black text-gray-900">Quiz AI</h1>
        <p className="text-gray-500 font-medium">اختبر معلوماتك بالذكاء الاصطناعي</p>
      </header>

      <div className="px-6">
        <AnimatePresence mode="wait">
          {view === 'subjects' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 gap-4">
              {subjects.map((s) => (
                <button key={s.id} onClick={() => { setSelectedSubject(s); setView('chapters'); }} className={`${s.color} p-6 rounded-3xl flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all`}>
                  <span className="text-4xl">{s.icon}</span>
                  <span className="font-bold text-gray-900">{s.name}</span>
                </button>
              ))}
            </motion.div>
          )}

          {view === 'chapters' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <button onClick={() => setView('subjects')} className="text-blue-600 font-bold mb-4">← العودة للمواد</button>
              {['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'].map((c) => (
                <button key={c} onClick={() => generateQuiz(c)} className="w-full bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between hover:border-blue-200 border border-transparent transition-all">
                  <div>
                    <h3 className="font-bold text-gray-900">{c}</h3>
                    <p className="text-sm text-gray-500">صعوبة متوسطة</p>
                  </div>
                  <ChevronRight className="text-gray-400" />
                </button>
              ))}
            </motion.div>
          )}

          {view === 'quiz' && questions.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="mb-6 text-sm font-bold text-blue-600">سؤال {currentQuestionIndex + 1} / {questions.length}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-8">{questions[currentQuestionIndex].question}</h2>
              <div className="grid gap-4">
                {questions[currentQuestionIndex].options.map((opt: string) => (
                  <button 
                    key={opt} 
                    onClick={() => handleAnswer(opt)} 
                    disabled={userAnswers[currentQuestionIndex] !== undefined}
                    className={`p-4 rounded-xl font-medium text-right border-2 transition-all ${
                      userAnswers[currentQuestionIndex] === opt 
                        ? (opt === questions[currentQuestionIndex].correctAnswer ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50')
                        : (userAnswers[currentQuestionIndex] !== undefined && opt === questions[currentQuestionIndex].correctAnswer ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-gray-50')
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {userAnswers[currentQuestionIndex] !== undefined && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                  <p className="font-bold mb-1">الشرح:</p>
                  {questions[currentQuestionIndex].explanation}
                </motion.div>
              )}
              <div className="flex justify-between mt-8">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-600">السابق</button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <button onClick={finishQuiz} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white">إنهاء</button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white">التالي</button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-sm text-center">
              <Star className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-gray-900 mb-2">نتيجتك</h2>
              <p className="text-6xl font-black text-blue-600 mb-8">{score} / {questions.length}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 p-4 rounded-2xl text-green-700 font-bold">صحيح: {score}</div>
                <div className="bg-red-50 p-4 rounded-2xl text-red-700 font-bold">خطأ: {questions.length - score}</div>
              </div>
              <button onClick={() => setView('subjects')} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold">اختبار جديد</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
