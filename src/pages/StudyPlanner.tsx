import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, BookOpen, Save, Sparkles, ChevronRight } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { BAC_BRANCHES, BAC_SUBJECTS } from '../data/baccalaureate';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function StudyPlanner() {
  const [branch, setBranch] = useState(BAC_BRANCHES[0].id);
  const [wakeUp, setWakeUp] = useState('07:00');
  const [sleep, setSleep] = useState('23:00');
  const [hours, setHours] = useState(4);
  const [days, setDays] = useState<string[]>(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const branchName = BAC_BRANCHES.find(b => b.id === branch)?.name;
      const prompt = `Create a personalized study schedule for a Baccalaureate student in Algeria.
        Branch: ${branchName}
        Wake up: ${wakeUp}
        Sleep: ${sleep}
        Study hours per day: ${hours}
        Study days: ${days.join(', ')}
        Weak subjects: ${weakSubjects.join(', ')}
        
        Generate a structured daily study schedule for the selected study days.
        Return as JSON array of objects with keys: day, slots (array of {time, subject, topic}).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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

  const savePlan = () => {
    localStorage.setItem('studyPlan', JSON.stringify(plan));
    alert('Plan saved to profile!');
  };

  const toggleDay = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleSubject = (subject: string) => {
    setWeakSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900">AI Study Planner</h1>
        <p className="text-gray-500">Create a smart revision schedule using AI</p>
      </header>

      {!plan ? (
        <div className="space-y-6">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200">
            {BAC_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          
          <div className="grid grid-cols-2 gap-4">
            <input type="time" value={wakeUp} onChange={(e) => setWakeUp(e.target.value)} className="p-4 rounded-xl border border-gray-200" />
            <input type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} className="p-4 rounded-xl border border-gray-200" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Study hours: {hours}h</label>
            <input type="range" min="1" max="8" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full" />
          </div>

          <div className="flex flex-wrap gap-2">
            {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-1 rounded-full text-xs font-bold ${days.includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(BAC_SUBJECTS[branch] || []).map(subject => (
              <button 
                key={subject.id} 
                onClick={() => toggleSubject(subject.name)} 
                className={`px-3 py-1 rounded-full text-xs font-bold ${weakSubjects.includes(subject.name) ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
              >
                {subject.name}
              </button>
            ))}
          </div>

          <button onClick={generatePlan} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all">
            {loading ? 'Generating...' : 'Generate My Study Plan 🤖'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plan.map((day: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <h3 className="font-bold text-gray-900 border-b pb-2">{day.day}</h3>
              {day.slots.map((slot: any, j: number) => (
                <div key={j} className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-blue-600 w-20">{slot.time}</span>
                  <div>
                    <p className="font-bold text-gray-900">{slot.subject}</p>
                    <p className="text-gray-500 text-xs">{slot.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <button onClick={savePlan} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
            <Save size={20} /> Save to Profile
          </button>
        </div>
      )}
    </div>
  );
}
