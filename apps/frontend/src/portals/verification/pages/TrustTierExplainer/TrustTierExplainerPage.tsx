import { Card, CardBody, CardHeader, InlineNotice, StatusRow, TrustTierBadge } from '@pramana/ui-components';

/**
 * The page a pharmacist opens once, early, and then never needs again.
 *
 * SS9: written for someone under time pressure. It answers the question they
 * actually have - "what am I allowed to do with each of these?" - before it
 * explains anything about how the system works.
 */
export function TrustTierExplainerPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">What the three results mean</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Every check comes back as one of three. The difference between them is how much of the
          prescription we can prove, not how good the doctor is.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <Card>
          <CardBody className="flex flex-col gap-4">
            <TrustTierBadge tier={1} />
            <div>
              <StatusRow label="What we proved" value="The prescriber's identity, their licence, and that this exact prescription was signed by them and has not changed since." />
              <StatusRow label="What you can do" value="Dispense as written, once. The token is consumed when you mark it dispensed." />
              <StatusRow label="What to watch for" value="Nothing beyond your normal clinical judgement about the medicine itself." />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <TrustTierBadge tier={2} />
            <div>
              <StatusRow label="What we proved" value="Everything in the first case. The prescriber simply practises independently rather than under a hospital or chain." />
              <StatusRow label="What you can do" value="Exactly the same. This is not a weaker result - it is the same proof from a solo practitioner." />
              <StatusRow label="What to watch for" value="Nothing. The absence of a hospital name is not a warning sign." />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <TrustTierBadge tier={3} />
            <div>
              <StatusRow label="What we proved" value="The licence is real and current. Nothing about this particular piece of paper." />
              <StatusRow label="What you can do" value="Treat it as you would any paper prescription: your usual checks, your usual judgement." />
              <StatusRow label="What to watch for" value="This result cannot tell you whether the prescription was altered after it was written, because there is no signed record here to compare it against." />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Why the result never changes retroactively"
          description="A common question, and the answer is the point of the whole system."
        />
        <CardBody className="flex flex-col gap-4">
          <p className="max-w-measure text-body-sm">
            The prescriber&apos;s licence status is recorded onto the prescription at the instant it is
            signed, and read back from there. If a doctor&apos;s licence is revoked next month, the
            prescriptions they wrote today still show what was true today.
          </p>
          <InlineNotice tone="seal" title="That is deliberate">
            A revocation stops new prescriptions immediately. It does not retrospectively invalidate
            medicine a patient has already been told to take.
          </InlineNotice>
        </CardBody>
      </Card>
    </div>
  );
}
