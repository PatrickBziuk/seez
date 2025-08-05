# Plan 10005: LanguageSwitcher Component & Header Integration

## Goal

Provide a responsive, accessible language switcher integrated into the site header, supporting all available locales.

## Steps

- Refactor LanguageSwitcher for minimized default state
- Implement toggle logic and accessibility features
- Test responsive placement and styling
- Integrate LanguageSwitcher into header
- Pass locale context from layout/page
- Document integration steps and lessons learned

## Edge Cases

- Multiple switchers rendered
- Unavailable languages
- Keyboard navigation issues

## Impact

- Improved user control over language
- Consistent i18n context across site

## Checklist

- [x] Minimized state
- [x] Toggle logic
- [x] Accessibility
- [x] Responsive styling
- [x] Header integration
- [x] Documentation

## References

- See `docs/design.md`, `docs/technical-spec.md`, `docs/implementation.md`
- Related tasks in `docs/todo.md`
