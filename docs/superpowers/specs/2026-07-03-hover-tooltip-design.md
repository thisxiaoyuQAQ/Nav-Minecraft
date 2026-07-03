# Hover Tooltip Design

**Date:** 2026-07-03

## Goal

When the user hovers a specific navigation card, show a small styled popup with that card's full description, while keeping the card layout compact.

## Current Context

- The app is a React/Vite project.
- Navigation cards render in `src/App.tsx` inside `NavCard`.
- Each card already has `link.description`.
- `src/App.css` currently clamps `.card-content span` to two lines, so long descriptions are truncated in the card.

## Approved Interaction

- Keep the in-card description clamped to two lines.
- Show a custom tooltip when the card is hovered.
- Show the same tooltip when the card receives keyboard focus via `:focus-visible`.
- Hide the tooltip when hover/focus leaves the card.
- The tooltip displays the full `link.description` text.
- The tooltip uses the existing green glass/Minecraft-inspired visual language.
- The tooltip must not block clicking the underlying card.
- Reduced-motion users should not get meaningful animation.

## Architecture

Use a CSS-first implementation with a small markup addition in `NavCard`:

- Add a `span.card-tooltip` inside each `.nav-card`.
- Reuse `link.description` as tooltip content.
- Use CSS selectors on `.nav-card:hover .card-tooltip` and `.nav-card:focus-visible .card-tooltip` to reveal the tooltip.
- Keep the existing two-line clamp unchanged for `.card-content span`.

This avoids new dependencies, global event listeners, and React state.

## Accessibility

- The full description remains present in the DOM inside the card.
- Keyboard users can reveal the tooltip by tabbing to the link.
- The tooltip should be `aria-hidden="true"` so it does not duplicate the same description for screen readers.
- The link accessible name remains driven by the visible title/description text.

## Responsive Behavior

- Desktop and pointer devices show the tooltip above the card.
- On small screens, keep the tooltip disabled or visually suppressed to avoid covering tap targets.

## Testing

Add/adjust tests to verify:

- Each nav card renders a `.card-tooltip` element containing the full description.
- Existing card link behavior still works.
- CSS contains the tooltip selectors for hover/focus-visible and preserves the two-line clamp rule.

## Files

- Modify `src/App.tsx` for tooltip markup.
- Modify `src/App.css` for tooltip styling.
- Modify `src/App.test.tsx` and/or `src/AppCss.test.ts` for regression coverage.
