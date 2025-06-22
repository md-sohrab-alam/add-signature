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

function getContrastColor(hexcolor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function SignatureEditor({ onSave, className }: SignatureEditorProps) {
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState<SignatureFont>(signatureFonts[0]);
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSize, setFontSize] = useState(72);
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
      canvas.width = 2000 * dpr;  // Further increased canvas width
      canvas.height = 600 * dpr;  // Further increased canvas height
      canvas.style.width = '2000px';
      canvas.style.height = '600px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = color;

        // Initial setup with maximum possible font size
        let currentSize = size;
        ctx.font = `${currentSize}px ${font.fontFamily}`;
        
        // Enable text rendering optimization
        ctx.textRendering = 'optimizeLegibility';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Calculate maximum width with padding
        const maxWidth = 1800;  // Increased maximum width with padding
        const textMetrics = ctx.measureText(text);
        
        // If text is too wide, scale down the font size
        if (textMetrics.width > maxWidth) {
          currentSize = Math.floor((size * maxWidth) / textMetrics.width);
          // Ensure minimum readable size
          currentSize = Math.max(currentSize, 24);
          ctx.font = `${currentSize}px ${font.fontFamily}`;
        }

        ctx.textBaseline = 'middle';
        
        // Get final metrics after potential resizing
        const finalMetrics = ctx.measureText(text);
        const x = (2000 - finalMetrics.width) / 2;  // Center horizontally
        const y = 300;  // Center vertically (half of 600)
        
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
      let signatureDataUrl = '';
      
      if (mode === 'draw') {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
          alert('Please provide a signature');
          return;
        }
        const canvas = signaturePadRef.current.getTrimmedCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        signatureDataUrl = canvas.toDataURL('image/png', 1.0);
      } else if (mode === 'type') {
        if (!typedSignature.trim()) {
          alert('Please type your signature');
          return;
        }
        const signatureImage = await generateSignatureImage(typedSignature, selectedFont);
        if (!signatureImage) {
          throw new Error('Failed to generate signature image');
        }
        signatureDataUrl = signatureImage;
      } else if (mode === 'upload' && uploadedSignature) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        canvas.width = uploadedSignature.width;
        canvas.height = uploadedSignature.height;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, uploadedSignature.width, uploadedSignature.height);
            signatureDataUrl = canvas.toDataURL('image/png', 1.0);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load uploaded signature'));
          img.src = uploadedSignature.dataUrl;
        });
      } else {
        throw new Error('Please provide a signature');
      }

      onSave(signatureDataUrl);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert(error instanceof Error ? error.message : 'Error saving signature. Please try again.');
    }
  };

  return (
    <div className={cn("p-6", className)}>
      <div className="space-y-8">
        {/* Signature Mode Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Choose How to Add Your Signature</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setMode('draw')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                mode === 'draw' 
                  ? "bg-primary text-white shadow-lg scale-[1.02]" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="font-medium">Draw</span>
              <span className="text-xs mt-1 opacity-80">Use your mouse or touch</span>
            </button>
            <button
              onClick={() => setMode('type')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                mode === 'type'
                  ? "bg-primary text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="font-medium">Type</span>
              <span className="text-xs mt-1 opacity-80">Choose from styles</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                mode === 'upload'
                  ? "bg-primary text-white shadow-lg scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="font-medium">Upload</span>
              <span className="text-xs mt-1 opacity-80">Use image file</span>
            </button>
          </div>
        </div>

        {/* Signature Style Options */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signature Color
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full h-10 rounded-lg border border-gray-300 flex items-center gap-2 px-3 hover:border-primary transition-colors"
                  style={{ backgroundColor: color }}
                >
                  <div className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-sm" style={{ color: getContrastColor(color) }}>
                    {color.toUpperCase()}
                  </span>
                </button>
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                    <div className="relative">
                      <div className="absolute p-3 bg-white rounded-lg shadow-xl border">
                        <HexColorPicker color={color} onChange={handleColorChange} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {mode === 'type' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="48"
                    max="96"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>48px</span>
                    <span>{fontSize}px</span>
                    <span>96px</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signature Input Area */}
        <div className="space-y-4">
          {mode === 'draw' && (
            <div className="border-2 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-center mb-4">
                <h4 className="font-medium text-gray-700">Draw Your Signature</h4>
                <p className="text-sm text-gray-500">Use your mouse or touch to sign</p>
              </div>
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
                velocityFilterWeight={0.7}
              />
            </div>
          )}

          {mode === 'type' && (
            <div className="space-y-6">
              <div className="border-2 rounded-xl p-4 bg-white shadow-sm">
                <div className="text-center mb-4">
                  <h4 className="font-medium text-gray-700">Type Your Signature</h4>
                  <p className="text-sm text-gray-500">Enter your name to preview in different styles</p>
                </div>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full h-[100px] px-4 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-0 text-center bg-white transition-colors"
                  style={{ 
                    fontSize: `${fontSize}px`, 
                    color,
                    fontFamily: selectedFont.fontFamily,
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

              <div className="border-2 rounded-xl p-4 bg-white shadow-sm">
                <div className="text-center mb-4">
                  <h4 className="font-medium text-gray-700">Choose a Style</h4>
                  <p className="text-sm text-gray-500">Select from available signature styles</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2">
                  {signatureFonts.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font)}
                      className={cn(
                        "p-4 border-2 rounded-xl hover:bg-gray-50 transition-all duration-200",
                        selectedFont.name === font.name 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-gray-200"
                      )}
                    >
                      <div
                        className={cn("text-center", font.className)}
                        style={{ 
                          color,
                          fontSize: `${fontSize * 0.7}px`,
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
          )}

          {mode === 'upload' && uploadedSignature && (
            <div className="border-2 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-center mb-4">
                <h4 className="font-medium text-gray-700">Adjust Your Signature</h4>
                <p className="text-sm text-gray-500">Resize and position as needed</p>
              </div>
              <div className="relative min-h-[300px]" ref={containerRef}>
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
                >
                  <img
                    src={uploadedSignature.dataUrl}
                    alt="Uploaded signature"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </Rnd>
              </div>
              <div className="flex items-center gap-2 mt-4 justify-center">
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
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
          <div className="flex gap-3">
            <button
              onClick={clear}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Clear
            </button>
            <button
              onClick={save}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
} 