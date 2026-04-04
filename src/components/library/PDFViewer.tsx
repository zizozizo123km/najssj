import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PDFViewer({ url, title, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  // Use proxy URL to bypass CORS
  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(url)}`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
  };

  const zoom = (delta: number) => {
    setScale(prevScale => Math.min(Math.max(0.5, prevScale + delta), 3.0));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold truncate max-w-[150px] md:max-w-md">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(url, '_blank')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            title="تحميل"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-2 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 text-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => zoom(-0.2)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => zoom(0.2)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-gray-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-gray-800 disabled:opacity-30 rounded-lg transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-xs font-bold">
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 hover:bg-gray-800 disabled:opacity-30 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-950 scrollbar-thin scrollbar-thumb-gray-800">
        <div className="relative">
          <Document
            file={proxyUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-sm font-medium">جاري تحميل الكتاب...</p>
              </div>
            }
            error={
              <div className="text-red-400 p-10 text-center">
                حدث خطأ أثناء تحميل الملف. يرجى المحاولة مرة أخرى.
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl rounded-sm overflow-hidden"
            />
          </Document>
        </div>
      </div>
    </motion.div>
  );
}
