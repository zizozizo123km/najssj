import { useState } from 'react';
import { Sparkles, History, Zap, BellRing, Target, Loader2 } from 'lucide-react';
import { db, collection, getDocs, query, where } from '../../lib/firebase';

const CAMPAIGNS = [
  {
    id: 'inactivity',
    title: 'تنبيه الغياب',
    description: 'إرسال للطلاب الذين لم يدخلوا منذ فترة طويلة',
    icon: History,
    color: 'bg-red-500/10 text-red-500',
    messages: [
      { title: 'وينك يا بطل؟', body: 'عندك بزااف ماش دخلت تراجع.. الباك راه قرب والوقت يجري!' },
      { title: 'الباك ما يستنى حد!', body: 'راك غايب هاد الأيام، أرواح تضرب طلة على الملخصات راهي تستنى فيك.' }
    ]
  },
  {
    id: 'motivation',
    title: 'تحفيز عام',
    description: 'كلمات تشجيعية لكل الطلاب المسجلين',
    icon: Zap,
    color: 'bg-yellow-500/10 text-yellow-500',
    messages: [
      { title: 'راك تتطور!', body: 'مستواك راهو يتحسن يوم بعد يوم، كمل هكذا والنجاح مضمون بإذن الله.' },
      { title: 'أنت قدها!', body: 'ما تستهينش بالقدرات تاعك، شوية مراجعة وتكون من الأوائل.' }
    ]
  },
  {
    id: 'exam_prep',
    title: 'قرب الباك',
    description: 'رسائل حماسية بخصوص اقتراب موعد الامتحانات',
    icon: Target,
    color: 'bg-blue-500/10 text-blue-500',
    messages: [
      { title: 'العد التنازلي بدأ!', body: 'ما بقاش بزاف على الحلم، نوض بريزونطي شوية وربي يوفقك.' },
      { title: 'فرحة والديك تستنى!', body: 'تخيل نهار النتائج وفرحة الوالدين.. الباك يستاهل التعب.' }
    ]
  }
];

export default function EngagementTool() {
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 5));

  const runCampaign = async (campaignId: string) => {
    const campaign = CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign) return;

    setLoading(campaignId);
    addLog(`بدء حملة: ${campaign.title}...`);

    try {
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const activeTokens = profilesSnap.docs
        .map(doc => doc.data().fcm_token)
        .filter(token => !!token);

      if (activeTokens.length === 0) {
        addLog('خطأ: لا يوجد أجهزة مسجلة حالياً.');
        setLoading(null);
        return;
      }

      addLog(`تم العثور على ${activeTokens.length} جهاز مفعل.`);

      let successCount = 0;
      for (const token of activeTokens) {
        // Pick a random message from the campaign pool
        const msg = campaign.messages[Math.floor(Math.random() * campaign.messages.length)];
        
        try {
          const res = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: msg.title, 
              body: msg.body, 
              token 
            })
          });
          if (res.ok) successCount++;
        } catch (e) {
          console.error(e);
        }
      }

      addLog(`تمت العملية! بنجاح: ${successCount} من ${activeTokens.length}`);
    } catch (error) {
      addLog('حدث خطأ فني أثناء الإرسال.');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">حملات التفاعل والتحفيز</h2>
          <p className="text-gray-400 text-sm">أرسل إشعارات ذكية لزيادة نشاط الطلاب في التطبيق</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {CAMPAIGNS.map((c) => (
          <button
            key={c.id}
            onClick={() => runCampaign(c.id)}
            disabled={!!loading}
            className="flex flex-col items-center text-center p-6 bg-gray-900/50 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`p-4 rounded-full mb-4 group-hover:scale-110 transition-transform ${c.color}`}>
              <c.icon size={32} />
            </div>
            <h3 className="font-bold text-white mb-2">{c.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {c.description}
            </p>
            
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-500">
              {loading === c.id ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <BellRing size={14} />
                  إرسال الآن
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {log.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">سجل النشاط الأخير</h4>
          <div className="space-y-2">
            {log.map((entry, i) => (
              <div key={i} className="text-sm text-gray-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
