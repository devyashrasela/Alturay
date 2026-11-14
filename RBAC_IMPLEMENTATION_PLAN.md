# Alturay — Role-Based Access Control (RBAC) & "Users & access" Implementation Plan

> **Audience:** the coding agent implementing this feature.
> **Status:** design approved by product owner, decisions marked **[DEFAULT]** may be tweaked later without redesign (they live in one file — see §4).
> **Read §0 first.** Then implement in the phase order in §13.

---

## 0. Rules for the implementing agent

1. **Follow existing conventions. Do not refactor unrelated code.**
   - Backend: CommonJS, Express routers with `mergeParams: true`, Sequelize models with `underscored: true`, Joi validators run through `middlewares/validate.js`, response envelope `{ success, data, meta }` / `{ success:false, error:{ code, message } }`.
   - Frontend: React 19 + Vite, Redux Toolkit + RTK Query (`baseApi.injectEndpoints`), existing UI kit (`Modal`, `ConfirmDialog`, `FormField`, `InputField`, `SelectDropdown`, `SearchableSelectDropdown`, `Button`, `DataTable`, `PageHeader`, `EmptyState`, `StatusBadge`-style badges), toasts via `addToast`. Styling uses the CSS tokens in `client/src/index.css` (`--panel`, `--border`, `--accent`, `--text`, `--muted`, `--danger`, …). **No hard-coded colours** except via `color-mix()` on tokens. Must look right in both light and dark themes.
2. **The server is the single source of truth for permissions.** The client never re-implements the role→permission matrix; it receives a `permissions[]` array from the API (§7.4). The client only hides/disables UI as a convenience. **Every protected action must also be enforced on the backend.**
3. **Roles are read from the database on every request** (`tenantMiddleware` already does a `BusinessMember` lookup). Never put the role inside the JWT.
4. Legacy files that are **not** used by the active shell (`components/layout/Header.jsx`, `Sidebar.jsx`, `SidebarNavItem.jsx`, `NotificationsMenu.jsx`) must not be extended. The active shell is `AppLayout` → `TopNav` + `SecondarySidebar` + `QuickActions` + `navConfig.js`.
5. Dev DB uses `sequelize.sync()` **without** `alter`, so schema changes **must** ship as migrations in `server/src/migrations` (follow the `describeTable` guard style of the existing migrations) and the model files must be updated to match.
6. When finished, update `README.md` (Key Features, DB diagram role list, API table, Roadmap "Team & Member Invitations").

---

## 1. Goals / Non-goals

### Goals
- Four fixed roles per business: **Owner, Admin, Manager, Staff**.
- A "**Users & access**" page (`/settings/users`) where authorised members add an **already-registered** Alturay user by **email**, pick a **role** from a dropdown, and save. The business then appears in that user's business list.
- Authorised members can change a member's role or remove a member. Any non-owner can leave a business.
- Strict **backend** enforcement on every business-scoped endpoint, plus **frontend** gating (navigation, buttons, route guards, 403 page).
- A role-aware UI: each role gets a sensible landing page, navigation, and visible actions.

### Non-goals (v1)
- Inviting people who have no account (no email infrastructure exists). Show a clear "ask them to register first" message instead.
- Custom/user-defined roles or per-user permission overrides.
- Multiple owners and ownership transfer (**[DEFAULT]** exactly one owner per business; transfer is a v2 item, stub the UI as "Coming soon" only if trivial, otherwise omit).
- Deleting a business.
- Email notifications to the added user.

---

## 2. Current state (verified from the codebase) and gaps to fix

| Area | Today | Gap / action |
|---|---|---|
| `BusinessMember` model | `role ENUM('owner','admin','member')`, unique `(user_id, business_id)` | Change to `owner/admin/manager/staff`; migrate `member → staff` (§6). |
| `tenantMiddleware` | Checks membership, sets `req.business`, `req.businessId`, `req.memberRole` | Add permission helpers (`req.can`); change error code to `NOT_A_MEMBER`. |
| Authorisation | **None.** Any member can create/edit/delete products, customers, invoices, change templates and overwrite business settings (`PUT /businesses/:id`). | Add `requirePermission` on every route + field-level checks on business update + status-transition checks on invoices. |
| `GET /businesses` | Returns flat `role` per business | OK. Keep. |
| `GET /auth/me` | Returns `businesses[]` with role nested under `BusinessMember.role` and **without** flat `role` or the `default_*` billing fields | `AppLayout` overwrites `activeBusiness` with this shape, so `activeBusiness.role` is lost after reload. **Do not rely on `activeBusiness.role`** — use the new `/access` endpoint (§7.4). Also flatten `role` in `getMe` for consistency. |
| `AppLayout` restore effect | Only runs when `user.businesses.length > 0` | If the user has **zero** businesses (e.g. was removed from their last one) a stale `activeBusinessId` stays in localStorage. Fix: if `businesses` is empty → `dispatch(clearBusiness())`. |
| Hard-coded role text | `UserSettingsModal` profile tab shows **"Owner / Administrator"** and "Full access to catalog and billing"; `WorkspaceFacts` and `IdentityCard` default to **"Owner"** when role is missing | Replace with the real role from `useAccess()`. |
| `navConfig.js` | Settings sidebar has `Users & access` → `/settings/users` with `soon: true` | Enable it, route it, gate it. |
| Landing after login/switch | Always `/dashboard` | Role-aware home path (§8.3). |
| Invoice model | No creator | Add `created_by` (§6) to support "staff can edit only their own drafts". |

---

## 3. Roles and hierarchy

Rank (higher = more powerful): `staff=1 < manager=2 < admin=3 < owner=4`.

| Role | Intent |
|---|---|
| **Owner** | The business creator. Full control, including identity-level settings (QR prefix) and managing Admins. Exactly one per business. |
| **Admin** | Runs the business day-to-day: all operational data, billing configuration, business profile, and team management for Managers and Staff. |
| **Manager** | Runs operations: sees the dashboard, manages products/customers, edits/issues/cancels invoices, marks them paid. Can **view** the team but not change it. No settings. |
| **Staff** | Front-line / billing counter: sees products and customers, creates customers, creates invoices/bills, edits **their own drafts**, issues documents. No dashboard financials, no settings, no deletes. |

### Hierarchy rule (applies to all member management)
> A member can only **assign, change, or remove** roles that are **strictly below their own rank**, and can only act on members who are **strictly below their own rank**.

Consequences:
- Owner may assign `admin`, `manager`, `staff`. Admin may assign `manager`, `staff`. Manager/Staff cannot manage anyone.
- Nobody can assign `owner` (**[DEFAULT]** single owner).
- Nobody can change or remove their **own** membership through the member endpoints (use *Leave business*; the owner cannot leave).
- An Admin cannot touch another Admin or the Owner.

---

## 4. Permission catalog and matrix (single source of truth)

All permission keys are strings `resource.action`. The matrix lives **only** in `server/src/constants/roles.js`.

| Permission | Owner | Admin | Manager | Staff | Notes |
|---|:-:|:-:|:-:|:-:|---|
| `dashboard.view` | ✅ | ✅ | ✅ | ❌ | Revenue/outstanding stats (`/dashboard/stats`). |
| `product.view` | ✅ | ✅ | ✅ | ✅ | Needed by everyone to build invoices. |
| `product.create` | ✅ | ✅ | ✅ | ❌ | |
| `product.update` | ✅ | ✅ | ✅ | ❌ | |
| `product.delete` | ✅ | ✅ | ❌ | ❌ | Soft delete. |
| `customer.view` | ✅ | ✅ | ✅ | ✅ | |
| `customer.create` | ✅ | ✅ | ✅ | ✅ | Staff need the inline "Add New Customer" in invoice creation. |
| `customer.update` | ✅ | ✅ | ✅ | ❌ | |
| `customer.delete` | ✅ | ✅ | ❌ | ❌ | |
| `invoice.view` | ✅ | ✅ | ✅ | ✅ | List, detail, PDF, `/dashboard/recent`. |
| `invoice.create` | ✅ | ✅ | ✅ | ✅ | Creates a `draft`. |
| `invoice.edit_own` | ✅ | ✅ | ✅ | ✅ | Edit a **draft** where `created_by = me`. |
| `invoice.edit_any` | ✅ | ✅ | ✅ | ❌ | Edit any **draft**. |
| `invoice.issue` | ✅ | ✅ | ✅ | ✅ | `draft → issued`. **[DEFAULT]** allowed for staff (POS counter). |
| `invoice.mark_paid` | ✅ | ✅ | ✅ | ❌ | `issued → paid`. |
| `invoice.cancel` | ✅ | ✅ | ✅ | ❌ | `draft/issued → cancelled`. |
| `billing.configure` | ✅ | ✅ | ❌ | ❌ | Invoice/bill templates, template preview, invoice settings (due days, payment methods, T&C). |
| `business.view` | ✅ | ✅ | ✅ | ✅ | `GET /businesses/:id`. |
| `business.update_profile` | ✅ | ✅ | ❌ | ❌ | Name, contact, email, phone, address, tax ID, currency, logo. |
| `business.update_identity` | ✅ | ❌ | ❌ | ❌ | `qr_prefix`. |
| `member.view` | ✅ | ✅ | ✅ | ❌ | See the team list + roles catalogue (read-only for Manager). |
| `member.add` | ✅ | ✅ | ❌ | ❌ | Subject to hierarchy rule. |
| `member.update_role` | ✅ | ✅ | ❌ | ❌ | Subject to hierarchy rule. |
| `member.remove` | ✅ | ✅ | ❌ | ❌ | Subject to hierarchy rule. |

`roles.js` must export (all pure, unit-testable, no DB):

```js
const ROLES = ['owner', 'admin', 'manager', 'staff'];
const ROLE_RANK = { staff: 1, manager: 2, admin: 3, owner: 4 };
const PERMISSIONS = { owner: [...], admin: [...], manager: [...], staff: [...] }; // arrays of keys above
const hasPermission = (role, perm) => PERMISSIONS[role]?.includes(perm) ?? false;
const permissionsFor = (role) => [...(PERMISSIONS[role] ?? [])];
const outranks = (actorRole, targetRole) => ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
const assignableRoles = (actorRole) => ROLES.filter((r) => r !== 'owner' && outranks(actorRole, r));
const ROLE_META = { owner: { label: 'Owner', description: '...' }, ... }; // label + one-line description used by API/UI
module.exports = { ROLES, ROLE_RANK, PERMISSIONS, ROLE_META, hasPermission, permissionsFor, outranks, assignableRoles };
```

Role descriptions (`ROLE_META`, shown in the Add-user dropdown):
- **Owner** — "Full control of the business, including identity settings and Admins."
- **Admin** — "Manages business settings, billing configuration and team members below Admin."
- **Manager** — "Manages products, customers and invoices. Can view the dashboard and the team."
- **Staff** — "Creates customers and invoices and edits their own drafts. No settings or financial dashboard."

---

## 5. Business rules for member management

1. **Add user** (`member.add`)
   - Input: `email`, `role` ∈ `admin | manager | staff` and must be in `assignableRoles(actorRole)`.
   - Email is trimmed and matched case-insensitively against `users.email`. The user **must already exist**.
   - If no such user → `404 USER_NOT_FOUND`: *"No Alturay account exists for this email. Ask them to register first, then add them here."*
   - If already a member (any role) → `409 ALREADY_MEMBER`: *"This user is already a member of this business. Change their role from the list instead."*
   - On success create `BusinessMember { user_id, business_id, role }`. The business appears in the new member's list on their next load of `/businesses` (RTK `Business` tag + refetch on focus, §8.2).
2. **Change role** (`member.update_role`): target must be outranked by actor; new role must be in `assignableRoles(actor)`; cannot target self; cannot target owner. No-op if same role (return 200).
3. **Remove member** (`member.remove`): target outranked by actor; cannot target self; cannot target owner. Removal is a hard delete of the `business_members` row. Documents created by the removed user **stay** (`created_by` is kept).
4. **Leave business**: any member except the owner. Owner receives `409 OWNER_CANNOT_LEAVE`.
5. All writes run inside a transaction; the unique index `(user_id, business_id)` is the final guard — map `SequelizeUniqueConstraintError` to `409 ALREADY_MEMBER`.
6. **Anti-enumeration/abuse:** `POST /members` is rate-limited (**20 requests / 15 min per authenticated user**, key = `req.user.id`) because it reveals whether an email is registered. Only authorised members can reach it.

---

## 6. Database changes (migrations)

Create two migrations (dates follow the latest existing one `20261110…`):

### 6.1 `20261111000000-update-business-member-roles.js`
MySQL ENUM change must be done in three steps to avoid data loss:

```sql
ALTER TABLE business_members MODIFY role ENUM('owner','admin','manager','staff','member') NOT NULL DEFAULT 'staff';
UPDATE business_members SET role = 'staff' WHERE role = 'member';
ALTER TABLE business_members MODIFY role ENUM('owner','admin','manager','staff') NOT NULL DEFAULT 'staff';
```
`down`: re-add `member`, map `manager`/`staff` → `member`, drop the new values (document that this is lossy).

Also add a **data sanity check** inside the migration (log a warning, don't fail): businesses with zero `owner` rows.

Update `server/src/models/BusinessMember.js`: `DataTypes.ENUM('owner','admin','manager','staff')`, `defaultValue: 'staff'`.

### 6.2 `20261111000001-add-invoice-created-by.js`
- Add `invoices.created_by CHAR(36) NULL` referencing `users(id)` `ON DELETE SET NULL ON UPDATE CASCADE` + index `idx_invoices_created_by`. (Use `Sequelize.CHAR(36)` like `20261108000001-create-customers-table.js`.)
- Update `models/Invoice.js` (`created_by: UUID, allowNull: true`) and `models/index.js` (`Invoice.belongsTo(User, { foreignKey:'created_by', as:'creator' })`).
- Existing rows keep `NULL` ⇒ only holders of `invoice.edit_any` can edit those drafts.

---

## 7. Backend design

### 7.1 New / changed files

```
server/src/constants/roles.js                  NEW  (§4)
server/src/middlewares/requirePermission.js    NEW
server/src/middlewares/authorizeBusinessUpdate.js NEW
server/src/services/memberRules.js             NEW  (pure functions: canAssign, canManageTarget, …)
server/src/controllers/memberController.js     NEW
server/src/routes/memberRoutes.js              NEW
server/src/validators/memberValidator.js       NEW
server/src/middlewares/tenantMiddleware.js     CHANGE
server/src/routes/index.js                     CHANGE (mount members + access + roles)
server/src/routes/{product,customer,invoice,dashboard,business}Routes.js  CHANGE
server/src/controllers/invoiceController.js    CHANGE (created_by, ownership, status transitions)
server/src/controllers/authController.js       CHANGE (flatten role in getMe)
server/src/models/{BusinessMember,Invoice,index}.js CHANGE
server/src/migrations/20261111000000-…, 20261111000001-…  NEW
server/package.json                            CHANGE ("test": "node --test")
```

### 7.2 Middleware

**`tenantMiddleware`** (extend, keep behaviour):
- Membership missing → `403 { code: 'NOT_A_MEMBER', message: 'You do not have access to this business.' }`.
- After success set: `req.memberRole`, `req.membership` (the row), `req.can = (perm) => hasPermission(req.memberRole, perm)`.

**`requirePermission(...perms)`** (all required) and **`requireAnyPermission(...perms)`**:
```js
// must run AFTER tenantMiddleware
if (!perms.every(req.can)) return res.status(403).json({
  success:false,
  error:{ code:'INSUFFICIENT_ROLE', message:'Your role does not allow this action.', required: perms }
});
```

**`authorizeBusinessUpdate`** — `PUT /businesses/:businessId` currently lets any member overwrite everything. After `validate(updateBusinessSchema)`, check **every key** in `req.body` against this field map; reject the whole request with `403 INSUFFICIENT_ROLE` if any key isn't permitted:

| Body key(s) | Required permission |
|---|---|
| `qr_prefix` | `business.update_identity` |
| `name, contact_details, email, phone, tax_id, address_line1, address_line2, city, state, pincode, currency, logo_url` | `business.update_profile` |
| `invoice_template_id, bill_template_id, receipt_paper_width, default_payment_methods, default_payment_terms, default_terms_and_conditions, default_due_days, default_bill_due_days` | `billing.configure` |
| any unknown key | reject (`400`, already stripped by Joi) |

> Note: `BusinessSettingsPage` saves per card (`name+qr_prefix+logo_url` together in the Identity card). An **Admin** saving that card will send `qr_prefix`. Frontend must therefore **omit `qr_prefix`** from the payload (and render the field read-only) when the user lacks `business.update_identity`. Server still rejects if present **and changed** — **[DEFAULT]** allow the request if `qr_prefix` equals the stored value (unchanged), reject if different.

### 7.3 Route → permission map (apply exactly)

Mounted as in `routes/index.js` (`authMiddleware → tenantMiddleware → router`).

| Method & path | Permission |
|---|---|
| `GET /businesses` | auth only (lists *my* businesses, includes `role`) |
| `POST /businesses` | auth only (creator becomes `owner`) |
| `GET /businesses/check-qr-prefix` | auth only (unchanged) |
| `GET /businesses/:id` | `business.view` |
| `PUT /businesses/:id` | `authorizeBusinessUpdate` (§7.2) |
| `GET /businesses/:id/templates/preview` | `billing.configure` |
| `GET /businesses/:id/access` | any member (§7.4) |
| `GET /businesses/:id/roles` | `member.view` (§7.4) |
| `GET /products`, `GET /products/:id` | `product.view` |
| `POST /products` | `product.create` |
| `PUT /products/:id` | `product.update` |
| `DELETE /products/:id` | `product.delete` |
| `GET /customers`, `GET /customers/:id` | `customer.view` |
| `POST /customers` | `customer.create` |
| `PUT /customers/:id` | `customer.update` |
| `DELETE /customers/:id` | `customer.delete` |
| `GET /invoices`, `GET /invoices/:id`, `GET /invoices/:id/pdf` | `invoice.view` |
| `POST /invoices` | `invoice.create` (+ set `created_by = req.user.id`) |
| `PUT /invoices/:id` | `requireAnyPermission('invoice.edit_any','invoice.edit_own')` **+** controller check: if `!req.can('invoice.edit_any')` then require `invoice.created_by === req.user.id`, else `403 INSUFFICIENT_ROLE` ("You can only edit drafts you created."). Existing "draft only" rule stays. |
| `PATCH /invoices/:id/status` | By **target** status inside controller: `issued → invoice.issue`, `paid → invoice.mark_paid`, `cancelled → invoice.cancel`. Existing transition rules stay. Route-level: `requireAnyPermission('invoice.issue','invoice.mark_paid','invoice.cancel')`. |
| `GET /dashboard/stats` | `dashboard.view` |
| `GET /dashboard/recent` | `invoice.view` (not dashboard — Staff may see recent documents) |
| `GET /members` | `member.view` |
| `POST /members` | `member.add` + rate limiter |
| `PATCH /members/:memberId` | `member.update_role` |
| `DELETE /members/:memberId` | `member.remove` |
| `DELETE /members/me` | any member (leave) |
| `POST /upload/image` | auth only (unchanged; used before a business exists). Known/accepted limitation. |

Also change `invoiceController.list`/`getById` to expose `created_by` and include the creator (`as:'creator', attributes:['id','name']`) so the UI can show "Created by".

### 7.4 New endpoints

**`GET /api/businesses/:businessId/access`** — current user's context (drives the whole frontend):
```json
{ "success": true, "data": {
  "role": "manager",
  "role_label": "Manager",
  "permissions": ["dashboard.view", "product.view", "…"],
  "assignable_roles": ["staff"]
}}
```

**`GET /api/businesses/:businessId/roles`** — catalogue for the roles/permissions matrix UI (so the UI never hard-codes the matrix):
```json
{ "success": true, "data": { "roles": [
  { "id":"owner","label":"Owner","description":"…","rank":4,"permissions":["…"] },
  { "id":"admin", … }, { "id":"manager", … }, { "id":"staff", … }
]}}
```

**`GET /api/businesses/:businessId/members`**
```json
{ "success": true, "data": {
  "members": [{
    "id": "<business_members.id>",
    "user_id": "…", "name": "Ava Park", "email": "ava@x.com",
    "role": "admin", "joined_at": "2026-11-01T…",
    "is_you": false,
    "can_manage": true            // actor outranks this member AND member is not you
  }],
  "assignable_roles": ["manager","staff"]
}}
```
Ordering: owner first, then by rank desc, then `joined_at` asc. Return only `id, name, email` of users (never `password_hash`).

**`POST /api/businesses/:businessId/members`** body `{ email, role }` → `201 { data: { member } }`.
Joi (`memberValidator.js`): `email: Joi.string().trim().email().required()`, `role: Joi.string().valid('admin','manager','staff').required()`.

**`PATCH /api/businesses/:businessId/members/:memberId`** body `{ role }` → `200 { data: { member } }`.

**`DELETE /api/businesses/:businessId/members/:memberId`** → `200 { success:true, data:{ message } }`.

**`DELETE /api/businesses/:businessId/members/me`** → leave. **Route ordering:** declare `/me` **before** `/:memberId`.

Validate `memberId` as UUID (return `400 VALIDATION_ERROR` otherwise). Always scope lookups by `business_id: req.businessId` (prevents touching members of other businesses).

### 7.5 Error codes (all in the standard envelope)

| HTTP | `code` | When |
|---|---|---|
| 403 | `NOT_A_MEMBER` | No membership for this business. |
| 403 | `INSUFFICIENT_ROLE` | Missing permission / hierarchy violation / not own draft. |
| 403 | `ROLE_NOT_ASSIGNABLE` | Role is not below the actor's rank (or is `owner`). |
| 404 | `USER_NOT_FOUND` | Email not registered. |
| 404 | `MEMBER_NOT_FOUND` | `memberId` not in this business. |
| 409 | `ALREADY_MEMBER` | Duplicate membership. |
| 409 | `OWNER_CANNOT_LEAVE` | Owner tries to leave. |
| 409 | `OWNER_IMMUTABLE` | Attempt to change/remove the owner. |
| 400 | `CANNOT_MODIFY_SELF` | Own role change/removal via member endpoints. |

### 7.6 `memberRules.js` (pure, unit tested)
```
canAssign(actorRole, newRole)           -> newRole in assignableRoles(actorRole)
canManageTarget(actorRole, targetRole)  -> targetRole !== 'owner' && outranks(actorRole, targetRole)
decideRoleChange({ actorRole, actorUserId, target:{userId, role}, newRole }) -> { ok } | { ok:false, status, code, message }
decideRemoval({ actorRole, actorUserId, target }) -> same shape
```
Controllers call these so logic is testable without a DB.

---

## 8. Frontend design

### 8.1 New / changed files

```
client/src/store/api/membersApi.js                 NEW  (RTK Query)
client/src/store/api/baseApi.js                    CHANGE (tagTypes + 403 handling)
client/src/hooks/usePermissions.js                 NEW
client/src/constants/roles.js                      NEW  (labels, badge variants, PERMISSION_LABELS groups; NOT the matrix)
client/src/components/auth/Can.jsx                 NEW
client/src/routes/RequirePermission.jsx            NEW
client/src/pages/Forbidden/ForbiddenPage.jsx       NEW
client/src/pages/Settings/users/UsersAccessPage.jsx        NEW
client/src/pages/Settings/users/UsersAccessPage.css        NEW
client/src/pages/Settings/users/AddMemberModal.jsx         NEW
client/src/pages/Settings/users/MemberRoleSelect.jsx       NEW
client/src/pages/Settings/users/RolesPermissionsMatrix.jsx NEW
client/src/components/ui/Badge/RoleBadge.jsx       NEW
client/src/components/layout/navConfig.js          CHANGE (perm-gated nav, home path)
client/src/components/layout/{TopNav,SecondarySidebar,QuickActions,WorkspaceSwitcher,UserMenu}.jsx CHANGE
client/src/components/layout/AppLayout.jsx         CHANGE (access fetch, zero-business fix)
client/src/components/layout/UserSettingsModal.jsx CHANGE (real role)
client/src/App.jsx                                 CHANGE (routes + guards)
client/src/pages/{Dashboard,Products,Customers,Invoices,Settings,Businesses}/**  CHANGE (gating)
client/src/store/slices/businessSlice.js           (no change needed unless storing access; prefer RTK cache)
```

### 8.2 Data flow & infrastructure

**`membersApi.js`** (inject into `baseApi`; add tag types `'Member'`, `'Access'`, `'Roles'` in `baseApi.js`):
- `getAccess(businessId)` → `GET /businesses/:id/access`, `providesTags: ['Access']`
- `getRoles(businessId)` → `GET /businesses/:id/roles`, `providesTags: ['Roles']`
- `getMembers(businessId)` → `providesTags: ['Member']`
- `addMember({businessId,email,role})`, `updateMemberRole({businessId,memberId,role})`, `removeMember({businessId,memberId})` → `invalidatesTags: ['Member']`
- `leaveBusiness(businessId)` → `invalidatesTags: ['Business','Access','Member']`

**Freshness (so role changes/removals propagate):**
- Call `setupListeners(store.dispatch)` in `store/index.js` and set `refetchOnFocus: true, refetchOnReconnect: true` on `baseApi`, so `getAccess` and `getBusinesses` refresh when the tab regains focus (this is how a newly added user sees the business without re-login).
- Wrap `fetchBaseQuery` in `baseApi.js`:
  - on `403` with `error.code === 'NOT_A_MEMBER'` → `dispatch(clearBusiness())` (the existing `ProtectedRoute` then redirects to `/businesses`) + toast "You no longer have access to this business."
  - on `403` with `error.code === 'INSUFFICIENT_ROLE'` → `dispatch(baseApi.util.invalidateTags(['Access']))` + toast with the server message.

**`usePermissions()`**
```js
const { role, roleLabel, permissions, assignableRoles, isLoading, can, canAny } = usePermissions();
can('product.create')            // boolean
canAny('invoice.edit_any','invoice.edit_own')
```
Implementation: `useGetAccessQuery(activeBusinessId, { skip: !activeBusinessId })`; `can` = `permissions.includes(key)`. While loading, `can()` returns `false` and `isLoading` is `true` — **never flash a 403 page while loading**.

**`<Can permission="x" fallback={null}>…</Can>`** and `<Can anyOf={[…]}>` wrappers for buttons/sections.

**`<RequirePermission permission="x">`** route guard: loading → `<PageLoader/>`; allowed → `<Outlet/>`; denied → `<ForbiddenPage/>`.

**Ownership check for editing drafts (UI only):** `canEditInvoice(invoice) = can('invoice.edit_any') || (can('invoice.edit_own') && invoice.created_by === user.id)`; and `invoice.status === 'draft'`.

### 8.3 Navigation, home path, routing

**`navConfig.js`**
- Add `perm` (or `anyPerm`) to sections, sidebar items, the `pill`, and `cta` (`ctaPerm`), and to `QUICK_ACTIONS`.
- Add helper `filterNavForPermissions(sections, can)`; sections with no permitted items disappear from `TopNav`. A section's `path` resolves to its **first permitted item** (`resolveSectionPath`).

| Section / item | Required |
|---|---|
| Dashboard | `dashboard.view` |
| Inventory (All products) | `product.view`; CTA "Add product" → `product.create` |
| Billing → Invoices & bills | `invoice.view` |
| Billing → Create new | `invoice.create` (and CTA "Create new") |
| Billing → Invoice template / Bill template | `billing.configure` |
| Billing → Invoice settings | `billing.configure` |
| Customers | `customer.view` |
| Settings → Business settings | `business.update_profile` |
| Settings → **Users & access** (remove `soon`) | `member.view` |
| Quick action New invoice / New bill | `invoice.create` |
| Quick action Add product | `product.create` |
| Quick action Add customer | `customer.create` |

**Home path** `getHomePath(can)`: `can('dashboard.view') ? '/dashboard' : '/invoices'`. Use it in `BusinessSelectPage.handleSelect`, `handleCreatedSuccess`, `WorkspaceSwitcher.handleSwitch`, and the fallback redirect.

**`App.jsx`**
- Inside `<AppLayout/>` wrap routes with guards:
  - `/dashboard` → `dashboard.view`
  - `/products` → `product.view`
  - `/invoices`, `/invoices/:id` → `invoice.view`
  - `/invoices/new` → `invoice.create`
  - `/invoices/:id/edit` → `anyOf(invoice.edit_any, invoice.edit_own)` (page itself additionally redirects with a toast if the draft isn't theirs/not editable)
  - `/billing/templates/*`, `/billing/settings` → `billing.configure`
  - `/customers` → `customer.view`
  - `/settings` (Business settings) → `business.update_profile`
  - **`/settings/users` → `member.view`** (new route → `UsersAccessPage`)
- The `*` fallback for authenticated users should go to `getHomePath`, not `/login`.
- Note `getActiveSection` matches `startsWith('/settings')`, so `/settings/users` already activates the Settings section/sidebar.

### 8.4 Page-level gating (hide what the role can never do)

Policy: **hide** actions a role can never perform; **hide** state-dependent actions that don't apply; show a read-only banner/tooltip only where it prevents confusion. Server errors are still toasted if anything slips through.

| Page | Gating |
|---|---|
| **Products** | "Add product" (`product.create`); Edit icon (`product.update`); Delete icon (`product.delete`); hide the whole `Actions` column when neither edit nor delete is allowed (Staff). Hide `?add=1` auto-open when not allowed. |
| **Customers** | "Add customer" (`customer.create`); Edit (`customer.update`); Delete (`customer.delete`); hide `Actions` column when none. |
| **Invoices list/panel** | Row-panel buttons: **Edit** — draft && `canEditInvoice`; **Issue** — draft && `invoice.issue`; **Mark Paid** — issued && `invoice.mark_paid`; **Cancel** — (draft\|issued) && `invoice.cancel`; **PDF** always. "New invoice/New bill" → `invoice.create`. |
| **Invoice detail** | Same action rules as the panel. |
| **Create/Edit invoice** | Guard route; in edit mode redirect + toast if not allowed. Staff can use the inline "Add New Customer" (`customer.create`). |
| **Dashboard** | Whole route guarded by `dashboard.view` (Staff never lands here). |
| **Business settings** | Route requires `business.update_profile`. In `IdentityCard`: the **QR prefix field is read-only (with lock icon + tooltip "Only the owner can change this")** unless `business.update_identity`; omit `qr_prefix` from the save payload when read-only. |
| **Billing config pages** | Route guard `billing.configure`. |
| **Business select page** | Show each business's role as a `RoleBadge`. |
| **Workspace switcher** | Show `RoleBadge` (small) next to each business name. Needs `role` — `businesses` in the store come from `/auth/me` (after the §2 `getMe` fix they include flat `role`). |
| **User menu / UserSettingsModal profile tab** | Replace hard-coded "Owner / Administrator" with `roleLabel` and a one-line role description; replace "Full access to catalog and billing" with `ROLE_META` description. |
| **WorkspaceFacts / IdentityCard** | Use `roleLabel` from `usePermissions()` instead of `business.role` default `'Owner'`. |

### 8.5 "Users & access" page (`/settings/users`)

Built with `PageHeader`, `DataTable`, `Modal`, `ConfirmDialog`, existing form components. Follows Business Settings visual language (cards: `--panel`, `--border`, radius 12–16).

**Layout (desktop)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Users & access                                            [ + Add user ]    │
│ Manage who can access Acme Retail and what they can do.   (member.add only) │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search by name or email]                    (Members 4)                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ User                         Role             Joined        Actions     │ │
│ │ (D) Devyash Rasela  [You]    [Owner 🔒]       01 Nov 2026               │ │
│ │     dev@acme.com                                                        │ │
│ │ (A) Ava Park                 [Admin  ▾]       03 Nov 2026     🗑        │ │
│ │ (N) Noah Lane                [Manager ▾]      05 Nov 2026     🗑        │ │
│ │ (M) Mia Roy                  [Staff   ▾]      09 Nov 2026     🗑        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Roles & permissions                                          (collapsible)  │
│   Capability                    Owner  Admin  Manager  Staff                │
│   View dashboard                  ✓      ✓      ✓       –                   │
│   Manage products                 ✓      ✓      ✓       –   …               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Danger zone: [ Leave business ]  (hidden for the owner)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Row behaviour (driven by server `can_manage`)**
- `can_manage === true`: role cell is a dropdown (`MemberRoleSelect`, options = `assignable_roles`), and a trash icon opens `ConfirmDialog` ("Remove *Name* from *Business*? They will lose access immediately. Documents they created are kept.").
- `can_manage === false`: role shown as a static `RoleBadge`; owner row shows a lock icon with tooltip "The owner can't be changed."; no actions.
- "You" chip on the current user's row.
- Role change is optimistic-free: on select → call `PATCH` → toast "Ava is now a Manager." → list refreshes via tag invalidation; on error revert the select and toast the server message.
- **Manager (read-only)**: no "Add user" button, no dropdowns/trash, a muted banner: "You can view the team but only Admins and the Owner can change it."

**`AddMemberModal`**
```
┌ Add user ────────────────────────────────────────┐
│ Email address *                                  │
│ [ name@company.com                          ]    │
│ The person must already have an Alturay account. │
│                                                  │
│ Role *                                           │
│ [ Select a role                              ▾]  │
│   Admin   – Manages settings, billing config…    │
│   Manager – Manages products, customers, invoices│
│   Staff   – Creates customers & invoices…        │
│                                                  │
│ ▸ What can a Manager do?  (expands bullet list)  │
│                                                  │
│                         [ Cancel ] [ Add user ]  │
└──────────────────────────────────────────────────┘
```
- Dropdown options come from `assignable_roles` (Admin sees only Manager/Staff). Each option shows label + description (use `SelectDropdown` with `<option>` text or `SearchableSelectDropdown` with composite labels). Pre-select nothing; require a choice.
- Client validation: required + email regex (same as `LoginPage`). Disable submit while loading (`Button loading`) and guard double submits (`submittingRef` pattern used in `LoginPage`).
- Server error mapping shown **inline under the relevant field** (not just a toast):
  - `USER_NOT_FOUND` → under Email (message from §5).
  - `ALREADY_MEMBER` → under Email.
  - `ROLE_NOT_ASSIGNABLE` / `INSUFFICIENT_ROLE` → under Role.
  - Network/500 → generic alert row like `auth-alert`.
- Success: close modal, toast "*email* added as *Role*", list refreshes.
- Reset form state each time the modal opens (same pattern as `CreateBusinessModal`).

**`RolesPermissionsMatrix`**: fetched from `GET /roles`; rows are human-readable groups defined in `client/src/constants/roles.js` as `PERMISSION_LABELS` (key → `{ group, label }`), e.g. group "Products": View / Add / Edit / Delete. Unknown permission keys fall back to showing the raw key (so a newly added server permission is visible rather than silently dropped). Highlight the current user's role column.

**`RoleBadge`** — pill using existing tokens only:
| Role | Style |
|---|---|
| Owner | `--color-purple` text on `--color-purple-light` |
| Admin | `--accent` on `color-mix(in srgb, var(--accent) 16%, transparent)` |
| Manager | `--color-success` on `--color-success-light` |
| Staff | `--text-2` on `--chip` |

**Responsive**: below 760px render members as stacked cards (name/email, role control, actions) instead of the table; modal goes full-width. All controls keyboard-accessible; dropdowns have labels (`aria-label="Role for Ava Park"`); confirm dialogs restore focus (existing `Modal` does).

**States**: loading → `PageLoader`; empty (only the owner) → `EmptyState` "Invite your team" with Add user CTA (if permitted); error → inline retry.

### 8.6 403 page (`ForbiddenPage`)
Centered `EmptyState`-style card: lock icon, title "You don't have access to this page", text "Your role in *Acme Retail* is **Staff**. Ask an Admin or the Owner if you need access.", primary button **"Go to {home}"** (`getHomePath`).

---

## 9. What each role experiences

| | **Owner** | **Admin** | **Manager** | **Staff** |
|---|---|---|---|---|
| Lands on | Dashboard | Dashboard | Dashboard | **Invoices** |
| Top nav | Dashboard · Inventory · Billing · Customers · Settings | same | Dashboard · Inventory · Billing · Customers · Settings (**Users & access only**) | Inventory · Billing · Customers |
| Inventory | Full CRUD | Full CRUD | View/Add/Edit (no delete) | View only; no actions column |
| Billing sidebar | Documents + PDF templates + Configuration | same | Documents only | Documents only (Create new, list) |
| Invoices | All actions | All actions | Edit any draft, issue, mark paid, cancel | Create, edit **own** drafts, issue; no mark-paid/cancel |
| Customers | Full CRUD | Full CRUD | View/Add/Edit | View/Add |
| Settings | Business settings (incl. QR prefix) + Users & access (manage Admin/Manager/Staff) | Business settings (QR prefix read-only) + Users & access (manage Manager/Staff) | Users & access **read-only** | none |
| Quick actions (+) | all | all | New invoice/bill, Add product, Add customer | New invoice/bill, Add customer |
| Can leave business | ❌ | ✅ | ✅ | ✅ |

---

## 10. Edge cases (must be handled)

1. **User belongs to several businesses with different roles** — permissions are per active business; switching business re-queries `/access` (arg = `businessId`).
2. **Role changed while the user is logged in** — next API call is authorised from the DB; UI updates on focus-refetch or on the first `INSUFFICIENT_ROLE` response.
3. **User removed while the app is open** — first request returns `NOT_A_MEMBER` → clear business → redirect to `/businesses`.
4. **User removed from their last business** — `AppLayout` clears the stale `activeBusinessId` (§2); `/businesses` shows the "Get started / create business" state.
5. **Deep link to a forbidden route** — `RequirePermission` shows `ForbiddenPage` (after access has loaded).
6. **Adding yourself / existing member** — `409 ALREADY_MEMBER`.
7. **Case/whitespace in email** — trimmed, matched case-insensitively.
8. **Concurrent add** — unique index + transaction → `409`, never a duplicate or a 500.
9. **Admin tries to modify another Admin or the Owner** — rejected server-side even if the client is bypassed.
10. **Staff editing someone else's draft / legacy drafts with `created_by = NULL`** — rejected (`INSUFFICIENT_ROLE`); manager+ can edit.
11. **Demoted creator** (manager → staff) keeps edit rights only for their own drafts.
12. **Admin saves Identity card** — payload omits `qr_prefix`; server accepts unchanged `qr_prefix` but rejects a changed one.
13. **Migration on existing data** — all legacy `member` rows become `staff`; the business creator is already `owner`.
14. **PDF / template preview** use `openPdf` (fetch with Bearer + `X-Business-Id`) — 403s must surface as the existing "Could not load PDF" toast.

---

## 11. Security notes

- Never trust the client: every route in §7.3 is enforced server-side; UI gating is cosmetic.
- Role is never read from the token or request body; membership is always looked up by `(req.user.id, businessId)`.
- Member endpoints always filter by `business_id = req.businessId`.
- Rate-limit `POST /members`; log member changes with `logger.info` (`actor`, `target`, `old→new role`, `businessId`). **[Optional v1.1]** persist these into an `audit_logs` table.
- Do not leak `password_hash`; select only `id, name, email` for users.
- Error messages for authorisation failures are generic; `USER_NOT_FOUND` is intentionally explicit (product requirement) but rate-limited and restricted to authorised members.

---

## 12. Testing & acceptance

### 12.1 Automated
- **Server** (`node --test`, no DB needed): `constants/roles.js` (matrix snapshot, `outranks`, `assignableRoles`) and `services/memberRules.js` (all branches of add/update/remove decisions). Add `"test": "node --test"` to `server/package.json`.
- **Client** (existing `node --test` setup): pure helpers (`getHomePath`, `filterNavForPermissions`, `canEditInvoice`).

### 12.2 Manual API matrix (verify with curl/Postman, one token per role)
For each role, call every endpoint in §7.3 and confirm allow/deny exactly as the matrix. Minimum cases:
- Staff: `POST /products` → 403; `GET /products` → 200; `GET /dashboard/stats` → 403; `GET /dashboard/recent` → 200; `PUT /businesses/:id {name}` → 403; `PATCH status paid` → 403; `PATCH status issued` on own draft → 200; `PUT /invoices/:id` on another user's draft → 403.
- Manager: `DELETE /products/:id` → 403; `PUT /invoices/:id` on any draft → 200; `GET /members` → 200; `POST /members` → 403.
- Admin: `POST /members {role:'admin'}` → 403 `ROLE_NOT_ASSIGNABLE`; `PATCH` another admin → 403; `PUT /businesses/:id {qr_prefix:'new'}` → 403; `PUT {tax_id}` → 200; `PUT {default_due_days}` → 200.
- Owner: add/change/remove admin, manager, staff → 200; change owner → 409 `OWNER_IMMUTABLE`; leave → 409 `OWNER_CANNOT_LEAVE`.
- Any user: request a business they don't belong to → 403 `NOT_A_MEMBER`.

### 12.3 Manual UI acceptance checklist
- [ ] Owner adds an existing user by email as Manager → success toast → that user (after focus/refresh) sees the business with a "Manager" badge.
- [ ] Unregistered email → inline "ask them to register first".
- [ ] Duplicate email → inline "already a member".
- [ ] Admin's role dropdown in Add user shows only Manager and Staff.
- [ ] Role change and removal work and are reflected immediately; removed user is bounced to `/businesses`.
- [ ] Each role's nav/landing/buttons match §9; deep-linking a forbidden URL shows the 403 page.
- [ ] Staff cannot see Dashboard, Settings, Actions columns, billing config.
- [ ] Manager sees read-only Users & access.
- [ ] QR prefix is read-only for Admin.
- [ ] Light and dark themes both render the new page correctly; mobile layout works at 375px; keyboard navigation and focus return work in modals.
- [ ] `npm run lint --prefix client` and `npm run test --prefix client` pass; `npm run build` passes.

---

## 13. Phased work plan (implement in this order)

**Phase 1 — Data & core authorisation (backend)**
1. Migrations §6 + model updates (`BusinessMember`, `Invoice`, `index.js` association). Run `npm run db:migrate`.
2. `constants/roles.js`, `services/memberRules.js`, unit tests.
3. Update `tenantMiddleware` (`req.can`, `NOT_A_MEMBER`), add `requirePermission`/`requireAnyPermission`.
4. Apply the route map (§7.3) to products, customers, invoices, dashboard, business routes; add `authorizeBusinessUpdate`; update `invoiceController` (`created_by`, ownership, per-target-status permission); flatten `role` in `getMe`.
5. **Done when:** the §12.2 matrix passes for existing endpoints.

**Phase 2 — Member management API**
1. `memberValidator`, `memberController`, `memberRoutes`; mount in `routes/index.js` (`/members`), plus `GET /access` and `GET /roles` (put them in `businessRoutes` or a small `accessRoutes`, both behind `tenantMiddleware`; `/roles` requires `member.view`).
2. Rate limiter on `POST /members`.
3. **Done when:** all member cases in §12.2 pass.

**Phase 3 — Frontend infrastructure**
1. `membersApi`, `baseApi` (tags, 403 wrapper, refetchOnFocus), `setupListeners`.
2. `usePermissions`, `Can`, `RequirePermission`, `ForbiddenPage`, `constants/roles.js`, `RoleBadge`.
3. `AppLayout` (fetch access, clear stale business when zero businesses), `getHomePath` wiring.

**Phase 4 — Navigation & route guards**
1. `navConfig` permission metadata + filter helpers; update `TopNav`, `SecondarySidebar` (items, pill, CTA), `QuickActions`.
2. `App.jsx` guards and new `/settings/users` route; role-aware fallback redirect.

**Phase 5 — Users & access UI**
1. `UsersAccessPage`, `AddMemberModal`, `MemberRoleSelect`, `RolesPermissionsMatrix`, CSS, responsive card layout, empty/error/loading states, Leave business.

**Phase 6 — Page-level gating & cleanup**
1. Products, Customers, Invoices (list/detail/create/edit), Business settings (QR prefix read-only), role badges in business select + workspace switcher.
2. Replace hard-coded role strings (`UserSettingsModal`, `WorkspaceFacts`, `IdentityCard`).
3. Update `README.md`.

**Phase 7 — QA**
- Run §12 fully; fix gaps; confirm lint/test/build.

---

## 14. Decisions taken by default (change here if product disagrees)

| # | Decision | Where to change |
|---|---|---|
| 1 | Exactly one Owner per business; no ownership transfer in v1. | `assignableRoles` excludes `owner`. |
| 2 | Hierarchy rule: you can only manage roles/members strictly below your own rank. | `memberRules.js` |
| 3 | Staff may **issue** invoices but not mark paid or cancel. | `PERMISSIONS.staff` |
| 4 | Staff may edit **only their own drafts**; Manager+ any draft. | `invoice.edit_own/edit_any` |
| 5 | Manager can cancel invoices. | `PERMISSIONS.manager` |
| 6 | Manager can **view** the team read-only; Staff cannot. | `member.view` |
| 7 | Only the Owner can change the QR prefix. | `business.update_identity` |
| 8 | Staff land on `/invoices` (no dashboard financials). | `getHomePath` |
| 9 | Users must already be registered; no email invitations. | §1 non-goals |
| 10 | Removing a member keeps the documents they created. | `created_by` FK `SET NULL` only on **user** deletion |

> Any change to the matrix requires editing **only** `server/src/constants/roles.js` (and its snapshot test); the client picks it up automatically through `/access` and `/roles`.
