import { useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Icon, InlineNotice } from '@pramana/ui-components';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function PhotoUploadWidget({
  file,
  onFileChange,
  disabled = false,
}: {
  file: File | null;
  onFileChange: (file: File | null, error?: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function validate(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      onFileChange(null, 'Use a JPG, PNG, or WebP image.');
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      onFileChange(null, 'The image must be 10 MB or smaller.');
      return;
    }
    onFileChange(nextFile);
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-title-sm">Upload prescription photo</h2>
            <p className="mt-1 text-body-sm text-muted">
              Use a clear photo of the complete prescription. Max 10 MB.
            </p>
          </div>
          <Icon name="camera" size={22} className="text-muted" />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => validate(event.target.files?.[0])}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="overflow-hidden rounded-card border border-line-2 bg-canvas-2">
            <img
              src={previewUrl}
              alt="Selected prescription preview"
              className="max-h-[460px] w-full object-contain"
            />
          </div>
        ) : (
          <button
            type="button"
            className={[
              'flex min-h-56 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 text-center transition-colors',
              dragging ? 'border-ink bg-canvas-2' : 'border-line-2 hover:border-ink-3 hover:bg-canvas-2',
            ].join(' ')}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              validate(event.dataTransfer.files?.[0]);
            }}
            disabled={disabled}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-canvas-2 text-ink-3">
              <Icon name="download" size={22} />
            </span>
            <span className="text-body font-medium">Drop the prescription here</span>
            <span className="text-body-sm text-muted">or click to choose an image</span>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            icon="camera"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            {file ? 'Choose another photo' : 'Choose photo'}
          </Button>
          {file ? (
            <Button
              variant="ghost"
              onClick={() => {
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              disabled={disabled}
            >
              Remove
            </Button>
          ) : null}
        </div>

        {file ? (
          <div className="rounded-control bg-canvas-2 p-3 text-caption text-muted">
            <span className="font-medium text-ink">{file.name}</span> · {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function PhotoUploadError({ message }: { message: string }) {
  return (
    <InlineNotice tone="scarlet" title="Photo not ready" role="alert">
      {message}
    </InlineNotice>
  );
}
