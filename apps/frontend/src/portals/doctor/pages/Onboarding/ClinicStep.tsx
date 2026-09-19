import { useEffect, useState } from 'react';
import { Button, Field, Input, InlineNotice, ScanFrame, StatusRow, Badge } from '@pramana/ui-components';
import { useClinicVerification } from '../../features/clinic/useClinicVerification';

/**
 * Flow 1, step 3.
 *
 * SS6: on wide layouts this is a two-pane screen - the fields on one side, the
 * resolved address and live capture on the other. The camera becomes a fixed
 * ~420px panel rather than a webcam feed stretched across a monitor.
 *
 * SS8: the capture has no file-input fallback, because a gallery upload defeats
 * the purpose of the geotag. What it has instead is a plain explanation of why,
 * and a route back to a reviewer if the doctor genuinely cannot capture on site.
 */
export function ClinicStep({ onDone }: { onDone: () => void }) {
  const clinic = useClinicVerification();
  const [addressText, setAddressText] = useState('');
  const [certNumber, setCertNumber] = useState('');

  useEffect(() => () => clinic.stopCamera(), [clinic]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-title">Where do you practise?</h2>
          <p className="max-w-measure text-body-sm text-muted">
            The address on your prescriptions has to be a place that exists and that you can stand in
            front of. That is the whole test.
          </p>
        </div>

        <Field
          label="Clinic address"
          required
          help="Building, street, area, city and PIN code. A landmark helps if the street is hard to find."
          error={clinic.stage === 'address' ? clinic.error ?? undefined : undefined}
        >
          <Input
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="Sunrise Clinic, 12th Main, Indiranagar, Bengaluru 560038"
            disabled={clinic.stage !== 'address'}
          />
        </Field>

        {clinic.stage === 'address' ? (
          <div>
            <Button
              disabled={addressText.trim().length < 12}
              loading={clinic.busy}
              loadingLabel="Looking up the address"
              onClick={() => clinic.checkAddress(addressText)}
            >
              Find this address
            </Button>
          </div>
        ) : null}

        {clinic.stage === 'certificate' ? (
          <>
            <Field
              label="Clinical Establishment Registration number"
              help="We cross-check this against the state register where one is published. Leave it blank if your state has not issued one."
            >
              <Input
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="CEA/KA/BLR/2019/00812"
                className="font-mono"
              />
            </Field>
            <div>
              <Button loading={clinic.busy} loadingLabel="Saving" onClick={() => clinic.submitCertificate(certNumber)}>
                Continue to the photo
              </Button>
            </div>
          </>
        ) : null}

        {clinic.stage === 'photo' ? (
          <InlineNotice tone="seal" title="Take this photo standing at the clinic">
            The picture is stamped with your location at the moment you take it, and compared against the
            address above. Because of that, it has to come from this camera - there is no upload option,
            and a photo of a photo will not pass.
          </InlineNotice>
        ) : null}

        {clinic.stage === 'done' ? (
          <>
            <InlineNotice tone="tourmaline" title="Clinic confirmed">
              The address resolved, and your photo was taken within range of it.
            </InlineNotice>
            <div><Button onClick={onDone}>Continue to your signing key</Button></div>
          </>
        ) : null}
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
        {clinic.address ? (
          <div className="rounded-card border border-line bg-surface p-4">
            <StatusRow
              label="Resolved address"
              value={clinic.address.formatted_address}
              status={<Badge status="verified" label="Found" />}
            />
            <StatusRow
              label="Coordinates"
              value={`${clinic.address.lat.toFixed(5)}, ${clinic.address.lng.toFixed(5)}`}
              mono
            />
          </div>
        ) : null}

        {clinic.stage === 'photo' ? (
          <div className="flex flex-col gap-3">
            <ScanFrame
              videoRef={clinic.videoRef}
              state={clinic.cameraState}
              hint="Frame the entrance and the signboard."
              fallback={
                <Button variant="ghost" onClick={clinic.startCamera}>Turn on the camera</Button>
              }
            />
            {clinic.cameraState === 'scanning' ? (
              <Button loading={clinic.busy} loadingLabel="Capturing" icon="camera" onClick={clinic.capturePhoto}>
                Take the photo
              </Button>
            ) : null}
            {clinic.cameraState === 'idle' ? (
              <Button icon="camera" onClick={clinic.startCamera}>Turn on the camera</Button>
            ) : null}
            {clinic.error ? (
              <InlineNotice tone="amber" title="Capture did not complete" role="alert">
                {clinic.error}
              </InlineNotice>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
