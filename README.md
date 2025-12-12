# Subscription Manager

[![Vercel Deploy Status](https://img.shields.io/github/deployments/JamesD9406/subscription-manager/production?label=vercel&logo=vercel)](https://subscription-manager-seven-red.vercel.app/)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss)

A full-stack subscription billing management system built with Next.js 16, Prisma, and PostgreSQL. This application demonstrates backend expertise, database design, and complex business logic for SaaS billing operations.

**Live Demo:** [https://subscription-manager-seven-red.vercel.app](https://subscription-manager-seven-red.vercel.app)

---

## Features

- **Full CRUD Operations** for all entities (Customers, Plans, Subscriptions, Invoices)
- **21 RESTful API Endpoints** with comprehensive validation
- **Admin Dashboard UI** with responsive design
- **Complex Business Logic** (subscription cancellation, invoice payment, plan management)
- **Database Relationships** with Prisma ORM
- **Form Validation** using Zod schemas
- **Serverless Deployment** on Vercel with Supabase PostgreSQL

---

## Screen Shots

### 🟦 Plans List: 
<p>Illustrates CRUD actions and navigation.</p>
<div style="display: flex; gap: 12px; margin-bottom: 20px;">
  <img src="public/screenshots/plans-list.png" width="100%" alt="List of available plans"/>
</div>


### 🟦 Create Invoice: 
<p>Illustrates creation process, form validation, and automaticv calculations.</p>
<div style="display: flex; gap: 12px; margin-bottom: 20px;">
  <img src="public/screenshots/create-invoice.png" width="100%" alt="List of available plans"/>
</div>


### 🟦 View Subscriptions: 
<p>Illustrates relationships. Associated Customer and Plan are clickable links, and associated recent invoice shows below.</p>
<div style="display: flex; gap: 12px; margin-bottom: 20px;">
  <img src="public/screenshots/view-subscriptions.png" width="100%" alt="List of available plans"/>
</div>


---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 6
- **Validation:** Zod 4
- **Styling:** Tailwind CSS 4
- **Deployment:** Vercel
- **Language:** TypeScript 5

---

## Database Schema

The application manages four core entities:

### **Customer**
- `id`, `name`, `email` (unique), `status`, `createdAt`, `updatedAt`
- Status: `ACTIVE`, `TRIALING`, `CANCELLED`
- Relations: Has many subscriptions and invoices

### **Plan**
- `id`, `name` (unique), `description`, `price` (cents), `billingInterval`, `trialPeriodDays`, `isActive`, `createdAt`, `updatedAt`
- Billing Interval: `MONTHLY`, `YEARLY`
- Relations: Has many subscriptions

### **Subscription**
- `id`, `customerId`, `planId`, `status`, `startDate`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `canceledAt`, `createdAt`, `updatedAt`
- Status: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`
- Relations: Belongs to customer and plan, has many invoices

### **Invoice**
- `id`, `subscriptionId`, `customerId`, `amount` (cents), `dueDate`, `paidAt`, `status`, `lineItems` (JSON), `createdAt`, `updatedAt`
- Status: `DRAFT`, `OPEN`, `PAID`, `FAILED`
- Relations: Belongs to subscription and customer

---

## API Endpoints

### **Customers** (`/api/customers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers` | List all customers with subscription/invoice counts |
| `POST` | `/api/customers` | Create a new customer |
| `GET` | `/api/customers/[id]` | Get single customer with relations |
| `PATCH` | `/api/customers/[id]` | Update customer details |
| `DELETE` | `/api/customers/[id]` | Delete customer (cascades to subscriptions/invoices) |

**Example Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "status": "ACTIVE",
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-01-10T12:00:00Z",
  "_count": {
    "subscriptions": 2,
    "invoices": 5
  }
}
```

---

### **Plans** (`/api/plans`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/plans` | List all plans with subscription counts |
| `POST` | `/api/plans` | Create a new plan |
| `GET` | `/api/plans/[id]` | Get single plan with subscriptions |
| `PATCH` | `/api/plans/[id]` | Update plan details |
| `DELETE` | `/api/plans/[id]` | Delete plan (prevents if active subscriptions exist) |

**Example Response:**
```json
{
  "id": 1,
  "name": "Starter",
  "description": "Perfect for individuals",
  "price": 999,
  "billingInterval": "MONTHLY",
  "trialPeriodDays": 14,
  "isActive": true,
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-01-10T12:00:00Z",
  "_count": {
    "subscriptions": 12
  }
}
```

---

### **Subscriptions** (`/api/subscriptions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subscriptions` | List all subscriptions with customer/plan details |
| `POST` | `/api/subscriptions` | Create a new subscription |
| `GET` | `/api/subscriptions/[id]` | Get single subscription with full details |
| `PATCH` | `/api/subscriptions/[id]` | Update subscription |
| `DELETE` | `/api/subscriptions/[id]` | Cancel subscription (supports `?cancelAtPeriodEnd=true`) |

**Cancellation Modes:**
- **Immediate:** `DELETE /api/subscriptions/[id]` - Sets status to `CANCELLED`, adds `canceledAt` timestamp
- **At Period End:** `DELETE /api/subscriptions/[id]?cancelAtPeriodEnd=true` - Sets `cancelAtPeriodEnd` flag, keeps status `ACTIVE`

**Example Response:**
```json
{
  "id": 1,
  "customerId": 1,
  "planId": 2,
  "status": "ACTIVE",
  "startDate": "2025-01-01T00:00:00Z",
  "currentPeriodStart": "2025-01-01T00:00:00Z",
  "currentPeriodEnd": "2025-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "customer": { "name": "John Doe", "email": "john@example.com" },
  "plan": { "name": "Pro", "price": 9999 }
}
```

---

### **Invoices** (`/api/invoices`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/invoices` | List all invoices with customer/subscription details |
| `POST` | `/api/invoices` | Create a new invoice |
| `GET` | `/api/invoices/[id]` | Get single invoice with full relations |
| `PATCH` | `/api/invoices/[id]` | Update invoice details |
| `DELETE` | `/api/invoices/[id]` | Delete invoice (prevents deletion of paid invoices) |
| `POST` | `/api/invoices/[id]/pay` | Mark invoice as paid (simulated payment) |

**Invoice Validation Rules:**
- Invoice `amount` must equal sum of line items
- Line item `total` must equal `quantity × unitPrice`
- Paid invoices require `paidAt` date (cannot be in future)
- Cannot delete invoices with `status: PAID`

**Example Response:**
```json
{
  "id": 1,
  "subscriptionId": 1,
  "customerId": 1,
  "amount": 9999,
  "dueDate": "2025-02-01T00:00:00Z",
  "paidAt": "2025-01-28T14:30:00Z",
  "status": "PAID",
  "lineItems": [
    {
      "description": "Pro Plan - Monthly",
      "quantity": 1,
      "unitPrice": 9999,
      "total": 9999
    }
  ],
  "customer": { "name": "John Doe", "email": "john@example.com" },
  "subscription": { "status": "ACTIVE" }
}
```

---

## Admin Dashboard

The application includes a full admin UI for managing all entities:

- **Plans:** `/plans` - View, create, edit, delete subscription plans
- **Customers:** `/customers` - Manage customer accounts
- **Subscriptions:** `/subscriptions` - Track and manage active subscriptions
- **Invoices:** `/invoices` - Generate and manage billing invoices

**UI Features:**
- Responsive tables with horizontal scroll on mobile
- Form validation with Zod (HTML5 validation disabled for consistency)
- Auto-populating conditional fields (`paidAt`, `canceledAt`)
- Loading states and error handling
- Delete confirmation dialogs
- Business rule enforcement (e.g., can't delete paid invoices)

---

## Local Development

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL database (local or Supabase)

### **Setup**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JamesD9406/subscription-manager.git
   cd subscription-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database credentials:
   ```env
   # For local development (direct connection)
   DATABASE_URL="postgresql://user:password@localhost:5432/subscriptions"

   # For production (Supabase with connection pooling)
   # DATABASE_URL="postgresql://postgres.PROJECT:[PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
   # DIRECT_URL="postgresql://postgres:[PASSWORD]@db.PROJECT.supabase.co:5432/postgres"
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000/plans](http://localhost:3000/plans)

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:seed      # Seed database with test data
npm run db:reset     # Reset database and re-seed
npm run post-deploy  # Run migrations (for deployment)
```

---

## Deployment

This application is deployed on Vercel with Supabase PostgreSQL.

### **Deploy Your Own**

1. **Fork this repository**

2. **Set up Supabase database:**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your connection string from Settings → Database
   - Use the **Connection Pooling** URL for `DATABASE_URL` (port 6543)
   - Use the **Direct Connection** URL for `DIRECT_URL` (port 5432)

3. **Deploy to Vercel:**
   - Import your repository to Vercel
   - Add environment variables:
     - `DATABASE_URL` (pooler connection)
     - `DIRECT_URL` (direct connection)
   - Deploy!

4. **Run migrations:**
   ```bash
   npm run post-deploy
   ```

---

## Project Structure

```
subscription-manager/
├── app/
│   ├── api/                      # API Routes (21 endpoints)
│   │   ├── customers/
│   │   ├── plans/
│   │   ├── subscriptions/
│   │   └── invoices/
│   │
│   └── (dashboard)/              # Admin UI Pages
│       ├── customers/
│       ├── plans/
│       ├── subscriptions/
│       └── invoices/
│
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── prisma-errors.ts          # Error handling utilities
│   ├── types.ts                  # TypeScript definitions
│   └── validators/               # Zod validation schemas
│       ├── customer.ts
│       ├── plan.ts
│       ├── subscription.ts
│       └── invoice.ts
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migrations
│
└── components/
    └── confirm-dialog.tsx        # Reusable confirmation dialog
```

---

## Key Design Patterns

### **Error Handling**
Custom Prisma error handling with type guards:
```typescript
if (isPrismaError(error) && error.code === PrismaError.UniqueConstraintViolation) {
  return NextResponse.json(
    { error: 'A plan with this name already exists' },
    { status: 409 }
  );
}
```

### **API Response Patterns**
- **List endpoints:** Include counts and related data summaries
- **Single endpoints:** Include full relational data
- **Create/Update:** Return created/updated entity with relations
- **Delete:** Check business rules before deletion

### **Subscription Cancellation**
- **Immediate:** Sets `status: CANCELLED`, adds `canceledAt` timestamp
- **At period end:** Sets `cancelAtPeriodEnd: true`, keeps `status: ACTIVE`

---

## Business Rules Enforced

- **Plans:** Cannot delete if active subscriptions exist
- **Invoices:**
  - Cannot delete invoices with `status: PAID`
  - Invoice amount must equal sum of line items
  - Paid invoices require `paidAt` date (not in future)
- **Subscriptions:**
  - Supports immediate and end-of-period cancellation
  - Auto-populates `canceledAt` when status changes to `CANCELLED`

---

## Future Enhancements

- [ ] Stripe payment integration
- [ ] Automated billing with scheduled jobs
- [ ] MRR (Monthly Recurring Revenue) analytics dashboard
- [ ] Email notifications for invoices
- [ ] Customer portal with authentication
- [ ] Pagination, filtering, and search
- [ ] Unit and integration tests
- [ ] API documentation with Swagger/OpenAPI

---

## License

MIT

---

## Author

**James Dunford**
Portfolio Project - Demonstrating full-stack SaaS billing expertise

- GitHub: [@JamesD9406](https://github.com/JamesD9406)
- Live Demo: [https://subscription-manager-seven-red.vercel.app](https://subscription-manager-seven-red.vercel.app)


[def]: public/screenshots/plans-list.pn