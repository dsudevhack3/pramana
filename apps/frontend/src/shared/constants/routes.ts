/**
 * The one place a URL is spelled out.
 *
 * Four portals share one router, and three path names (`doctors`, `register`,
 * `kit`) exist in more than one of them. Every internal link and navigate()
 * call reads from this table, so a portal can only ever link inside its own
 * namespace and a mistyped prefix is a type error rather than a 404.
 *
 * router.tsx declares the same paths as relative segments under each
 * portal's base; keep the two in step when a route is added.
 */
type Id = string | number;

export const PORTAL_BASE = {
  doctor: '/doctor',
  admin: '/admin',
  verification: '/verification',
  organization: '/organization',
} as const;

export const ROUTES = {
  home: '/',

  doctor: {
    root: PORTAL_BASE.doctor,
    onboarding: `${PORTAL_BASE.doctor}/onboarding`,
    prescribe: `${PORTAL_BASE.doctor}/prescribe`,
    prescriptions: `${PORTAL_BASE.doctor}/prescriptions`,
    status: `${PORTAL_BASE.doctor}/status`,
    kit: `${PORTAL_BASE.doctor}/kit`,
  },

  admin: {
    root: PORTAL_BASE.admin,
    dashboard: `${PORTAL_BASE.admin}/dashboard`,
    flagged: `${PORTAL_BASE.admin}/flagged`,
    flaggedDetail: (candidateId: Id) => `${PORTAL_BASE.admin}/flagged/${candidateId}`,
    doctors: `${PORTAL_BASE.admin}/doctors`,
    doctorDetail: (doctorId: Id) => `${PORTAL_BASE.admin}/doctors/${doctorId}`,
    pharmacies: `${PORTAL_BASE.admin}/pharmacies`,
    pharmacyDetail: (pharmacyId: Id) => `${PORTAL_BASE.admin}/pharmacies/${pharmacyId}`,
    patientFlags: `${PORTAL_BASE.admin}/patient-flags`,
    ledger: `${PORTAL_BASE.admin}/ledger`,
    audit: `${PORTAL_BASE.admin}/audit`,
    settingsKey: `${PORTAL_BASE.admin}/settings/key`,
    kit: `${PORTAL_BASE.admin}/kit`,
  },

  verification: {
    root: PORTAL_BASE.verification,
    verify: `${PORTAL_BASE.verification}/verify`,
    photoVerification: `${PORTAL_BASE.verification}/photo-verification`,
    signIn: `${PORTAL_BASE.verification}/sign-in`,
    register: `${PORTAL_BASE.verification}/register`,
    trustTiers: `${PORTAL_BASE.verification}/trust-tiers`,
    kit: `${PORTAL_BASE.verification}/kit`,
  },

  organization: {
    root: PORTAL_BASE.organization,
    register: `${PORTAL_BASE.organization}/register`,
    doctors: `${PORTAL_BASE.organization}/doctors`,
    activity: `${PORTAL_BASE.organization}/activity`,
    kit: `${PORTAL_BASE.organization}/kit`,
  },
} as const;
