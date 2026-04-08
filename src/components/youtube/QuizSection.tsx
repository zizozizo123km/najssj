import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, CheckCircle2, XCircle, Trophy, ArrowRight, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizSectionProps {
  questions: Question[];
  onRestart: () => void;
}

export default function QuizSection({ questions, onRestart }: QuizSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');

  const currentQuestion = questions[currentIdx];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);
    if (answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShortAnswer('');
    } else {
      setQuizComplete(true);
    }
  };

  if (quizComplete) {
    const percentage = (score / questions.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Trophy size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">أحسنت! لقد أكملت الاختبار</h2>
          <p className="text-gray-500 dark:text-gray-400">نتيجتك النهائية هي {score} من {questions.length}</p>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={`h-full ${percentage >= 50 ? 'bg-green-500' : 'bg-orange-500'}`}
          />
        </div>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all mx-auto shadow-lg active:scale-95"
        >
          <RefreshCw size={20} />
          <span>إعادة الاختبار</span>
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 max-w-2xl mx-auto">
      {/* Quiz Header */}
      <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <HelpCircle size={24} />
          <h2 className="text-xl font-bold">اختبر معلوماتك</h2>
        </div>
        <div className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border dark:border-gray-700">
          السؤال {currentIdx + 1} من {questions.length}
        </div>
      </div>

      {/* Question */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-relaxed">{currentQuestion.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.type === 'mcq' && currentQuestion.options?.map((option, i) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                  selectedAnswer
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 opacity-50'
                    : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="font-medium">{option}</span>
                {selectedAnswer && isCorrect && <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />}
                {selectedAnswer && isSelected && !isCorrect && <XCircle size={20} className="text-red-500 flex-shrink-0" />}
              </button>
            );
          })}

          {currentQuestion.type === 'true-false' && ['صحيح', 'خطأ'].map((option) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                  selectedAnswer
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 opacity-50'
                    : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="font-medium">{option}</span>
                {selectedAnswer && isCorrect && <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />}
                {selectedAnswer && isSelected && !isCorrect && <XCircle size={20} className="text-red-500 flex-shrink-0" />}
              </button>
            );
          })}

          {currentQuestion.type === 'short-answer' && (
            <div className="space-y-4">
              <input
                type="text"
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                disabled={!!selectedAnswer}
                placeholder="اكتب إجابتك هنا..."
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all text-gray-800 dark:text-white"
              />
              {!selectedAnswer && (
                <button
                  onClick={() => handleAnswer(shortAnswer)}
                  className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                  تأكيد الإجابة
                </button>
              )}
            </div>
          )}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-2"
            >
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <Lightbulb size={16} />
                <span>التفسير:</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{currentQuestion.explanation}</p>
              {currentQuestion.type === 'short-answer' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">الإجابة الصحيحة كانت: {currentQuestion.correctAnswer}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Button */}
        {selectedAnswer && (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-100 transition-all shadow-lg active:scale-95 mt-4"
          >
            <span>{currentIdx < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}</span>
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

const Lightbulb = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);
