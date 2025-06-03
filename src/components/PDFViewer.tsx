import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  file: string;
  pageNumber: number;
  scale: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

export function PDFViewer({ file, pageNumber, scale, onLoadSuccess }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current) return;

      try {
        const loadingTask = pdfjsLib.getDocument(file);
        const pdf = await loadingTask.promise;
        
        onLoadSuccess({ numPages: pdf.numPages });
        
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file, pageNumber, scale, onLoadSuccess]);

  return (
    <div className="pdf-container">
      <canvas ref={canvasRef} className="pdf-canvas" />
    </div>
  );
} 