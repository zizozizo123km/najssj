import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { auth, db, doc, setDoc, serverTimestamp } from '../lib/firebase';
import { BAC_BRANCHES } from '../data/baccalaureate';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  { id: 'gender', question: 'ملخر ا ناس، نتا طفل ولا طفلة؟', options: [{id: 'male', name: 'ذكر'}, {id: 'female', name: 'أنثى'}] },
  { id: 'branch', question: 'واش هي شعبتك؟', options: BAC_BRANCHES },
  { id: 'status', question: 'هل أنت طالب نظامي أم حر؟', options: [{id: 'regular', name: 'نظامي'}, {id: 'free', name: 'حر'}] },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleNext = async () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Save to Firebase
      if (auth.currentUser) {
        await setDoc(doc(db, 'profiles', auth.currentUser.uid), {
          ...answers,
          completedOnboarding: true,
          updated_at: serverTimestamp()
        }, { merge: true });
      }
      onComplete();
    }
  };

  const currentStep = steps[stepIndex];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="bg-[#1e293b] p-6 rounded-3xl max-w-sm w-full relative">
          <p className="text-lg">{currentStep.question}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1e293b] rotate-45" />
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          {currentStep.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setAnswers({...answers, [currentStep.id]: option.id})}
              className={`p-4 rounded-2xl border-2 transition-all ${answers[currentStep.id] === option.id ? 'border-green-500 bg-green-500/10' : 'border-[#1e293b] bg-[#1e293b]'}`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!answers[currentStep.id]}
        className="w-full bg-green-500 py-4 rounded-2xl font-bold disabled:opacity-50"
      >
        التالي
      </button>
    </div>
  );
}
