import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { drawQr } from "./lib/qr";

interface QrCodeProps {
  value: string;
  size?: number;
  caption?: string;
}

export const QrCode = ({
  value,
  size = 300,
  caption = "Scan to pair",
}: QrCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedCssPx, setRenderedCssPx] = useState(size);
  const [isTooLarge, setIsTooLarge] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const drawnPx = drawQr(canvas, value, size, ratio);
    setIsTooLarge(drawnPx === 0);
    if (drawnPx > 0) setRenderedCssPx(drawnPx / ratio);
  }, [value, size]);

  if (isTooLarge)
    return (
      <p className="m-0 max-w-75 text-center text-[13px] leading-normal text-danger">
        This code is too long to show as a QR. Copy it and send it to the other
        device instead.
      </p>
    );

  return (
    <figure className="m-0 inline-flex flex-col items-center rounded-[22px] border border-accent/35 bg-qr-surface px-2.5 pt-2.5 pb-3 shadow-[0_0_0_5px_rgb(37_99_235/0.1),0_16px_32px_rgb(0_0_0/0.35)]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Pairing QR code"
        style={{ width: renderedCssPx, height: renderedCssPx }}
        className="block rounded-xl [image-rendering:pixelated]"
      />
      <figcaption className="mt-1 flex items-center gap-1.75 text-[13px] font-semibold tracking-[0.2px] text-qr-eye">
        <ScanLine size={15} aria-hidden />
        {caption}
      </figcaption>
    </figure>
  );
};
