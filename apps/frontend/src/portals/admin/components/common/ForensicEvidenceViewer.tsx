import { Badge, Card, CardBody, CardHeader, StatusRow } from '@pramana/ui-components';
import type { AITamperingResult, ForensicAnalysisResult } from '@pramana/types';

export function ForensicEvidenceViewer({
  forensic,
  ai,
  sourceImageUrl,
  elaHeatmapUrl,
}: {
  forensic: ForensicAnalysisResult;
  ai?: AITamperingResult | null;
  sourceImageUrl?: string | null;
  elaHeatmapUrl?: string | null;
}) {
  return (
    <Card>
      <CardHeader
        title="Forensic evidence"
        description="Image evidence returned by the prescription verification pipeline."
      />
      <CardBody className="flex flex-col gap-5">
        {sourceImageUrl || elaHeatmapUrl ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sourceImageUrl ? (
              <figure className="overflow-hidden rounded-card border border-line-2 bg-canvas-2">
                <img src={sourceImageUrl} alt="Prescription under review" className="max-h-[420px] w-full object-contain" />
                <figcaption className="border-t border-line-2 px-3 py-2 text-caption text-muted">Original uploaded image</figcaption>
              </figure>
            ) : null}
            {elaHeatmapUrl ? (
              <figure className="overflow-hidden rounded-card border border-line-2 bg-canvas-2">
                <img src={elaHeatmapUrl} alt="Error level analysis heatmap" className="max-h-[420px] w-full object-contain" />
                <figcaption className="border-t border-line-2 px-3 py-2 text-caption text-muted">ELA heatmap</figcaption>
              </figure>
            ) : null}
          </div>
        ) : (
          <div className="rounded-control bg-canvas-2 p-4 text-body-sm text-muted">
            The current API returns the ELA score and forensic flags, but not a rendered ELA heatmap asset.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h4 className="text-body font-semibold">Forensic signals</h4>
            <div className="mt-2 flex flex-col">
              <StatusRow label="Forensic score" value={forensic.forensic_score.toFixed(3)} mono />
              <StatusRow label="ELA anomaly" value={forensic.ela_anomaly_score === null ? 'Not available' : forensic.ela_anomaly_score.toFixed(3)} mono />
              <StatusRow label="Flags" value={forensic.flags.length ? forensic.flags.join(' · ') : 'No flags returned'} />
            </div>
          </div>

          <div>
            <h4 className="text-body font-semibold">AI tampering signal</h4>
            <div className="mt-2 flex flex-col">
              <StatusRow
                label="Model status"
                value={ai?.model_available ? 'Available' : 'Unavailable'}
                status={<Badge status={ai?.model_available ? 'verified' : 'idle'} label={ai?.model_available ? 'Available' : 'Unavailable'} />}
              />
              <StatusRow label="Probability" value={ai?.probability === null || ai?.probability === undefined ? 'Not available' : `${(ai.probability * 100).toFixed(2)}%`} mono />
              <StatusRow label="Prediction" value={ai?.prediction ?? 'Not available'} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-body font-semibold">Signal breakdown</h4>
          <div className="mt-2 flex flex-col">
            <StatusRow label="Metadata" value={forensic.metadata_flags.length ? forensic.metadata_flags.join(' · ') : 'None'} />
            <StatusRow label="Timestamp" value={forensic.timestamp_flags.length ? forensic.timestamp_flags.join(' · ') : 'None'} />
            <StatusRow label="Dimensions" value={forensic.dimension_flags.length ? forensic.dimension_flags.join(' · ') : 'None'} />
            <StatusRow label="Manipulation" value={forensic.manipulation_flags.length ? forensic.manipulation_flags.join(' · ') : 'None'} />
            <StatusRow label="Layout" value={forensic.layout_flags.length ? forensic.layout_flags.join(' · ') : 'None'} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
