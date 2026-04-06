import { useRef } from "react";
import { Upload } from "lucide-react";
import { useApp } from "../../store";

interface ScreenContentProps {
  accentColor?: string;
  iconBg?: string;
}

export function ScreenContent({ accentColor = "#a855f7", iconBg = "rgba(168,85,247,0.2)" }: ScreenContentProps) {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      updateState({ videoUrl: url, screenshotUrl: null, contentType: "video" });
    } else {
      updateState({ screenshotUrl: url, videoUrl: null, contentType: "image" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      updateState({ videoUrl: url, screenshotUrl: null, contentType: "video" });
    } else {
      updateState({ screenshotUrl: url, videoUrl: null, contentType: "image" });
    }
  };

  const hasContent = state.screenshotUrl || state.videoUrl;

  return (
    <>
      <div
        className="relative w-full h-full group"
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ cursor: "pointer" }}
      >
        {state.contentType === "video" && state.videoUrl ? (
          <video
            src={state.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : state.screenshotUrl ? (
          <img
            src={state.screenshotUrl}
            alt="Screenshot"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: iconBg }}
            >
              <Upload size={16} style={{ color: accentColor }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
              Drop image or video
            </span>
          </div>
        )}

        {hasContent && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
              Replace media
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
