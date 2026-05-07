import { ImagePlus } from "lucide-react";

export default function UploadPlaceholder({ label = "Upload image", sublabel = "No image added yet", className = "h-full w-full" }) {
  return (
    <div className={`flex items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 text-center ${className}`}>
      <div className="max-w-full px-6 py-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <ImagePlus size={24} />
        </div>
        <p className="mt-4 break-words text-sm font-semibold leading-5 text-slate-700">{label}</p>
        <p className="mt-1 break-words text-xs leading-5 text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}
