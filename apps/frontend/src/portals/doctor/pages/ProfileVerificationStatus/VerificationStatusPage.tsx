import { ROUTES } from '@/shared/constants/routes';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, InlineNotice, RecordHash, StatusRow, TrustTierBadge,
} from '@pramana/ui-components';
import { useAuth } from '../../features/auth/useAuth';
import { doctorUpdated } from '../../features/auth/authSlice';
import { GovtStatusBadge, PlatformStatusBadge } from '../../components/common/StatusBadge';
import { OrgAffiliationSection } from './OrgAffiliationSection';
import { SuspensionNoticeSection } from './SuspensionNoticeSection';

/**
 * "Here is exactly what we verified about you, and what a pharmacist will see
 * because of it."
 *
 * The trust tier shown here is the same component the verification portal
 * renders, so a doctor is never surprised by what a pharmacist sees.
 */
export function VerificationStatusPage() {
  const { doctor, signingUnlocked } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!doctor) {
    return (
      <div className="flex flex-col gap-3">
        <div className="skeleton h-8 w-48 rounded-control" />
        <div className="skeleton h-40 w-full rounded-card" />
      </div>
    );
  }

  const tier =
    doctor.govt_status === 'VERIFIED' && doctor.platform_status === 'ACTIVE'
      ? doctor.organization_id ? 1 : 2
      : 3;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Your verification</h1>
        <p className="max-w-measure text-body-sm text-muted">
          What we checked, when we checked it, and what it means for the prescriptions you write.
        </p>
      </header>

      <SuspensionNoticeSection suspended={doctor.is_suspended} />

      <TrustTierBadge
        tier={tier}
        subtext={
          tier === 1
            ? `Pharmacists see your name, your licence status and ${doctor.organization_name} on every prescription you sign.`
            : tier === 2
              ? 'Pharmacists see your name and licence status, and that you practise independently.'
              : 'Until platform registration is active, prescriptions you write carry no provenance record here.'
        }
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader title="Identity and licence" description="Checked once, then watched continuously." />
          <CardBody>
            <StatusRow
              label="Aadhaar"
              value={doctor.aadhaar?.masked_aadhaar ?? 'Not verified yet'}
              status={<GovtStatusBadge status={doctor.govt_status} />}
            />
            <StatusRow
              label="Medical licence"
              value={
                doctor.license
                  ? `${doctor.license.license_number}, ${doctor.license.council_name}`
                  : 'Not verified yet'
              }
              mono={Boolean(doctor.license)}
            />
            <StatusRow
              label="Platform registration"
              value={
                doctor.platform_status === 'ACTIVE'
                  ? 'Active. Your prescriptions are sealed and hash-chained.'
                  : 'Not active. Your prescriptions carry no provenance record here.'
              }
              status={<PlatformStatusBadge status={doctor.platform_status} />}
            />
            <StatusRow
              label="Clinic"
              value={doctor.clinic?.address.line1 ?? 'Not verified yet'}
              status={doctor.clinic?.maps_confirmed ? <Badge status="verified" label="Confirmed" /> : <Badge status="idle" />}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Your signing key"
            description="The thing that makes a prescription yours rather than merely about you."
            actions={signingUnlocked ? <Badge status="verified" label="Unlocked" /> : <Badge status="idle" label="Locked" />}
          />
          <CardBody className="flex flex-col gap-4">
            {doctor.signing_key ? (
              <>
                <RecordHash
                  hash={doctor.signing_key.public_key}
                  caption="Your public key. We can check your signatures with it, but we can never make one."
                />
                <StatusRow
                  label="Created"
                  value={new Date(doctor.signing_key.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                />
                <StatusRow label="Fingerprint" value={doctor.signing_key.fingerprint} mono />
                <InlineNotice tone="seal" title="The private half never left this browser">
                  It is encrypted with your passphrase. We could not sign as you even if we wanted to,
                  and neither could anyone who compromised our servers.
                </InlineNotice>
              </>
            ) : (
              <>
                <InlineNotice tone="amber" title="You have no signing key yet">
                  Without one you cannot sign prescriptions. It takes about a minute to create.
                </InlineNotice>
                <div><Button icon="key" onClick={() => navigate(ROUTES.doctor.onboarding)}>Create my signing key</Button></div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <OrgAffiliationSection doctor={doctor} onChanged={(d) => dispatch(doctorUpdated(d))} />

      <p className="max-w-measure text-caption text-muted">
        Something look wrong? <Link to={ROUTES.doctor.onboarding} className="underline">Re-run the affected step</Link>{' '}
        rather than editing anything - every check keeps its own history, and that history is what a
        reviewer reads.
      </p>
    </div>
  );
}
