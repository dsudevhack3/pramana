import { useCallback, useRef, useState } from 'react';
import { submitClinicCertificate, uploadClinicPhoto, verifyClinicAddress } from '../../api/doctors.api';

type Stage = 'address' | 'certificate' | 'photo' | 'done';

interface ResolvedAddress {
  place_id: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

/**
 * Flow 1 step 3. The photo must be captured live through the in-app camera -
 * a gallery upload would let someone photograph a photograph, which is exactly
 * the substitution the geotag is there to prevent. `startCamera` therefore
 * requests the environment-facing stream directly and there is no file input
 * anywhere in this hook.
 */
export function useClinicVerification() {
  const [stage, setStage] = useState<Stage>('address');
  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'hit' | 'denied'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkAddress = useCallback(async (addressText: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await verifyClinicAddress({ address_text: addressText });
      if (!result.maps_confirmed || !result.place_id) {
        setError('We could not find that address. Check the building number and street, or add a landmark.');
        return false;
      }
      setAddress({
        place_id: result.place_id,
        formatted_address: result.formatted_address ?? addressText,
        lat: result.lat,
        lng: result.lng,
      });
      setStage('certificate');
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const submitCertificate = useCallback(
    async (certNumber: string) => {
      if (!address) return false;
      setBusy(true);
      setError(null);
      try {
        await submitClinicCertificate({ establishment_cert_number: certNumber, place_id: address.place_id });
        setStage('photo');
        return true;
      } finally {
        setBusy(false);
      }
    },
    [address],
  );

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('scanning');
    } catch {
      setCameraState('denied');
      setError('The camera is blocked. Allow camera access in your browser settings, then try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState('idle');
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    setBusy(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10_000 }),
      );

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('capture failed'))), 'image/jpeg', 0.9),
      );

      await uploadClinicPhoto({
        blob,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        captured_at: new Date().toISOString(),
      });

      setCameraState('hit');
      stopCamera();
      setStage('done');
      return true;
    } catch {
      setError('We could not read your location. Turn on location access and take the photo at the clinic.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [stopCamera]);

  return {
    stage, address, busy, error, cameraState, videoRef,
    checkAddress, submitCertificate, startCamera, stopCamera, capturePhoto,
  };
}
