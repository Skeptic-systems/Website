## Current State
- Topbar shows theme toggle, login button on desktop; theme toggle lacks handler.
- Mobile nav mirrors desktop actions; no accent or locale controls exist.
- i18n files contain only basic keys with no navbar entries.

## Final State
- Navbar presents interactive stubs for theme toggle, accent selector, and locale switch grouped to the right of nav links.
- Accent selector exposes four options via icon-triggered control with placeholder callbacks.
- Locale button sits beside accent control with structure ready for future logic.
- Desktop and mobile layouts keep nav links centered and login button last on the right.

## Files To Touch
- `apps/www/src/components/topbar.tsx`
- `apps/www/src/components/theme-toggle.tsx`
- `apps/www/src/components/accent-toggle.tsx` (new)
- `apps/www/src/components/locale-toggle.tsx` (new)
- `apps/www/src/components/ui/resizable-navbar.tsx`
- `apps/www/src/components/ui/toggle-button.tsx` (new if needed)
- `apps/www/src/locals/en.json`
- `apps/www/src/locals/de.json`

## Tasks
- [ ] Inspect existing toggle patterns for reuse.
- [ ] Design reusable button styles matching current UI.
- [ ] Implement accent toggle component with four static options.
- [ ] Implement locale toggle button placeholder.
- [ ] Wire components into navbar desktop and mobile layouts preserving alignment.
- [ ] Add translation keys for new labels.
- [ ] Run lint on modified files.

