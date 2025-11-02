## Current State
- Global styles in `apps/www/src/app/globals.css` default to dark palette and lack explicit light theme tokens.
- `apps/www/src/app/layout.tsx` forces dark `body` classes, preventing light mode usage.
- Accent toggle keeps local state only and does not update shared accent variables.

## Final State
- Light and dark theme tokens defined separately and applied via CSS variables with `next-themes`.
- Root layout uses theme variables without forcing dark classes.
- Accent selection persists and updates CSS variables with light/dark variants.

## Files To Touch
- `apps/www/src/app/layout.tsx`
- `apps/www/src/app/globals.css`
- `apps/www/src/components/theme-provider.tsx`
- `apps/www/src/components/navbar/accent-toggle.tsx`
- `apps/www/src/components/topbar.tsx`
- Possibly new accent/theme context under `apps/www/src/components` or `src/lib`

## Task Checklist
- [ ] Define structured theme tokens for light and dark backgrounds and accents.
- [ ] Update layout and provider to expose theme + accent contexts.
- [ ] Wire accent toggle to new context with persistence (e.g., localStorage).
- [ ] Verify Tailwind variables align with updated tokens.

