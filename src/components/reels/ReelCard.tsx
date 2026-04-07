import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Sparkles, BrainCircuit, Loader2, X, Play, User, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getGeminiClient } from '../../lib/gemini';

interface ReelCardProps {
  reel: any;
  isActive: boolean;
}

export default function ReelCard({ reel, isActive }: ReelCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (analysis) {
      setShowAnalysis(true);
      return;
    }
    setAnalyzing(true);
    setShowAnalysis(true);
    try {
      const ai = await getGeminiClient();
      const prompt = `Analyze this educational short video for a Baccalaureate student in Algeria.
        IMPORTANT: Use the Algerian Arabic dialect (Darija) for the summary and notes.
        
        Title: ${reel.title}
        Description: ${reel.description || ''}
        
        Provide:
        1. A short educational summary in Algerian Darija (max 2 paragraphs).
        2. Key concepts (array of strings in Algerian Darija).
        3. Important notes for Bac students (array of strings in Algerian Darija).
        
        Return as JSON with keys: summary, keyPoints, importantNotes.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setAnalysis(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (quiz.length > 0) {
      setShowQuiz(true);
      return;
    }
    setAnalyzing(true);
    try {
      const prompt = `Based on this video analysis:
        Summary: ${analysis?.summary || ''}
        Key Points: ${analysis?.keyPoints?.join(', ') || ''}
        
        Generate a quiz for Bac students in Algeria.
        IMPORTANT: Use the Algerian Arabic dialect (Darija) for the questions and explanations.
        
        Generate:
        - 2 Multiple Choice Questions (MCQ)
        - 1 True/False Question
        
        Return as JSON array of objects with keys: id, type ('mcq', 'true-false'), question, options (for mcq), correctAnswer, explanation.`;

      const ai = await getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setQuiz(JSON.parse(response.text || '[]'));
      setShowQuiz(true);
    } catch (error) {
      console.error("Quiz error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full w-full relative snap-start bg-black flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          src={`https://www.youtube.com/embed/${reel.id}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${reel.id}&modestbranding=1&rel=0&enablejsapi=1`}
          className="w-full h-full pointer-events-none"
          title={reel.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
        {/* Overlay to catch clicks and prevent iframe interaction */}
        <div className="absolute inset-0 z-10" />
      </div>

      {/* Mute Toggle */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-30 p-2 bg-black/20 backdrop-blur-md border border-white/10 text-white rounded-full hover:bg-black/40 transition-all"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-6 items-center">
        <button 
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all ${liked ? 'text-red-500 scale-110' : 'text-white group-hover:scale-110'}`}>
            <Heart size={28} fill={liked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">{reel.likes + (liked ? 1 : 0)}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all group-hover:scale-110">
            <MessageCircle size={28} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">{reel.commentsCount || 0}</span>
        </button>

        <button 
          onClick={() => setSaved(!saved)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all ${saved ? 'text-yellow-400 scale-110' : 'text-white group-hover:scale-110'}`}>
            <Bookmark size={28} fill={saved ? 'currentColor' : 'none'} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">حفظ</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all group-hover:scale-110">
            <Share2 size={28} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">مشاركة</span>
        </button>

        <button 
          onClick={handleAnalyze}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 rounded-full bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white transition-all group-hover:scale-110 shadow-lg shadow-blue-500/20">
            <Sparkles size={28} />
          </div>
          <span className="text-[10px] font-bold text-white shadow-sm">تحليل</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {reel.subject || 'عام'}
          </span>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <User size={12} />
            <span className="font-medium">{reel.channelTitle}</span>
          </div>
        </div>
        <h3 className="text-white font-bold text-base leading-tight line-clamp-2 mb-2 max-w-[80%]">
          {reel.title}
        </h3>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Play size={10} />
          <span>{reel.viewCount || '0'} مشاهدة</span>
        </div>
      </div>

      {/* Analysis Overlay */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="absolute inset-x-0 bottom-0 top-1/4 bg-white rounded-t-3xl z-30 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles size={20} />
                <h4 className="font-bold">تحليل الفيديو الذكي</h4>
              </div>
              <button 
                onClick={() => { setShowAnalysis(false); setShowQuiz(false); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                  <p className="text-gray-500 font-bold animate-pulse">جاري التحليل بالدارجة...</p>
                </div>
              ) : showQuiz ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-gray-900">اختبر فهمك</h5>
                    <button 
                      onClick={() => setShowQuiz(false)}
                      className="text-xs text-blue-600 font-bold"
                    >
                      العودة للتحليل
                    </button>
                  </div>
                  {quiz.map((q, i) => (
                    <div key={q.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      <p className="text-sm font-bold text-gray-800">{i + 1}. {q.question}</p>
                      {q.type === 'mcq' && (
                        <div className="grid gap-2">
                          {q.options.map((opt: string) => (
                            <button key={opt} className="text-right p-2 text-xs bg-white border rounded-lg hover:border-blue-500 transition-colors">
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="p-2 bg-blue-100/50 rounded-lg text-[10px] text-blue-800">
                        <span className="font-bold">التفسير:</span> {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <section className="space-y-2">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                      ملخص الدرس (بالدارجة)
                    </h5>
                    <div className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <ReactMarkdown>{analysis?.summary}</ReactMarkdown>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-purple-600 rounded-full" />
                      النقاط الأساسية
                    </h5>
                    <ul className="space-y-2">
                      {analysis?.keyPoints?.map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="bg-purple-100 text-purple-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-red-600 rounded-full" />
                      ملاحظات للباك
                    </h5>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2">
                      {analysis?.importantNotes?.map((n: string, i: number) => (
                        <p key={i} className="text-xs text-red-800 flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                          {n}
                        </p>
                      ))}
                    </div>
                  </section>

                  <button
                    onClick={handleGenerateQuiz}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white p-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    <BrainCircuit size={20} />
                    <span>اختبر معلوماتي (Test Me)</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
