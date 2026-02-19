# Accessibility Checklist

## Quick Reference Checklist

Use this checklist when creating or reviewing components for accessibility compliance.

### ✅ ARIA Labels

- [ ] All `IconButton` components have `aria-label`
- [ ] All images have `alt` text or `aria-hidden="true"`
- [ ] Form inputs have associated `aria-describedby` for errors
- [ ] Buttons with icons have descriptive `aria-label`
- [ ] Navigation items have `aria-current="page"` when active
- [ ] Expandable sections have `aria-expanded`
- [ ] Menus have `aria-haspopup` and `aria-controls`

### ✅ Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate lists/menus
- [ ] No keyboard traps
- [ ] Focus returns to trigger after closing modal

### ✅ Focus Management

- [ ] All interactive elements have visible focus indicators
- [ ] Focus-visible styles are implemented
- [ ] Focus order follows visual order
- [ ] Skip links implemented
- [ ] Focus trapped in modals
- [ ] Focus returned after modal close

### ✅ Color Contrast

- [ ] Text meets 4.5:1 contrast ratio (normal text)
- [ ] Text meets 3:1 contrast ratio (large text)
- [ ] UI components meet 3:1 contrast ratio
- [ ] Focus indicators meet 3:1 contrast ratio
- [ ] Error states are not color-only

### ✅ Forms

- [ ] All inputs have labels
- [ ] Labels are associated with inputs (`htmlFor` or `aria-labelledby`)
- [ ] Error messages are associated (`aria-describedby`)
- [ ] Required fields indicated (`aria-required` or `required`)
- [ ] Invalid fields marked (`aria-invalid`)
- [ ] Form validation announced to screen readers

### ✅ Semantic HTML

- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Lists use `<ul>`, `<ol>`, `<li>`
- [ ] Buttons use `<button>` not `<div>`
- [ ] Links use `<a>` with `href`
- [ ] Forms use `<form>` element
- [ ] Landmarks used (`<main>`, `<nav>`, `<header>`)

### ✅ Screen Reader Support

- [ ] Status messages use `aria-live`
- [ ] Loading states use `aria-busy`
- [ ] Dynamic content announced
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Page titles are descriptive
- [ ] Language declared (`lang` attribute)

### ✅ Responsive & Motion

- [ ] Touch targets minimum 44x44px
- [ ] No motion-only interactions
- [ ] Reduced motion respected
- [ ] Content readable at 200% zoom
- [ ] No horizontal scrolling at 320px width

## Component-Specific Checklist

### Buttons

- [ ] Has `aria-label` if icon-only
- [ ] Has `aria-busy` when loading
- [ ] Has `aria-disabled` when disabled
- [ ] Keyboard accessible (Enter/Space)
- [ ] Focus-visible styles

### Forms

- [ ] Label associated with input
- [ ] Error message associated (`aria-describedby`)
- [ ] Required field indicated
- [ ] Invalid state marked (`aria-invalid`)
- [ ] Helper text accessible

### Navigation

- [ ] Current page marked (`aria-current="page"`)
- [ ] Expandable items have `aria-expanded`
- [ ] Menu items have `aria-haspopup`
- [ ] Skip links implemented
- [ ] Keyboard navigation works

### Modals/Dialogs

- [ ] Has `role="dialog"`
- [ ] Has `aria-labelledby` or `aria-label`
- [ ] Focus trapped inside
- [ ] Escape closes modal
- [ ] Focus returned on close
- [ ] Backdrop click closes (optional)

### Tables

- [ ] Has `<caption>` or `aria-label`
- [ ] Headers use `<th>` with `scope`
- [ ] Complex tables have `aria-describedby`
- [ ] Sortable columns announced
- [ ] Keyboard navigation works

### Images

- [ ] Has `alt` text (descriptive)
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Complex images have long description
- [ ] Images in links have descriptive alt text

## Testing Checklist

### Automated Testing

- [ ] axe DevTools passes
- [ ] WAVE extension passes
- [ ] Lighthouse accessibility score > 90
- [ ] No console accessibility warnings

### Manual Testing

- [ ] Keyboard-only navigation works
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Color contrast verified
- [ ] Focus indicators visible
- [ ] Text resizable to 200%

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Quick Fixes

### Missing ARIA Label

```tsx
// ❌ Bad
<IconButton onClick={handleClick}>
  <MenuIcon />
</IconButton>

// ✅ Good
<IconButton 
  aria-label="Open navigation menu"
  onClick={handleClick}
>
  <MenuIcon />
</IconButton>
```

### Missing Focus Styles

```tsx
// ❌ Bad
<Button sx={{ '&:focus': { outline: 'none' } }}>

// ✅ Good
<Button sx={{ 
  '&:focus-visible': { 
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: '2px',
  },
  '&:focus': { outline: 'none' },
}}>
```

### Missing Keyboard Support

```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</button>
```

## Resources

- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Patterns:** https://www.w3.org/WAI/ARIA/apg/
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **axe DevTools:** https://www.deque.com/axe/devtools/

---

**Use this checklist for every component review!**
