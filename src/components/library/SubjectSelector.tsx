import { motion } from 'motion/react';
import { 
  LayoutGrid, 
  Beaker, 
  Calculator, 
  Settings, 
  Palette, 
  TrendingUp, 
  Globe,
  LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Subject {
  id: string;
  name: string;
  icon: LucideIcon;
}

const subjects: Subject[] = [
  { id: 'all', name: 'الكل', icon: LayoutGrid },
  { id: 'sciences', name: 'علوم تجريبية', icon: Beaker },
  { id: 'math', name: 'رياضيات', icon: Calculator },
  { id: 'technical', name: 'تقني رياضي', icon: Settings },
  { id: 'arts', name: 'آداب وفلسفة', icon: Palette },
  { id: 'humanities', name: 'تسيير واقتصاد', icon: TrendingUp },
  { id: 'languages', name: 'لغات أجنبية', icon: Globe },
];

interface SubjectSelectorProps {
  selectedSubject: string;
  onSelect: (id: string) => void;
}

export default function SubjectSelector({ selectedSubject, onSelect }: SubjectSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0" dir="rtl">
      {subjects.map((subject) => {
        const Icon = subject.icon;
        return (
          <button
            key={subject.id}
            onClick={() => onSelect(subject.id)}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 whitespace-nowrap px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-bold transition-all border shrink-0",
              selectedSubject === subject.id
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50"
            )}
          >
            <Icon size={16} className={cn(
              "transition-colors",
              selectedSubject === subject.id ? "text-white" : "text-blue-500"
            )} />
            {subject.name}
          </button>
        );
      })}
    </div>
  );
}
