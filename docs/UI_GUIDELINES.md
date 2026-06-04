# UI Guidelines

## 1. Direction

Pickit Goods should feel simple, trustworthy, and easy to scan.

Use Toss app/web as a reference for clarity, spacing, and confident interaction patterns, but do not copy Toss UI exactly.

The current visual direction is dark-first: start from a polished dark interface, then make sure light mode remains equally usable.

## 2. Core Principles

- Use wide spacing so each decision feels calm.
- Keep information hierarchy obvious: title, short description, key action, supporting details.
- Use large readable titles and concise body text.
- Prefer rounded card layouts for grouped content.
- Use clear CTA buttons with action-oriented labels.
- Use soft status badges for states such as 판매중, 구매마감, 품절, placeholder.
- Design mobile-first and expand layout for larger screens.
- Make the next action obvious on every page.
- Use shared theme variables instead of one-off hardcoded colors.
- Check both light and dark modes before finishing UI work.

## 3. Page Structure

User-facing pages should generally follow this order:

1. Page title
2. Short explanation
3. Primary action or next step
4. Important status or guide badges
5. Supporting content

Avoid long instructional paragraphs. If explanation is needed, split it into short cards or concise text blocks.

## 4. Layout

- Use generous vertical spacing between sections.
- Keep content width constrained on desktop.
- Use full-width sections or simple cards, not nested cards.
- Cards should have rounded corners, subtle borders, and calm shadows.
- Avoid dense tables on user pages unless the task is comparison-heavy.

## 5. Buttons and Actions

- Primary CTA should be visually clear and easy to find.
- Secondary actions should be quieter than the primary CTA.
- Button labels should describe the action, such as `가챠 보러가기` or `수령 요청하기`.
- Disabled or unavailable actions should explain why in nearby text or state badges.
- Icon-only buttons must include `aria-label`.
- Touch targets should generally be at least 40px high, preferably 44px or more for frequent actions.

## 6. Status Badges

Use calm badge colors and short labels.

- 판매중
- 구매마감 · 보유권 사용 가능
- 품절
- Placeholder
- Read-only

Badges should support understanding, not decorate the page.

## 7. Mobile

- Start with a single-column layout.
- Keep tap targets comfortable.
- Avoid text that overflows inside cards or buttons.
- Navigation may wrap or collapse if needed.
- Main content should be readable without horizontal scrolling.
- Prefer cards/lists over tables on small screens.
- Quantity controls and payment CTAs must be easy to tap.
- Header content must wrap cleanly without overlapping.

## 8. Theme

Supported themes:

- `dark`
- `light`

Behavior:

- Default theme is `dark`.
- User selection is stored in `localStorage`.
- Reloading the page must preserve the selected theme.
- Header includes an icon-only theme toggle button.
- The toggle button must include an accessible label, such as `aria-label="테마 변경"`.

Implementation rules:

- Use CSS variables for shared colors.
- Do not hardcode new component colors unless there is a strong reason.
- New cards, buttons, badges, dividers, and text colors should reuse existing variables or common classes.
- Verify enough contrast in both themes.

## 9. Card, Button, Badge Style

Cards:

- Use soft surfaces that contrast with the page background.
- Use subtle borders that remain visible in dark mode.
- Avoid putting cards inside cards.

Buttons:

- Primary actions use the shared primary CTA style.
- Secondary actions stay quiet and must not compete with the main action.
- Disabled buttons must look disabled and include nearby explanation where needed.

Badges:

- Use short labels.
- Use calm state colors.
- State badges must be readable in both light and dark mode.

## 10. Admin UI

Admin pages should remain quieter and denser than user pages.

- Prioritize scanability.
- Use restrained cards and lists.
- Include a common admin topbar with service-home navigation, theme toggle, current user context, and logout.
- Keep admin topbar actions compact and usable on mobile.
- Make read-only areas visually distinct.
- Never expose UI for editing confirmed winning results.

## 11. UI Review Checklist

Before finishing UI work:

- Check mobile layout first.
- Check light mode.
- Check dark mode.
- Confirm Header does not break on narrow screens.
- Confirm CTA labels and disabled states are readable.
- Confirm card and badge contrast.
- Confirm icon-only buttons have accessible labels.
- Confirm there is no horizontal scrolling on mobile.

## 12. MVP Rule

For MVP, clarity is more important than visual richness.

Do not add decorative effects unless they improve user understanding or workflow confidence.
