import { useEffect, useState } from "react";
import UploadPlaceholder from "./UploadPlaceholder";

export default function UploadImageFrame({ src, alt, label, sublabel, className = "h-full w-full rounded-[22px]" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <UploadPlaceholder label={label} sublabel={sublabel} className={className} />;
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
