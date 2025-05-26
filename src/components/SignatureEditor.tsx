import { useState, useRef, useCallback, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import { HexColorPicker } from 'react-colorful';
import { signatureFonts, type SignatureFont } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';

interface SignatureEditorProps {
  onSave: (signature: string) => void;
  className?: string;
}

type SignatureMode = 'draw' | 'type' | 'upload';

interface UploadedSignature {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export function SignatureEditor({ onSave, className }: SignatureEditorProps) {
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState<SignatureFont>(signatureFonts[0]);
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [uploadedSignature, setUploadedSignature] = useState<UploadedSignature | null>(null);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const signaturePadRef = useRef<SignaturePad>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvasWithHighDPI = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    return ctx;
  };

  const generateSignatureImage = useCallback((text: string, font: SignatureFont, size: number = fontSize): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 800 * dpr;
      canvas.height = 300 * dpr;
      canvas.style.width = '800px';
      canvas.style.height = '300px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = color;
        ctx.font = `${size}px ${font.fontFamily}`;
        ctx.textBaseline = 'middle';
        
        // Enable text rendering optimization
        ctx.textRendering = 'optimizeLegibility';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Center the text
        const textMetrics = ctx.measureText(text);
        const x = (800 - textMetrics.width) / 2;
        const y = 150;
        
        // Add a slight slant for more signature-like appearance
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 60);
        ctx.fillText(text, 0, 0);
        ctx.restore();

        // Create a temporary image to ensure the data URL is properly generated
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png', 1.0));
        };
        img.src = canvas.toDataURL('image/png', 1.0);
      } else {
        resolve('');
      }
    });
  }, [color, fontSize]);

  const clear = () => {
    if (mode === 'draw' && signaturePadRef.current) {
      signaturePadRef.current.clear();
      // Reset canvas for high DPI after clearing
      const canvas = signaturePadRef.current.getCanvas();
      const ctx = getCanvasWithHighDPI(canvas);
      if (ctx && signaturePadRef.current) {
        const context = signaturePadRef.current.getCanvas().getContext('2d');
        if (context) {
          context.scale(1, 1);
        }
      }
    } else if (mode === 'type') {
      setTypedSignature('');
    }
  };

  useEffect(() => {
    // Set up high DPI canvas when component mounts or mode changes
    if (mode === 'draw' && signaturePadRef.current) {
      const canvas = signaturePadRef.current.getCanvas();
      getCanvasWithHighDPI(canvas);
    }
  }, [mode]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxWidth = 400;
        const width = Math.min(img.width, maxWidth);
        const height = width / aspectRatio;

        setUploadedSignature({
          dataUrl: e.target?.result as string,
          width,
          height,
          aspectRatio
        });
        setMode('upload');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResizeStop = (e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, delta: any, position: any) => {
    if (uploadedSignature) {
      const newWidth = parseFloat(ref.style.width);
      const newHeight = parseFloat(ref.style.height);
      
      setUploadedSignature(prev => {
        if (!prev) return null;
        return {
          ...prev,
          width: newWidth,
          height: newHeight,
          aspectRatio: maintainAspectRatio ? prev.aspectRatio : newWidth / newHeight
        };
      });
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setShowColorPicker(false); // Auto-close after selection
  };

  const save = async () => {
    try {
      if (mode === 'draw') {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
          alert('Please provide a signature');
          return;
        }
        // Get a trimmed and high-quality PNG of the signature
        const canvas = signaturePadRef.current.getTrimmedCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        onSave(dataUrl);
      } else if (mode === 'type' && typedSignature) {
        const signatureImage = await generateSignatureImage(typedSignature, selectedFont);
        if (!signatureImage) {
          throw new Error('Failed to generate signature image');
        }
        onSave(signatureImage);
      } else if (mode === 'upload' && uploadedSignature) {
        // Create a canvas to maintain the resized dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        canvas.width = uploadedSignature.width;
        canvas.height = uploadedSignature.height;
        
        // Enable high-quality image processing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create a promise to handle image loading and processing
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, uploadedSignature.width, uploadedSignature.height);
            const resizedDataUrl = canvas.toDataURL('image/png', 1.0);
            onSave(resizedDataUrl);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load uploaded signature'));
          img.src = uploadedSignature.dataUrl;
        });
      } else {
        throw new Error('Please provide a signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      alert(error instanceof Error ? error.message : 'Error saving signature. Please try again.');
    }
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm p-6", className)}>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('draw')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            mode === 'draw' ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            mode === 'type' ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Type
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            mode === 'upload' ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Upload
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <label className="text-sm font-medium text-gray-700">Signature Color</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: color }}
              />
              {showColorPicker && (
                <div className="absolute z-10 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                  <div className="relative">
                    <HexColorPicker color={color} onChange={handleColorChange} />
                  </div>
                </div>
              )}
            </div>
          </div>
          {mode === 'type' && (
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Font Size</label>
              <input
                type="range"
                min="24"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">{fontSize}px</div>
            </div>
          )}
        </div>
      </div>

      {mode === 'draw' && (
        <div className="border rounded-lg p-4">
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: "w-full h-[200px] border rounded-lg bg-white",
              style: { 
                width: '100%', 
                height: '200px',
                backgroundColor: 'white',
                touchAction: 'none'
              }
            }}
            penColor={color}
            dotSize={2}
            minWidth={1.5}
            maxWidth={3}
            throttle={16}
            velocityFilterWeight={0.7}
          />
        </div>
      )}

      {mode === 'type' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type your signature
            </label>
            <div className="relative w-full h-[100px] border rounded-lg overflow-hidden">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className={cn(
                  "w-full h-full px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-center bg-white",
                  selectedFont.className
                )}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  color,
                  lineHeight: '100px'
                }}
                placeholder="Type your name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a style
            </label>
            <div className="h-[300px] overflow-y-auto rounded-lg border border-gray-200">
              <div className="space-y-2 p-2">
                {signatureFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedFont(font)}
                    className={cn(
                      "w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors",
                      selectedFont.name === font.name ? "border-primary ring-2 ring-primary" : "border-gray-200",
                      font.className
                    )}
                  >
                    <div
                      className="text-center"
                      style={{ 
                        color,
                        fontSize: `${fontSize}px`,
                        lineHeight: '1.2',
                        transform: 'rotate(-2deg)'
                      }}
                    >
                      {typedSignature || 'Preview'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'upload' && uploadedSignature && (
        <div className="space-y-4">
          <div className="relative border rounded-lg p-4 min-h-[300px]" ref={containerRef}>
            <Rnd
              default={{
                x: 0,
                y: 0,
                width: uploadedSignature.width,
                height: uploadedSignature.height,
              }}
              minWidth={50}
              minHeight={50}
              lockAspectRatio={maintainAspectRatio}
              bounds="parent"
              onResizeStop={handleResizeStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
              }}
              resizeHandleStyles={{
                bottomRight: {
                  width: '12px',
                  height: '12px',
                  right: '-6px',
                  bottom: '-6px',
                  cursor: 'se-resize',
                  backgroundColor: 'white',
                  border: '2px solid #0066cc',
                  borderRadius: '50%',
                },
                topLeft: {
                  width: '12px',
                  height: '12px',
                  left: '-6px',
                  top: '-6px',
                  cursor: 'nw-resize',
                  backgroundColor: 'white',
                  border: '2px solid #0066cc',
                  borderRadius: '50%',
                },
                topRight: {
                  width: '12px',
                  height: '12px',
                  right: '-6px',
                  top: '-6px',
                  cursor: 'ne-resize',
                  backgroundColor: 'white',
                  border: '2px solid #0066cc',
                  borderRadius: '50%',
                },
                bottomLeft: {
                  width: '12px',
                  height: '12px',
                  left: '-6px',
                  bottom: '-6px',
                  cursor: 'sw-resize',
                  backgroundColor: 'white',
                  border: '2px solid #0066cc',
                  borderRadius: '50%',
                },
              }}
            >
              <img
                src={uploadedSignature.dataUrl}
                alt="Uploaded signature"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </Rnd>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintainAspectRatio"
              checked={maintainAspectRatio}
              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="maintainAspectRatio" className="text-sm text-gray-600">
              Maintain aspect ratio
            </label>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={handleUpload}
      />

      <div className="mt-6">
        <div className="flex gap-2">
          <button
            onClick={clear}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Clear
          </button>
          <button
            onClick={save}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 