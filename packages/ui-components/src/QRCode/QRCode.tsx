import { useEffect, useRef } from 'react';
import QR from 'qrcode';
import { cn } from '../lib/cn';

/**
 * SS4: QR codes render as true black-on-white modules regardless of theme.
 * They are never tinted to match the palette - they must scan reliably under
 * any lighting condition on any camera, and that outranks visual consistency.
 */
export function QRCode({
  value, size = 176, className, alt = 'Prescription QR code',
}: {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QR.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    }).catch(() => {
      /* Rendering failure is handled by the manual-entry fallback on the page. */
    });
  }, [value, size]);

  return (
    <div className={cn('qr-surface inline-block rounded-[8px] p-3', className)}>
      <canvas ref={canvasRef} role="img" aria-label={alt} />
    </div>
  );
}
