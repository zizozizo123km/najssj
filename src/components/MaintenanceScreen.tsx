import { Wrench } from 'lucide-react';

export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans dir-rtl">
      <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Wrench size={48} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-4">التطبيق في وضع الصيانة</h1>
      <p className="text-gray-600 max-w-md leading-relaxed">
        نحن نقوم ببعض التحديثات والتحسينات على التطبيق لتقديم تجربة أفضل لك. 
        يرجى العودة لاحقاً. شكراً لتفهمك!
      </p>
    </div>
  );
}
