import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-sm font-bold text-gray-500 animate-pulse">جاري تحميل المحتوى...</p>
    </div>
  );
}
