---
name: frontend-guidelines
description: Architecture conventions and coding rules for the Alturay frontend stylesheet and component structure. Mandates modular, co-located component CSS and strict One-Component-Per-Folder architecture.
license: MIT
metadata:
  author: alturay
  version: "1.0.0"
---

# Alturay Frontend Architecture & Styling Guidelines

## 1. One-Component-Per-Folder Architecture

Every UI component and page in `client/src/components/` and `client/src/pages/` must reside in its own dedicated **PascalCase** folder containing its `.jsx` file and its dedicated `.css` file (if styled):

```
client/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── AppLayout.css
│   │   │   └── appShell.css
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   └── Sidebar/
│   │       ├── Sidebar.jsx
│   │       └── Sidebar.css
│   └── ui/
│       ├── Button/
│       │   ├── Button.jsx
│       │   └── Button.css
│       └── StatusBadge/
│           └── StatusBadge.jsx
└── pages/
    ├── Dashboard/
    │   ├── DashboardPage/
    │   │   ├── DashboardPage.jsx
    │   │   └── Dashboard.css
    │   └── RevenueOverviewChart/
    │       └── RevenueOverviewChart.jsx
    └── Invoices/
        ├── InvoicesPage/
        │   ├── InvoicesPage.jsx
        │   └── InvoicesPage.css
        └── CreateInvoicePage/
            ├── CreateInvoicePage.jsx
            └── CreateInvoice.css
```

### Import Conventions
* **Direct Component Imports:** Follow the Vercel React best practice `bundle-barrel-imports` and import directly from the component file:
  ```js
  import Button from '../ui/Button/Button';
  import Header from '../layout/Header/Header';
  ```
* **Directory Index Files:** Preserve existing `index.js` only where explicitly maintained (such as `DataTable/index.js`).
* **Co-located CSS Imports:** Every component imports its dedicated `.css` file at the top of its `.jsx` file:
  ```js
  import './Button.css';
  ```

---

## 2. Global Stylesheet (`src/index.css`) Scope

`src/index.css` is reserved **strictly** for:
1. `@font-face` definitions (e.g., `Mona Sans`).
2. Design system tokens (`:root`, `[data-theme="dark"]`, `[data-theme="light"]`).
3. Theme-specific logo invert rules.
4. Global reset (`*`, `html`, `body`, `#root`, headings, form inputs, selection, and custom scrollbars).
5. Universal utility classes (`.ic`, `.num`, `.flex`, `.text-muted`, `.w-full`, etc.).
6. Shared page header pattern (`.page-header*`, `.section-label`).
7. Global accessibility rules (`@media (prefers-reduced-motion: reduce)`).

**Never** add component-specific styles, IDs, or page-level blocks to `index.css`.

---

## 3. CSS Variable Consumption

* **Never** duplicate `:root` or `@import 'index.css'` inside component `.css` files.
* All component `.css` files consume design tokens directly via standard `var(--token-name)` variables (e.g., `var(--panel)`, `var(--border)`, `var(--text)`, `var(--accent)`, `var(--space-4)`, `var(--radius-md)`), which are globally resolved from `index.css`.

---

## 4. Responsive Media Queries

* All `@media` queries specific to a component must reside inside that component's co-located `.css` file.
* Media breakpoints follow standard tiers: `1200px`, `1024px`, `768px`, `640px`, and `420px`.
