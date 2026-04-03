import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get('term') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const generateQuiz = async (overrideSubject?: string, overrideTerm?: string) => {
    const activeSubject = overrideSubject || subject;
    const activeTerm = overrideTerm || term;
    
    if (!activeSubject || !activeTerm) return;

    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 10 multiple choice questions for Baccalaureate level in Algeria for ${activeSubject} in ${activeTerm} term. Return as JSON array of objects with question, options (array of 3 strings), and answer.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
              },
              required: ["question", "options", "answer"],
            },
          },
        },
      });
      setQuestions(JSON.parse(response.text || "[]"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const s = searchParams.get('subject');
    const t = searchParams.get('term');
    if (s && t) {
      generateQuiz(s, t);
    }
  }, []);

  const handleAnswer = (option: string) => {
    if (option === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowScore(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto font-sans">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">اختبارات البكالوريا</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <select onChange={(e) => setTerm(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">اختر الفصل</option>
            <option value="الفصل الأول">الفصل الأول</option>
            <option value="الفصل الثاني">الفصل الثاني</option>
            <option value="الفصل الثالث">الفصل الثالث</option>
          </select>
          <input type="text" placeholder="المادة (مثال: رياضيات)" onChange={(e) => setSubject(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => generateQuiz()} disabled={loading || !term || !subject} className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400">
            {loading ? 'جاري التحميل...' : 'ابدأ الاختبار'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      {showScore ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-3xl font-bold mb-4">نتيجتك النهائية</h2>
          <p className="text-5xl font-bold text-blue-600">{score} / {questions.length}</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800">إعادة الاختبار</button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 text-sm font-medium text-gray-500">سؤال {currentQuestion + 1} من {questions.length}</div>
          <h2 className="text-2xl font-semibold mb-8 text-gray-900">{questions[currentQuestion].question}</h2>
          <div className="grid grid-cols-1 gap-4">
            {questions[currentQuestion].options.map((option: string) => (
              <button key={option} onClick={() => handleAnswer(option)} className="text-right bg-gray-50 p-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all font-medium">
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
