import { ROUTES } from '@/shared/constants/routes';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, InlineNotice, StatusRow, StepperProgress, useToast,
} from '@pramana/ui-components';
import type { Step } from '@pramana/ui-components';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../features/auth/useAuth';
import { doctorUpdated, progressUpdated } from '../../features/auth/authSlice';
import { requestPlatformRegistration, listMyInvites, respondToInvite } from '../../api/doctors.api';
import { AadhaarStep } from './AadhaarStep';
import { LicenseStep } from './LicenseStep';
import { ClinicStep } from './ClinicStep';
import { SigningKeyStep } from './SigningKeyStep';
import type { OrganizationInvite } from '@pramana/types';

/**
 * Flow 1, all six steps.
 *
 * SS6: on wide layouts the stepper becomes a fixed vertical side panel and the
 * current step gets the rest of the width. Below 1024px it is a horizontal
 * stepper above the step. Same component, different orientation.
 */
const STEPS: Step[] = [
  { id: 'aadhaar', label: 'Identity', hint: 'Aadhaar eKYC, with your consent recorded' },
  { id: 'licence', label: 'Medical licence', hint: 'Matched against the council register' },
  { id: 'clinic', label: 'Clinic', hint: 'Address, certificate and a photo taken on site' },
  { id: 'key', label: 'Signing key', hint: 'Created in this browser and never sent to us' },
  { id: 'platform', label: 'Platform registration', hint: 'Optional, and separate from the checks above' },
  { id: 'org', label: 'Organisation', hint: 'Optional. A display badge only' },
];

export function OnboardingPage() {
  const { doctor, progress } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [invites, setInvites] = useState<OrganizationInvite[] | null>(null);
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => {
    if (!progress) return 0;
    if (!progress.aadhaar) return 0;
    if (!progress.license) return 1;
    if (!progress.clinic) return 2;
    if (!progress.signing_key) return 3;
    if (!progress.platform_registration) return 4;
    return 5;
  }, [progress]);

  async function loadInvites() {
    setInvites(await listMyInvites());
  }

  async function register() {
    setBusy(true);
    try {
      dispatch(doctorUpdated(await requestPlatformRegistration()));
      dispatch(progressUpdated({ platform_registration: true }));
      toast.show('Platform registration requested');
      void loadInvites();
    } finally {
      setBusy(false);
    }
  }

  async function answerInvite(invite: OrganizationInvite, accept: boolean) {
    setBusy(true);
    try {
      await respondToInvite(invite.id, accept);
      toast.show(accept ? `Affiliated with ${invite.organization_name}` : 'Invite declined');
      dispatch(progressUpdated({ org_affiliation: true }));
      void loadInvites();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Set up your account</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Six steps, once. After this, writing a prescription takes a signature rather than a
          verification.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-[88px]">
          <StepperProgress
            steps={STEPS}
            current={current}
            orientation={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'vertical' : 'horizontal'}
            label="Set-up progress"
          />
        </div>

        <Card>
          <CardBody className="p-5">
            {current === 0 && (
              <AadhaarStep
                onDone={(updated) => {
                  dispatch(doctorUpdated(updated));
                  dispatch(progressUpdated({ aadhaar: true }));
                }}
              />
            )}

            {current === 1 && (
              <LicenseStep
                aadhaarName={doctor?.aadhaar?.name ?? doctor?.name ?? ''}
                onDone={() => dispatch(progressUpdated({ license: true }))}
              />
            )}

            {current === 2 && <ClinicStep onDone={() => dispatch(progressUpdated({ clinic: true }))} />}

            {current === 3 && doctor && (
              <SigningKeyStep doctorId={doctor.id} onDone={() => dispatch(progressUpdated({ signing_key: true }))} />
            )}

            {current === 4 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h2 className="text-title">Join the platform</h2>
                  <p className="max-w-measure text-body-sm text-muted">
                    This is a separate decision from the checks you have just passed, and you can skip
                    it. Being registered here is what gives your prescriptions an in-system provenance
                    record.
                  </p>
                </div>

                <div className="max-w-field">
                  <StatusRow
                    label="If you register"
                    value="Prescriptions you sign are sealed and hash-chained. A pharmacist scanning one sees the strongest trust result."
                  />
                  <StatusRow
                    label="If you do not"
                    value="Your licence is still verified, but prescriptions you write carry no provenance record here, and show the weakest trust result."
                    status={<Badge status="idle" label="Tier 3" />}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button loading={busy} loadingLabel="Requesting" onClick={register}>
                    Register me on the platform
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(ROUTES.doctor.status)}>Skip for now</Button>
                </div>
              </div>
            )}

            {current === 5 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h2 className="text-title">Affiliate with an organisation</h2>
                  <p className="max-w-measure text-body-sm text-muted">
                    Only if a hospital or clinic chain has invited you. Accepting adds a badge to your
                    prescriptions. It does not touch your signing key, your licence status or who can
                    sign on your behalf - nobody can, including them.
                  </p>
                </div>

                {invites === null ? (
                  <Button variant="ghost" onClick={loadInvites}>Check for invites</Button>
                ) : invites.length === 0 ? (
                  <InlineNotice tone="neutral" title="No invites waiting">
                    You are set up as an independent practitioner. If a hospital invites you later, it
                    will appear on your verification page.
                  </InlineNotice>
                ) : (
                  <ul className="flex list-none flex-col gap-3 p-0">
                    {invites.map((invite) => (
                      <Card as="li" key={invite.id}>
                        <CardBody className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <strong className="font-document text-title-sm">{invite.organization_name}</strong>
                            <span className="text-caption text-muted">
                              Invited {new Date(invite.sent_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => answerInvite(invite, false)}>
                              Decline
                            </Button>
                            <Button size="sm" disabled={busy} onClick={() => answerInvite(invite, true)}>
                              Accept
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </ul>
                )}

                <div>
                  <Button onClick={() => navigate(ROUTES.doctor.prescribe)}>Finish set-up</Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
