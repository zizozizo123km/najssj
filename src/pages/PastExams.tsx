import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PastExams() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 transition-colors overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-4 transition-colors">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white">مواضيع بكالوريا سابقة</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">بوابة الامتحانات الوطنية - dzexams</p>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-900">
        <iframe 
          id="siteFrame" 
          src="https://www.dzexams.com/ar/bac" 
          title="موقع الامتحانات"
          className="w-full h-full border-none"
          loading="lazy"
        />
      </div>
    </div>
  );
}
