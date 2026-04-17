import React, { useState, useMemo } from 'react';
import { Calculator, ChevronLeft, Share2, MessageCircle, Facebook, Send } from 'lucide-react';

const SHIABA_DATA = {
  science: {
    name: "علوم تجريبية",
    subjects: [
      { name: "علوم الطبيعة والحياة", coef: 6 },
      { name: "العلوم الفيزيائية", coef: 5 },
      { name: "الرياضيات", coef: 5 },
      { name: "اللغة العربية", coef: 3 },
      { name: "الفلسفة", coef: 2 },
      { name: "التاريخ والجغرافيا", coef: 2 },
      { name: "اللغة الفرنسية", coef: 2 },
      { name: "اللغة الإنجليزية", coef: 2 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
      { name: "اللغة الأمازيغية (اختياري)", coef: 0 },
    ]
  },
  math: {
    name: "رياضيات",
    subjects: [
      { name: "الرياضيات", coef: 7 },
      { name: "العلوم الفيزيائية", coef: 6 },
      { name: "اللغة العربية", coef: 3 },
      { name: "علوم الطبيعة والحياة", coef: 2 },
      { name: "الفلسفة", coef: 2 },
      { name: "التاريخ والجغرافيا", coef: 2 },
      { name: "اللغة الفرنسية", coef: 2 },
      { name: "اللغة الإنجليزية", coef: 2 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
      { name: "اللغة الأمازيغية (اختياري)", coef: 0 },
    ]
  },
  tech: {
    name: "تقني رياضي",
    subjects: [
      { name: "التكنولوجيا (هندسة)", coef: 7 },
      { name: "الرياضيات", coef: 6 },
      { name: "العلوم الفيزيائية", coef: 6 },
      { name: "اللغة العربية", coef: 3 },
      { name: "الفلسفة", coef: 2 },
      { name: "التاريخ والجغرافيا", coef: 2 },
      { name: "اللغة الفرنسية", coef: 2 },
      { name: "اللغة الإنجليزية", coef: 2 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
      { name: "اللغة الأمازيغية (اختياري)", coef: 0 },
    ]
  },
  economy: {
    name: "تسيير واقتصاد",
    subjects: [
      { name: "تسيير محاسبي ومالي", coef: 6 },
      { name: "التاريخ والجغرافيا", coef: 4 },
      { name: "الاقتصاد والمناجمت", coef: 5 },
      { name: "الرياضيات", coef: 5 },
      { name: "اللغة العربية", coef: 3 },
      { name: "القانون", coef: 2 },
      { name: "الفلسفة", coef: 2 },
      { name: "اللغة الفرنسية", coef: 2 },
      { name: "اللغة الإنجليزية", coef: 2 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
    ]
  },
  literature: {
    name: "آداب وفلسفة",
    subjects: [
      { name: "الفلسفة", coef: 6 },
      { name: "اللغة العربية", coef: 6 },
      { name: "التاريخ والجغرافيا", coef: 4 },
      { name: "اللغة الإنجليزية", coef: 3 },
      { name: "اللغة الفرنسية", coef: 3 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "الرياضيات", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
    ]
  },
  languages: {
    name: "لغات أجنبية",
    subjects: [
      { name: "اللغة الأجنبية الثالثة", coef: 5 },
      { name: "اللغة العربية", coef: 5 },
      { name: "اللغة الفرنسية", coef: 5 },
      { name: "اللغة الإنجليزية", coef: 5 },
      { name: "التاريخ والجغرافيا", coef: 2 },
      { name: "الفلسفة", coef: 2 },
      { name: "العلوم الإسلامية", coef: 2 },
      { name: "الرياضيات", coef: 2 },
      { name: "التربية البدنية", coef: 1 },
    ]
  }
};

export default function BacCalculator() {
  const [view, setView] = useState('home'); // 'home' or 'calc'
  const [selectedShiaba, setSelectedShiaba] = useState<keyof typeof SHIABA_DATA | null>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [coefficients, setCoefficients] = useState<Record<number, number>>({});

  const handleSelectShiaba = (id: keyof typeof SHIABA_DATA) => {
    setSelectedShiaba(id);
    const initialMarks: Record<number, string> = {};
    const initialCoefs: Record<number, number> = {};
    SHIABA_DATA[id].subjects.forEach((sub, index) => {
      initialMarks[index] = "";
      initialCoefs[index] = sub.coef;
    });
    setMarks(initialMarks);
    setCoefficients(initialCoefs);
    setView('calc');
  };

  const calculateResult = useMemo(() => {
    let totalPoints = 0;
    let totalCoef = 0;

    Object.keys(marks).forEach(index => {
      const idx = parseInt(index);
      const mark = parseFloat(marks[idx]) || 0;
      const coef = parseFloat(coefficients[idx] as any) || 0;
      totalPoints += mark * coef;
      totalCoef += coef;
    });

    const average = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : "0.00";
    return { average, totalPoints, totalCoef };
  }, [marks, coefficients]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-right p-4 pb-32" dir="rtl">
        {/* Header */}
      <header className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-lg">
            <Calculator size={24} />
          </div>
          <h1 className="font-bold text-lg">حاسبة معدل البكالوريا</h1>
        </div>
        {view === 'calc' && (
          <button onClick={() => setView('home')} className="p-2 hover:bg-white/10 rounded-full">
            <ChevronLeft size={24} />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto">
        {view === 'home' ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-md">
              <h2 className="text-xl font-bold mb-2">احسب معدلك بسهولة</h2>
              <p className="text-sm text-indigo-100 leading-relaxed">
                اختر شعبتك وادخل علاماتك للحصول على المعدل النهائي بدقة حسب المعاملات الرسمية لوزارة التربية.
              </p>
            </div>

            <div className="grid gap-3">
              {(Object.entries(SHIABA_DATA) as [keyof typeof SHIABA_DATA, any][]).map(([id, data]) => (
                <button
                  key={id}
                  onClick={() => handleSelectShiaba(id)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex justify-between items-center group"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">حساب معدل {data.name}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                    <ChevronLeft size={18} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : selectedShiaba && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg text-amber-800 dark:text-amber-400 text-xs text-center">
              ملاحظة: يمكنك تعطيل أي مادة لا تدرسها بوضع المعامل الخاص بها 0.
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-3 text-right font-medium">المادة</th>
                    <th className="p-3 text-center font-medium w-20">المعامل</th>
                    <th className="p-3 text-center font-medium w-24">العلامة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SHIABA_DATA[selectedShiaba].subjects.map((sub, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{sub.name}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={coefficients[index]}
                          onChange={(e) => setCoefficients({...coefficients, [index]: parseFloat(e.target.value) || 0})}
                          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md p-2 text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          placeholder="00"
                          step="0.25"
                          min="0"
                          max="20"
                          value={marks[index]}
                          onChange={(e) => setMarks({...marks, [index]: e.target.value})}
                          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-md p-2 text-center focus:border-indigo-500 outline-none transition-colors font-bold text-indigo-600 dark:text-indigo-400 bg-transparent"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Results Bar */}
      {view === 'calc' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] p-4 max-w-md mx-auto rounded-t-3xl z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="text-right">
              <p className="text-slate-500 text-xs">المجموع العام</p>
              <p className="font-bold text-slate-800 dark:text-white">{calculateResult.totalPoints.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs">مجموع المعاملات</p>
              <p className="font-bold text-slate-800 dark:text-white">{calculateResult.totalCoef}</p>
            </div>
            <div className="bg-indigo-600 text-white px-6 py-2 rounded-2xl text-center">
              <p className="text-[10px] opacity-80 uppercase tracking-widest">المعدل</p>
              <p className="text-2xl font-black leading-none">{calculateResult.average}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
