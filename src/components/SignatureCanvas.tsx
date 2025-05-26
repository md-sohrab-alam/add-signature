import { useRef, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  className?: string;
}

export function SignatureCanvas({ onSave, className }: SignatureCanvasProps) {
  const signaturePadRef = useRef<SignaturePad>(null);

  const clear = () => {
    signaturePadRef.current?.clear();
  };

  const save = () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    const dataUrl = signaturePadRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="border rounded-lg p-4 bg-white">
        <SignaturePad
          ref={signaturePadRef}
          canvasProps={{
            className: "w-full h-[200px] border rounded-lg",
            style: { width: '100%', height: '200px' }
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Clear
        </button>
        <button
          onClick={save}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Save
        </button>
      </div>
    </div>
  );
} 