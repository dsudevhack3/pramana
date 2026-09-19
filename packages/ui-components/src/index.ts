/**
 * @pramana/ui-components
 *
 * The SS5 component library. Every app consumes these; no app defines a local
 * button, badge, table or trust indicator. Adding a variant here is always
 * preferred over inventing a one-off component in an app.
 */
export { Button } from './Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button/Button';

export { Badge } from './Badge/Badge';
export type { BadgeProps, BadgeStatus } from './Badge/Badge';

export { TrustTierBadge } from './TrustTierBadge/TrustTierBadge';
export type { TrustTierBadgeProps } from './TrustTierBadge/TrustTierBadge';

export { Input, Textarea, Select, Field, LabelledInput } from './Input/Input';
export { OTPInput } from './OTPInput/OTPInput';
export { StepperProgress } from './StepperProgress/StepperProgress';
export type { Step } from './StepperProgress/StepperProgress';

export { Modal } from './Modal/Modal';
export type { ModalProps } from './Modal/Modal';

export { DataTable } from './DataTable/DataTable';
export type { Column, DataTableProps, RowSeverity } from './DataTable/DataTable';

export { StatusRow } from './StatusRow/StatusRow';
export { SealMark } from './SealMark/SealMark';
export { RecordHash } from './RecordHash/RecordHash';
export { InlineNotice } from './InlineNotice/InlineNotice';
export type { NoticeTone } from './InlineNotice/InlineNotice';

export { ToastProvider, useToast } from './Toast/Toast';
export { Card, CardHeader, CardBody } from './Card/Card';
export { ScanFrame } from './ScanFrame/ScanFrame';
export { QRCode } from './QRCode/QRCode';
export { Icon } from './Icon/Icon';
export type { IconName } from './Icon/Icon';
export { KitPage } from './Kit/KitPage';

export { cn } from './lib/cn';
export { EASE, DUR, prefersReducedMotion, useReducedMotion } from './lib/motion';
export { useTheme } from './lib/useTheme';
