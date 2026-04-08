import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Lightbulb, Clock, Save, Star, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VideoSummaryProps {
  summary: {
    summary: string;
    clarifications: string[];
    boardExplanation: string;
    keyPoints: string[];
    importantNotes: string[];
    timestamps?: { time: string; topic: string }[];
  };
  onSave: () => void;
  onRate: (rating: number) => void;
  rating: number;
}

export default function VideoSummary({ summary, onSave, onRate, rating }: VideoSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 space-y-8"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <BookOpen size={24} />
          <h2 className="text-xl font-bold">التحليل التعليمي</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate(star)}
                className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200 dark:hover:text-yellow-500'}`}
              >
                <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Save size={18} />
            <span>حفظ في ملاحظاتي</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <CheckCircle size={20} className="text-green-500" />
          <h3>ملخص الدرس</h3>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
          <ReactMarkdown>{summary.summary}</ReactMarkdown>
        </div>
      </section>

      {/* Board Explanation */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <BrainCircuit size={20} className="text-blue-500" />
          <h3>شرح السبورة</h3>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <ReactMarkdown>{summary.boardExplanation}</ReactMarkdown>
        </div>
      </section>

      {/* Clarifications */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <Lightbulb size={20} className="text-purple-500" />
          <h3>توضيحات إضافية</h3>
        </div>
        <ul className="space-y-2">
          {summary.clarifications.map((clarification, i) => (
            <li key={i} className="flex items-start gap-2 bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-300 border border-purple-100 dark:border-purple-900/30">
              <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
              {clarification}
            </li>
          ))}
        </ul>
      </section>

      {/* Key Points */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <Lightbulb size={20} className="text-yellow-500" />
          <h3>النقاط الأساسية</h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summary.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-300 border border-blue-100 dark:border-blue-900/30">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* Important Notes for Bac */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <Star size={20} className="text-red-500" />
          <h3>ملاحظات هامة للبكالوريا</h3>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 rounded-l-xl space-y-2">
          {summary.importantNotes.map((note, i) => (
            <p key={i} className="text-sm text-red-800 dark:text-red-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              {note}
            </p>
          ))}
        </div>
      </section>

      {/* Timestamps */}
      {summary.timestamps && summary.timestamps.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
            <Clock size={20} className="text-indigo-500" />
            <h3>أهم اللحظات في الفيديو</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.timestamps.map((ts, i) => (
              <div key={i} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px]">{ts.time}</span>
                {ts.topic}
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
