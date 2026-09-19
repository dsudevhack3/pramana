/**
 * CONFLICT NOTE (design system SS5/SS10 vs the provided file structure)
 *
 * The file structure lists components/common/{Button,Input,StatusBadge} inside
 * this app. The design system says no app re-implements a button, badge or
 * trust indicator locally, regardless of how the file structure names or
 * organises its apps.
 *
 * Resolved in favour of the design system without deleting the path: this file
 * keeps the import site the structure expects, and re-exports the shared
 * component. There is still exactly one Button implementation in the repo.
 * If the structure is authoritative for you and you want a genuinely local
 * button, that is the decision to make deliberately - not by drifting into it.
 */
export { Button } from '@pramana/ui-components';
export type { ButtonProps, ButtonSize, ButtonVariant } from '@pramana/ui-components';
