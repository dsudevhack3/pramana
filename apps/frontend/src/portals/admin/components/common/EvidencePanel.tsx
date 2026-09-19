import { Card, CardBody, CardHeader, Icon, InlineNotice, cn } from '@pramana/ui-components';
import type { EvidenceItem, FlaggingRule } from '@pramana/types';

/**
 * "Why this fired", rendered identically wherever a flagged candidate is
 * reviewed - doctor, pharmacy or patient.
 *
 * The rule that fired is stated in plain language with its threshold beside the
 * observed value, so the reviewer can see the arithmetic rather than trusting a
 * score. There is no score, because there is no model: every rule here is
 * deterministic, and that is what makes a decision contestable later.
 */
const RULE_EXPLANATION: Record<FlaggingRule, string> = {
  doctor_shopping:
    'The same patient received controlled-substance prescriptions from several different prescribers inside a short window.',
  pharmacy_concentration:
    'An unusually large share of one prescriber\u2019s prescriptions were dispensed at a single pharmacy.',
  signing_pace:
    'Prescriptions were signed faster than a consultation of normal length would allow.',
  geo_mismatch:
    'Prescriptions were signed from locations inconsistent with the registered clinic.',
};

export function EvidencePanel({
  rule, headline, evidence, windowStart, windowEnd, className,
}: {
  rule: FlaggingRule;
  headline: string;
  evidence: EvidenceItem[];
  windowStart: string;
  windowEnd: string;
  className?: string;
}) {
  const formatted = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });

  return (
    <Card className={className}>
      <CardHeader
        title="Why this was flagged"
        description={`Observed between ${formatted(windowStart)} and ${formatted(windowEnd)}.`}
      />
      <CardBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="max-w-measure text-body font-medium">{headline}</p>
          <p className="max-w-measure text-body-sm text-muted">{RULE_EXPLANATION[rule]}</p>
        </div>

        <dl className="flex flex-col">
          {evidence.map((item) => (
            <div
              key={item.label}
              className={cn(
                'grid items-baseline gap-3 border-b border-line-2 py-3 last:border-b-0',
                'grid-cols-[minmax(140px,1fr)_auto_auto]',
                'max-sm:grid-cols-[1fr_auto]',
              )}
            >
              <dt className="text-body-sm text-muted max-sm:col-span-full">{item.label}</dt>
              <dd
                className={cn(
                  'font-mono text-mono font-medium',
                  item.breached ? 'text-scarlet' : 'text-ink',
                )}
              >
                {item.breached ? <Icon name="alertTriangle" size={13} className="mr-1 inline" /> : null}
                {item.value}
              </dd>
              <dd className="text-caption text-muted">
                {item.threshold ? `threshold ${item.threshold}` : ''}
              </dd>
            </div>
          ))}
        </dl>

        <InlineNotice tone="neutral" title="What this is and is not">
          A rule matched a pattern. That is all it means. It is not a finding of wrongdoing, and the
          engine has taken no action of its own - reaching this queue is the only thing it did.
        </InlineNotice>
      </CardBody>
    </Card>
  );
}
