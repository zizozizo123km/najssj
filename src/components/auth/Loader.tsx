import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="animate-spin" size={20} />
      <span>جاري التحميل...</span>
    </div>
  );
}
