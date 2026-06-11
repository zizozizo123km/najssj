import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Timer } from 'lucide-react';

const BAC_DATE = new Date('2027-06-06T08:00:00'); // Estimated date for Bac 2027

export default function BacCountdown() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +BAC_DATE - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const CircularStat = ({ value, label, max, color }: { value: number, label: string, max: number, color: string }) => {
    const percentage = (value / max) * 100;
    const strokeDasharray = 251.2; // 2 * pi * 40
    const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform">
            <circle
              cx="50%"
              cy="50%"
              r="34"
              className="fill-none stroke-white/10"
              strokeWidth="6"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="34"
              className={`fill-none ${color}`}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ strokeDasharray }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg md:text-xl font-black text-white">{value}</span>
          </div>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-white/70">{label}</span>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#1B7063] rounded-[32px] p-6 md:p-8 shadow-xl relative overflow-hidden group"
      dir="rtl"
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-white rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black text-white">متبقي على البكالوريا</h2>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
            <Timer size={20} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-6">
          <CircularStat value={timeLeft.days} label="يوم" max={365} color="stroke-teal-300" />
          <CircularStat value={timeLeft.hours} label="ساعة" max={24} color="stroke-emerald-300" />
          <CircularStat value={timeLeft.minutes} label="دقيقة" max={60} color="stroke-green-300" />
          <CircularStat value={timeLeft.seconds} label="ثانية" max={60} color="stroke-lime-300" />
        </div>
      </div>
    </motion.div>
  );
}
