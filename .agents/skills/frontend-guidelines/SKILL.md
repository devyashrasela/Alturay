---
name: frontend-guidelines
description: Architecture conventions and coding rules for the Alturay frontend stylesheet and component structure. Mandates modular, co-located component CSS.
license: MIT
metadata:
  author: alturay
  version: "1.0.0"
---

# Alturay Frontend Architecture & Styling Guidelines

## Core Principles

1. **Modular, Co-Located Component CSS Architecture:**
   - Every UI component and page must have its styling located in a dedicated `.css` file placed directly alongside its `.jsx` component file (e.g., `Button.css` alongside `Button.jsx`, `Sidebar.css` alongside `Sidebar.jsx`).
   - Import the CSS file at the top of the corresponding JSX file using standard ES imports (e.g., `import './Button.css';`).

2. **Global Stylesheet (`src/index.css`) Scope:**
   - `src/index.css` is reserved **strictly** for:
     - `@font-face` definitions
     - Design system tokens (`:root`, `[data-theme="dark"]`, `[data-theme="light"]`)
     - Global resets (`*`, `html`, `body`, `#root`, standard element resets)
     - Global scrollbar rules and accessibility motion queries (`@media (prefers-reduced-motion: reduce)`)
     - Universal utility classes (`.ic`, `.num`, `.flex`, `.text-muted`, `.w-full`, etc.)
     - Shared global layout primitives (such as `.page-header`)
   - **Never** add component-specific styles, IDs, or page-level blocks to `index.css`.

3. **CSS Variable Consumption:**
   - Never duplicate `:root` or `@import 'index.css'` inside component `.css` files.
   - All component `.css` files consume design tokens directly via standard `var(--token-name)` variables (e.g., `var(--panel)`, `var(--border)`, `var(--text)`, `var(--accent)`, `var(--space-4)`, `var(--radius-md)`), which are globally resolved from `index.css`.

4. **Responsive Media Queries:**
   - All `@media` queries specific to a component must reside inside that component's co-located `.css` file, kept alongside its default styles.
   - Media breakpoints follow standard tiers (`1200px`, `1024px`, `768px`, `640px`, `420px`).
