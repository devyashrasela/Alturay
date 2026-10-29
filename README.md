<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="client/public/alturay_light.png">
    <source media="(prefers-color-scheme: light)" srcset="client/public/alturay_dark.png">
    <img alt="Alturay Logo" src="client/public/alturay_dark.png" width="120" height="120">
  </picture>
</p>

<h1 align="center">Alturay</h1>

<p align="center">
  <strong>Simplify your business. Focus on growth.</strong>
</p>

<p align="center">
  A multi-tenant business management platform designed for entrepreneurs, freelancers, and small businesses to manage multiple workspaces, products, and billing operations from a single unified hub.
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#architecture--project-structure">Architecture</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#installation--local-setup">Installation</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#api-documentation">API Reference</a> •
  <a href="#database-overview">Database</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.13-764ABC?style=flat-square&logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=flat-square&logo=sequelize&logoColor=white" alt="Sequelize ORM" />
  <img src="https://img.shields.io/badge/Oxlint-1.81-orange?style=flat-square" alt="Oxlint" />
</p>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Screenshots & Visual Presentation](#screenshots--visual-presentation)
- [Technology Stack](#technology-stack)
- [Architecture & Project Structure](#architecture--project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Overview](#database-overview)
- [Security](#security)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
- [Roadmap & Known Limitations](#roadmap--known-limitations)
- [Contributing](#contributing)
- [License & Contact](#license--contact)

---

## Project Overview

Running multiple businesses or side projects traditionally requires juggling separate accounting software, logins, and spreadsheets. Small businesses often get trapped between overly complex enterprise ERP systems and fragmented point solutions.

**Alturay** solves this by providing a unified multi-tenant platform tailored for small business owners and independent operators. With Alturay, an authenticated user can create, own, or belong to multiple isolated business workspaces and switch between them instantly without re-authenticating.

Each workspace provides dedicated catalog management, automated invoice/bill sequencing, granular tax and discount computations, on-demand PDF generation, and real-time business health metrics.

---

## Key Features

The following capabilities are verified and implemented directly within the Alturay codebase:

### 🏢 Multi-Tenant Workspace Management
- **One User, Many Businesses**: An account can create and join multiple business profiles via a relational `business_members` join table.
- **Instant Workspace Switching**: Switch active business context with one click; client requests automatically inject the `X-Business-Id` header across all subsequent API queries.
- **Strict Data Isolation**: Backend `tenantMiddleware` ensures every request to a business-scoped route verifies membership permissions before querying or mutating data.
- **Independent Business Profiles**: Configure currency (`INR`, `USD`, `EUR`, etc.), tax IDs (GST/VAT), business address, contact information, and sequential numbering rules per business.

### 📄 Invoicing & Bill Creation
- **Dual Document Support**: Generate outward customer **Invoices** (receivables) or inward vendor **Bills** (payables).
- **Auto-Sequencing**: Per-business automatic sequence numbering (`INV-0001`, `BILL-0001`) executed with atomic database transactions to eliminate race conditions.
- **Multi-Line Item Builder**: Add items directly from your product catalog or create one-off custom line items with custom descriptions, quantities, and prices.
- **Flexible Tax & Discount Engine**: Apply taxes and discounts per line item (percentage or flat) as well as whole-invoice discounts (percentage or flat).
- **Status Lifecycle**: Manage document transitions across `draft`, `issued`, `paid`, and `cancelled`.

### 🖨️ PDF Invoice Generation
- **Native Vector PDF Export**: Generates and streams invoices on-the-fly directly to the client via `pdfkit`.
- **Branded Layouts**: Includes business metadata, contact details, currency-formatted line tables, tax breakdowns, discount summaries, and status stamps.

### 📦 Product & Inventory Catalog
- **Catalog Management**: Create, view, update, and manage products with SKU, unit pricing, default tax rate (e.g. 18% GST), and units of measure (`pcs`, `kg`, etc.).
- **Live Search & Pagination**: Client-side and server-side filtering with pagination support.
- **Soft Deletes**: Product records use Sequelize paranoid mode (`deleted_at`), protecting historic invoice references if a catalog item is archived.

### 📊 Business Analytics Dashboard
- **Financial Performance Overview**: Total revenue (issued + paid), outstanding unpaid receivables, and outstanding unpaid bills.
- **Activity & Volume Counters**: Instant tally of active products, invoices, and bills.
- **6-Month Revenue Trends**: Aggregated monthly revenue and volume progression for previous months.
- **Status Distribution**: Real-time breakdown of documents by status (`draft`, `issued`, `paid`, `cancelled`).
- **Top Performing Products**: Identifies top products by sales volume and revenue contribution.
- **Recent Invoices**: Quick-access list of latest documents with status badges and detail links.

### 🎨 Modern UI & Experience
- **Interactive Landing Page**: Polished marketing experience with Lenis smooth scrolling, hero presentation, and scroll-velocity responsive footer reveal transitions.
- **Theming & Personalization**: Native support for **Light**, **Dark**, and **System** themes with CSS design tokens stored in Redux and local storage.
- **Fully Responsive**: Optimized desktop and mobile views with accessible dialogs, drawers, and keyboard navigation.

---

## Screenshots & Visual Presentation

> *Note: Application screenshots can be added here once visual assets are captured from local runs or staging deployments.*

```
+---------------------------------------------------------------------------------+
|                                                                                 |
|                      [ Dashboard Analytics & Metric Cards ]                     |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                     [ Product Catalog & Invoice Generator ]                     |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

---

## Technology Stack

### Frontend
- **Framework & Runtime**: [React 19](https://react.dev/) (`19.2.8`) with [Vite 8](https://vitejs.dev/) (`8.3.0`)
- **State Management & Data Fetching**: [Redux Toolkit](https://redux-toolkit.js.org/) (`2.13.0`) + [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- **Routing**: [React Router](https://reactrouter.com/) (`7.18.4`) with lazy loading and route-level protection
- **Icons**: [Lucide React](https://lucide.dev/) (`1.55.0`)
- **Smooth Scrolling**: [Lenis](https://lenis.darkroom.engineering/) (`1.3.27`)
- **Date Picking**: [React Datepicker](https://reactdatepicker.com/) (`9.1.0`)
- **Linter**: [Oxlint](https://oxc.rs/) (`1.81.0`)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v18+ recommended)
- **Framework**: [Express 4](https://expressjs.com/) (`4.21.2`)
- **Database**: [MySQL](https://www.mysql.com/) (using `mysql2` driver `3.12.0`)
- **ORM**: [Sequelize](https://sequelize.org/) (`6.37.5`) with `sequelize-cli` (`6.6.2`)
- **PDF Generation**: [PDFKit](https://pdfkit.org/) (`0.16.0`)
- **Validation**: [Joi](https://joi.dev/) (`17.13.3`)
- **Authentication**: [JSON Web Tokens](https://jwt.io/) (`jsonwebtoken` `9.0.2`) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (`2.4.3`)
- **Security & Utilities**: [Helmet](https://helmetjs.github.io/) (`8.3.0`), [CORS](https://github.com/expressjs/cors) (`2.8.5`), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) (`7.5.0`), [Winston](https://github.com/winstonjs/winston) (`3.17.0`), [Morgan](https://github.com/expressjs/morgan) (`1.10.0`)

---

## Architecture & Project Structure

The project is structured as a client-server monorepo with clean separation of concerns:

```
Alturay/
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Static assets (brand logos, favicons, fonts)
│   │   ├── alturay_dark.png    # Official dark mark (light backgrounds)
│   │   └── alturay_light.png   # Official light mark (dark backgrounds)
│   ├── src/
│   │   ├── components/         # Reusable presentation and layout components
│   │   │   ├── auth/           # Login & Registration layout shells
│   │   │   ├── landing/        # Marketing sections (Navbar, Hero, Features, FAQ, Footer)
│   │   │   ├── layout/         # Application shell (Sidebar, Header, AppLayout)
│   │   │   ├── settings/       # User & workspace settings wrappers
│   │   │   └── ui/             # Buttons, Inputs, Modals, Loaders, StatCards
│   │   ├── pages/              # Routed view containers
│   │   │   ├── Auth/           # LoginPage, RegisterPage
│   │   │   ├── Businesses/     # BusinessSelectPage (workspace picker & creation)
│   │   │   ├── Dashboard/      # Analytics overview & quick stats
│   │   │   ├── Invoices/       # InvoicesPage, CreateInvoicePage, InvoiceDetailPage
│   │   │   ├── Landing/        # LandingPage & scroll sequence orchestration
│   │   │   ├── Products/       # ProductsPage (catalog management)
│   │   │   └── Settings/       # BusinessSettingsPage, PersonalizationPage
│   │   ├── routes/             # ProtectedRoute guards (auth & business checks)
│   │   ├── store/              # Redux Toolkit store, RTK Query API, and slices
│   │   └── utils/              # Calculation helpers, formatting, unit tests
│   ├── package.json
│   └── vite.config.js          # Dev server & /api proxy to backend (port 8001)
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # Environment, database, and JWT configurations
│   │   ├── controllers/        # Request orchestration (auth, business, invoice, etc.)
│   │   ├── middlewares/        # JWT auth, tenant isolation, validation, errorHandler
│   │   ├── models/             # Sequelize schemas (User, Business, Member, Invoice, Product)
│   │   ├── routes/             # Express route declarations mounted under /api
│   │   ├── services/           # Invoice calculations and vector PDF generation
│   │   ├── utils/              # Winston structured logger
│   │   └── validators/         # Joi input validation schemas
│   ├── server.js               # Entrypoint & Sequelize database synchronization
│   └── package.json
│
├── package.json                # Root scripts (concurrent dev runner & install)
└── README.md
```

---

## Prerequisites

Before setting up Alturay locally, ensure you have:

- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **Package Manager**: `npm` (v9+)
- **Database**: [MySQL](https://dev.mysql.com/downloads/) (v8.0+ or compatible MariaDB instance) running locally or in Docker

---

## Installation & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/devyashrasela/Alturay.git
cd Alturay
```

### 2. Install Dependencies

You can install dependencies for the root, server, and client in one step using the root script:

```bash
npm run install:all
```

*(Alternatively, run `npm install` inside the root, `server/`, and `client/` directories individually).*

### 3. Configure MySQL Database

Ensure your MySQL service is running and create a database for development:

```sql
CREATE DATABASE alturay_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configure Environment Variables

Create `.env` files in both the `server/` and `client/` directories from their respective examples:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

Review the values in `server/.env` to ensure your database credentials match your local MySQL configuration. See [Environment Variables](#environment-variables) below for details.

### 5. Run the Application

You can start both backend and frontend concurrently from the repository root:

```bash
npm run dev
```

Or run them in separate terminal sessions:

```bash
# Terminal 1 — Backend (starts on http://localhost:8001)
npm run dev:server

# Terminal 2 — Frontend (starts on http://localhost:5173)
npm run dev:client
```

> **Database Synchronization**: In development (`NODE_ENV=development`), the backend runs `sequelize.sync({ alter: true })` on boot to automatically inspect and synchronize tables to match the Sequelize models.

Open your browser at **[http://localhost:5173](http://localhost:5173)** to explore Alturay.

---

## Environment Variables

### Backend Configuration (`server/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`). |
| `PORT` | No | `8001` | Port on which the Express server listens. |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed origin for CORS headers. |
| `DB_HOST` | **Yes** | — | Host address of the MySQL instance (e.g. `localhost` or `127.0.0.1`). |
| `DB_PORT` | No | `3306` | MySQL server port. |
| `DB_NAME` | **Yes** | — | Database name (e.g. `alturay_dev`). |
| `DB_USER` | **Yes** | — | Database username. |
| `DB_PASSWORD`| No | *(empty)* | Database password. |
| `JWT_SECRET` | **Yes** | — | Cryptographic secret key used to sign and verify JSON Web Tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration (e.g., `7d`, `24h`). |
| `LOG_LEVEL` | No | `info` | Winston logging verbosity (`debug`, `info`, `warn`, `error`). |

### Frontend Configuration (`client/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | No | `/api` | Base URL for API requests. In local development, the default `/api` uses Vite's proxy to forward requests to `http://localhost:8001`. |

---

## API Documentation

All API routes are prefixed under `/api`. Public endpoints require no authorization, while protected endpoints require a standard `Bearer <token>` HTTP header. Multi-tenant routes additionally require the `X-Business-Id` header (or `:businessId` route parameter).

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | None | Register a new user account (`name`, `email`, `password`). |
| `POST` | `/api/auth/login` | None | Authenticate with email/password; returns JWT and user profile. |
| `GET` | `/api/auth/me` | Bearer | Fetch profile of the currently authenticated user. |

### Businesses & Workspaces (`/api/businesses`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/businesses` | Bearer | List all businesses accessible by the current user. |
| `POST` | `/api/businesses` | Bearer | Create a new business and register user as `owner`. |
| `GET` | `/api/businesses/:businessId` | Tenant | Retrieve detailed profile for a specific business. |
| `PUT` | `/api/businesses/:businessId` | Tenant | Update business details (name, email, phone, tax ID, currency, address). |

### Products Catalog (`/api/businesses/:businessId/products`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/businesses/:businessId/products` | Tenant | List paginated products with optional search query. |
| `POST` | `/api/businesses/:businessId/products` | Tenant | Create a new catalog item. |
| `GET` | `/api/businesses/:businessId/products/:productId` | Tenant | Get product details by ID. |
| `PUT` | `/api/businesses/:businessId/products/:productId` | Tenant | Update an existing product. |
| `DELETE`| `/api/businesses/:businessId/products/:productId` | Tenant | Soft-delete a product (`paranoid` mode). |

### Invoices & Billing (`/api/businesses/:businessId/invoices`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/businesses/:businessId/invoices` | Tenant | List invoices/bills with status, type, and search filters. |
| `POST` | `/api/businesses/:businessId/invoices` | Tenant | Create invoice or bill with calculated line items. |
| `GET` | `/api/businesses/:businessId/invoices/:invoiceId` | Tenant | Fetch complete invoice details with nested items. |
| `PUT` | `/api/businesses/:businessId/invoices/:invoiceId` | Tenant | Update editable draft invoice details and line items. |
| `PATCH`| `/api/businesses/:businessId/invoices/:invoiceId/status` | Tenant | Update status (`draft`, `issued`, `paid`, `cancelled`). |
| `GET` | `/api/businesses/:businessId/invoices/:invoiceId/pdf` | Tenant | Stream generated PDF document for viewing or download. |

### Dashboard Analytics (`/api/businesses/:businessId/dashboard`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/businesses/:businessId/dashboard/stats` | Tenant | Retrieve aggregated revenue, trends, and product stats. |
| `GET` | `/api/businesses/:businessId/dashboard/recent` | Tenant | Get the most recent invoices and activities. |

---

## Database Overview

Alturay uses a relational data model with strict foreign-key relationships and tenant scoping:

```
  +-------------+              +--------------------+              +----------------+
  |    User     | 1          * |   BusinessMember   | *          1 |    Business    |
  |-------------|--------------|--------------------|--------------|----------------|
  | id          |              | id                 |              | id             |
  | name        |              | user_id (FK)       |              | name           |
  | email       |              | business_id (FK)   |              | currency       |
  | password    |              | role (owner/admin) |              | tax_id         |
  +-------------+              +--------------------+              +----------------+
                                                                     | 1          | 1
                                                                     |            |
                                                                     | *          | *
                                                           +---------------+  +--------------+
                                                           |    Product    |  |   Invoice    |
                                                           |---------------|  |--------------|
                                                           | id            |  | id           |
                                                           | business_id   |  | business_id  |
                                                           | name, sku     |  | type         |
                                                           | unit_price    |  | status       |
                                                           | tax_rate      |  | total_amount |
                                                           +---------------+  +--------------+
                                                                   | 0..1            | 1
                                                                   |                 |
                                                                   | *               | *
                                                              +-------------------------+
                                                              |       InvoiceItem       |
                                                              |-------------------------|
                                                              | id                      |
                                                              | invoice_id (FK)         |
                                                              | product_id (FK, nullable)
                                                              | quantity, unit_price    |
                                                              | tax_amount, line_total  |
                                                              +-------------------------+
```

### Data Isolation Guarantees
- Every business-scoped resource (`Product`, `Invoice`) stores a direct `business_id` reference.
- `tenantMiddleware` matches `user_id` and `business_id` in `BusinessMember` before resolving requests.
- All database queries and updates are explicitly scoped to `where: { business_id: req.businessId }`, eliminating cross-tenant leakage.

---

## Security

- **Authentication**: Stateless authentication using cryptographically signed JSON Web Tokens (JWT).
- **Password Protection**: Passwords hashed with `bcryptjs` using 10 salt rounds before persistence; password hashes are excluded from API responses.
- **Rate Limiting**: Authentication endpoints are rate-limited via `express-rate-limit` (max 30 requests per 15-minute window) to mitigate brute-force attacks.
- **HTTP Security Headers**: Powered by [Helmet](https://helmetjs.github.io/) to enforce safe defaults (`X-DNS-Prefetch-Control`, `X-Frame-Options`, `X-Content-Type-Options`, etc.).
- **Strict CORS**: Cross-Origin Resource Sharing is locked to the configured client origin with credentials permitted.
- **Request Validation**: Incoming payloads are validated against strict [Joi](https://joi.dev/) schemas before reaching controllers, preventing injection of malicious or malformed parameters.

---

## Development & Testing

### Running Tests

The frontend includes unit test coverage for authentication mapping and error handling using Node.js's native test runner:

```bash
npm run test --prefix client
```

### Code Quality & Linting

Oxlint is configured for the frontend to maintain fast static analysis:

```bash
npm run lint --prefix client
```

### Building for Production

Compile and bundle the frontend for production:

```bash
npm run build
```

The resulting distribution files are output to `client/dist/`.

---

## Deployment

Alturay is architected to be deployed in a decoupled environment:

- **Frontend**: Can be deployed to static hosting providers such as [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/). Set the build command to `npm run build` and output directory to `dist`. Configure the environment variable `VITE_API_URL` pointing to your production backend.
- **Backend**: Can be deployed to container or Node.js hosting platforms such as [Render](https://render.com/), [Fly.io](https://fly.io/), or [AWS](https://aws.amazon.com/). Ensure `CLIENT_URL` matches your frontend production domain and that MySQL database credentials are configured in your production environment variables.

---

## Roadmap & Known Limitations

The following items represent architectural plans and areas for future expansion:

- [ ] **Dedicated Customer CRM**: Currently, customer details are captured per invoice; a dedicated customer entity with balances and purchase history is planned.
- [ ] **Team & Member Invitations**: The backend supports `owner`, `admin`, and `member` roles; an invite-by-email UI is planned.
- [ ] **Payment Gateway Integration**: Direct payment collection via Stripe or Razorpay links on issued invoices.
- [ ] **Automated Recurring Invoices**: Scheduled billing intervals for subscription-based businesses.
- [ ] **Multi-Currency Conversion**: Live exchange rate updates when managing entities across differing currencies.

---

## Contributing

Contributions are welcome. To contribute:

1. **Fork the repository** on GitHub.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "Add feature description"
   ```
4. **Run existing tests and linters** to verify code quality:
   ```bash
   npm run lint --prefix client
   npm run test --prefix client
   ```
5. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** with a description of the changes.

---

## License & Contact

- **License**: This project is currently private and proprietary. All rights reserved.
- **Author & Maintainer**: Devyash Rasela ([@devyashrasela](https://github.com/devyashrasela))
- **Repository**: [https://github.com/devyashrasela/Alturay](https://github.com/devyashrasela/Alturay)
