import { useRef } from 'react';
import SignaturePad from 'react-signature-canvas';
import { cn } from '@/lib/utils';
import styles from './SignatureCanvas.module.css';

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
    const signaturePad = signaturePadRef.current;
    if (!signaturePad) return;

    if (signaturePad.isEmpty()) {
      alert('Please provide a signature');
      return;
    }

    try {
      const trimmedCanvas = signaturePad.getTrimmedCanvas();
      const dataUrl = trimmedCanvas.toDataURL('image/png');
      onSave(dataUrl);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error saving signature. Please try again.');
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className={styles.signatureContainer}>
        <SignaturePad
          ref={signaturePadRef}
          canvasProps={{
            className: styles.signaturePad
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