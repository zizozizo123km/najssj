import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, BookOpen, Save, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { getGeminiConfig } from '../lib/gemini';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../data/baccalaureate';
import { auth, db, doc, onSnapshot, updateDoc, serverTimestamp } from '../lib/firebase';

const DAYS_MAP: Record<string, string> = {
  'Saturday': 'السبت',
  'Sunday': 'الأحد',
  'Monday': 'الاثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة'
};

export default function StudyPlanner() {
  const [branch, setBranch] = useState(BAC_BRANCHES[0].id);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [wakeUp, setWakeUp] = useState('07:00');
  const [sleep, setSleep] = useState('23:00');
  const [hours, setHours] = useState(4);
  const [days, setDays] = useState<string[]>(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data();
        setUserProfile(profile);
        if (profile.branch) {
          setBranch(profile.branch);
        }
        if (profile.study_plan) {
          setPlan(profile.study_plan);
        }
      }
    }, (error) => {
      console.error("Error fetching study plan:", error);
    });

    return () => unsubscribe();
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const { client: ai, model } = await getGeminiConfig();
      const branchName = BAC_BRANCHES.find(b => b.id === branch)?.name;
      const prompt = `أنت خبير في تنظيم الوقت والدراسة لطلاب البكالوريا في الجزائر.
        أنشئ جدول دراسة مخصص للطالب بناءً على المعلومات التالية:
        الشعبة: ${branchName}
        وقت الاستيقاظ: ${wakeUp}
        وقت النوم: ${sleep}
        عدد ساعات الدراسة اليومية: ${hours}
        أيام الدراسة: ${days.map(d => DAYS_MAP[d]).join(', ')}
        المواد التي يعاني فيها الطالب من ضعف: ${weakSubjects.join(', ')}
        
        المتطلبات:
        1. وزع المواد بذكاء مع التركيز أكثر على مواد الضعف والمواد الأساسية للشعبة.
        2. اجعل الفترات الدراسية تتخللها فترات راحة قصيرة.
        3. يجب أن يكون الرد بتنسيق JSON فقط كصفوفة من الكائنات بالمفاتيح التالية: day (اسم اليوم بالعربية), slots (مصفوفة من الكائنات تحتوي على time, subject, topic باللغة العربية).`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setPlan(JSON.parse(response.text || '[]'));
    } catch (error) {
      console.error("Plan generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!auth.currentUser || !plan) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
        study_plan: plan,
        updated_at: serverTimestamp()
      });
      alert('تم حفظ الجدول في ملفك الشخصي بنجاح! ✅');
    } catch (error) {
      console.error("Error saving plan:", error);
      alert('حدث خطأ أثناء حفظ الجدول.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleSubject = (subject: string) => {
    setWeakSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-8" dir="rtl">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900">مخطط الدراسة الذكي</h1>
        <p className="text-gray-500">أنشئ جدول مراجعة ذكي باستخدام الذكاء الاصطناعي</p>
      </header>

      {!plan ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">اختر شعبتك:</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 bg-white">
              {BAC_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">وقت الاستيقاظ:</label>
              <input type="time" value={wakeUp} onChange={(e) => setWakeUp(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">وقت النوم:</label>
              <input type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">ساعات الدراسة اليومية: {hours}س</label>
            <input type="range" min="1" max="8" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">أيام الدراسة:</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DAYS_MAP).map(([id, name]) => (
                <button key={id} onClick={() => toggleDay(id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${days.includes(id) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">حدد المواد التي تعاني فيها من ضعف:</label>
            <div className="flex flex-wrap gap-2">
              {(BAC_SUBJECTS[branch] || []).map(subject => (
                <button 
                  key={subject.id} 
                  onClick={() => toggleSubject(subject.name)} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${weakSubjects.includes(subject.name) ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generatePlan} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? 'جاري إنشاء الجدول...' : 'إنشاء خطتي الدراسية 🤖'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">جدولك الدراسي المقترح</h2>
            <button onClick={() => setPlan(null)} className="text-sm font-bold text-blue-600 hover:underline">تعديل الخيارات</button>
          </div>
          
          {plan.map((day: any, i: number) => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                <Calendar size={18} className="text-blue-600" />
                <h3 className="font-black text-gray-900">{day.day}</h3>
              </div>
              <div className="space-y-4">
                {day.slots.map((slot: any, j: number) => (
                  <div key={j} className="flex items-start gap-4">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg min-w-[80px] justify-center">
                      <Clock size={12} />
                      <span>{slot.time}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-gray-900 text-sm">{slot.subject}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{slot.topic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex gap-3">
            <button onClick={savePlan} disabled={saving} className="flex-1 bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'جاري الحفظ...' : 'حفظ الجدول'}
            </button>
            <button onClick={() => setPlan(null)} className="px-6 bg-gray-100 text-gray-600 p-4 rounded-xl font-bold hover:bg-gray-200 transition-all">
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
