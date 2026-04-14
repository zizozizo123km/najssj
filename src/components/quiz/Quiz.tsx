import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { QuizQuestion } from '../../data/quizData';

interface QuizProps {
  question: QuizQuestion;
  onComplete: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ question, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-[#0f172a] min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onComplete} className="text-white"><X /></button>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-1/3" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-green-500 p-6 rounded-3xl mb-8 text-center">
              <h2 className="text-xl font-bold text-white">{question.question}</h2>
            </div>
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  className="w-full p-4 text-left bg-[#1e293b] text-white rounded-2xl border-2 border-transparent hover:border-green-500 transition-all"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-green-500 p-6 rounded-3xl mb-6">
              <h2 className="text-xl font-bold text-white mb-2">العقيدة الإسلامية</h2>
              <p className="text-white/80">العنصر 1 من 3</p>
            </div>
            
            <div className="bg-[#1e293b] p-6 rounded-3xl text-white space-y-6">
              <h3 className="text-lg font-bold text-green-400 border-b border-slate-700 pb-2">تعريف العقيدة الإسلامية</h3>
              {question.explanation.map((item, i) => (
                <div key={i}>
                  <h4 className="font-bold mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {item.title}
                  </h4>
                  <p className="text-slate-300 text-sm">{item.content}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={onComplete}
              className="w-full mt-8 bg-green-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Check /> مفهوم
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
