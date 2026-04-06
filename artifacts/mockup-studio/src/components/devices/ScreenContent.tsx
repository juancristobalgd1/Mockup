import { useApp } from "../../store";
import { Upload } from "lucide-react";
import { useRef } from "react";

export function ScreenContent() {
  const { state, updateState } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateState({ screenshotUrl: url });
    }
  };

  return (
    <div 
      className="w-full h-full relative group cursor-pointer overflow-hidden bg-black flex items-center justify-center"
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {state.screenshotUrl ? (
        <img 
          src={state.screenshotUrl} 
          alt="Screenshot" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-white/50">
          <Upload className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-medium">Upload Image</span>
        </div>
      )}
      
      {state.screenshotUrl && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
            Replace Image
          </span>
        </div>
      )}
    </div>
  );
}