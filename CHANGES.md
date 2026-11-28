# Redesign notes

## Design system
- Tokens live in `src/index.css` (surface, border, text, accent, status colors, plus derived tints). Every component reads them, so each theme preset restyles the whole app in both dark and light modes. Custom accent colors get automatically readable text.
- Fonts are self-hosted via `@fontsource-variable` (Hanken Grotesk for UI, Bricolage Grotesque for timer digits and numbers). The Google Fonts request was removed.
- Shared primitives are in `src/components/ui` (Button, Field, Modal with focus trap, ConfirmDialog, Switch, Checkbox, Tabs, ProgressBar, PriorityBadge, EmptyState, Skeleton, ...). Task UI is in `src/components/tasks`.
- `framer-motion` was removed (not needed), and icons are imported individually. JS bundle: 1.82 MB to about 0.99 MB.

## Bugs fixed
- Tasks due today also appeared as Overdue.
- Due dates and habit days were computed in UTC, so they could shift by a day. Both now use the local calendar day (no data migration needed).
- Backups failed to import when the theme was "System". Backups now include theme preset and custom accent, unknown settings are ignored, and "Replace" asks for confirmation first.
- A failed cloud load, or a refresh before the debounced upload finished, could overwrite local edits with an older cloud copy. Unsynced local changes are now tracked across reloads and win until uploaded; edits are never uploaded before the cloud copy has loaded.
- Header search did nothing; session notifications toggle did nothing; Focus sound stopped when leaving the page.
- Deleting a project left tasks pointing at a missing project; they are now unassigned.
- Selected timer task could be completed or deleted while still attached to the timer.
- Register ignored email-confirmation flow; Upgrade page showed fabricated statistics.

## Known limits
- Tasks of projects shared with you live in the owner's workspace and are not loaded here (unchanged); the page now says so instead of redirecting.
- Password reset, real checkout, and real-Supabase flows (invites, shared projects) were not changed or tested against a live backend.
