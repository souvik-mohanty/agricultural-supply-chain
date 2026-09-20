<p align="center">
  <img src="docs/assets/agrolink-logo.png" alt="AgroLink" width="420" />
</p>

# AgroLink

An agricultural B2B marketplace: farmers list produce, buyers browse, request quotes (RFQ), order and pay, advisors answer
farmers' questions, warehouse operators track stored crops, and admins moderate the platform.

The backend is a single Spring Boot application (a modular monolith). The frontend is a React + Vite app.

```
AgroLink/
├── backend/    Spring Boot 3.5, Java 21, MongoDB
│   └── src/main/java/com/agrolink/
│       ├── AgroLinkApplication.java
│       ├── common/         error model + global exception handler, CORS, Mongo auditing, maintenance mode
│       ├── security/       JWT filter, principal, the one security filter chain
│       ├── user/           registration, login, profiles
│       ├── product/        catalogue, photos, stock reservation
│       ├── cart/           per-user cart
│       ├── order/          orders, Razorpay payments, orders for a seller's products
│       ├── rfq/            request-for-quote workflow (quote, accept, reject, order at the quoted price)
│       ├── warehouse/      crop storage tracking
│       ├── advisory/       advisory articles, farmer questions
│       ├── notification/   in-app inbox, email / SMS / push
│       └── admin/          user moderation, complaints, PDF/Excel reports
└── frontend/   React 19 + Vite (React Router, TanStack Query, React Hook Form + Zod)
    └── src/
        ├── auth/         session (AuthProvider), roles, protected routes
        ├── navigation/   which links each role sees
        ├── service/      one small module per backend area + the axios client
        ├── hooks/, lib/  data hooks, error messages, formatting, marketplace filtering
        ├── components/   navbar, shared UI (states, forms, tables, dialogs), "waking up the server" page
        └── pages/        dashboards (one per role), marketplace, RFQs, orders, admin, warehouse, advisory, ...
```

Each feature package owns its model, repository, service and controller. Packages talk to each other by calling
services directly (for example `cart` calls `ProductService`), not over HTTP.

## Running it

**Prerequisites:** Java 21, Maven (or the bundled `./mvnw`), Node 20+, a MongoDB instance.

```bash
# 1. backend  (http://localhost:8080)
cd backend
export MONGODB_URI=mongodb://localhost:27017/agrolink   # default; use your Atlas URI if you have one
./mvnw spring-boot:run      # or `mvn spring-boot:run` if Maven is installed

# 2. frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

No MongoDB handy? `docker run -d -p 27017:27017 mongo:7`.

### Configuration

All settings live in [`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml) and can be
overridden with environment variables. The old Config Server and its remote Git repository are no longer used, so
anything that lived only there (database URI, mail credentials, ...) must now be supplied this way.

| Variable | Purpose | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/agrolink` |
| `PORT` | HTTP port | `8080` |
| `JWT_SECRET` | HMAC signing key, at least 32 bytes. **Set this in production.** | insecure dev value |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Creates this ADMIN account on startup if it does not exist. Public sign-up cannot create admins, so this is how you get the first one. | unset |
| `RAZORPAY_KEY`, `RAZORPAY_SECRET` | Payments. Without them the app runs and payment endpoints answer 503. | unset |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_HOST`, `MAIL_PORT` | SMTP for email notifications (Gmail needs an app password) | Gmail host, no credentials |
| `DEMO_LOGIN_ENABLED` | `true` shows "Login as Admin / Farmer / ..." buttons on the login page that sign in **without a password** (accounts `demo-<role>`). Anyone can become any role, ADMIN included, so use it on your machine only. The VS Code "Backend: run" task turns it on. | `false` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API from a browser | `http://localhost:5173` |

**Maintenance mode:** run with `SPRING_PROFILES_ACTIVE=maintenance` to answer 503 to everything except
`/actuator/health`, or set `app.maintenance.blocked-paths` / `app.maintenance.blocked-origin` to block only part of the traffic.

### Deploying

Frontend on Vercel, backend on Render, database on MongoDB Atlas: see [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step
plan and every environment variable. [`render.yaml`](render.yaml) and [`frontend/vercel.json`](frontend/vercel.json) hold the platform settings.

### Docs

- [DEPLOYMENT.md](DEPLOYMENT.md): Vercel + Render + Atlas plan and env vars
- [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md): page inventory, frontend-to-backend mapping, missing APIs

### Tests

```bash
cd backend && ./mvnw test
```

Unit tests cover the business rules (cart, orders and payment verification, stock reservation, RFQ workflow, inbox,
user updates, JWT). `SecurityIntegrationTest` and `RfqIntegrationTest` boot the whole application with in-memory
repositories to check authentication, role rules, JSON dates and error responses; no database is needed.

```bash
cd frontend && npm test     # marketplace filtering, error messages, formatting, navigation rules, server wake-up logic
```

## API overview

Everything is under `/api`. Send the token from `POST /api/auth/login` as `Authorization: Bearer <token>`.
Errors are always JSON: `{ timestamp, status, error, message, path }`.

| Area | Endpoints | Who |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` | public (registration cannot choose ADMIN or MANAGER) |
| | `GET /auth/demo-login`, `POST /auth/demo-login/{role}` | public, but a no-op (empty list / 404) unless `DEMO_LOGIN_ENABLED=true` |
| | `POST /auth/registers` (bulk create) | ADMIN |
| Users | `GET /users/me`; `GET / PUT / DELETE /users/{id}` | the user themself, or ADMIN. Only ADMIN can change roles |
| Products | `GET /products[?category=]`, `GET /products/{id}`, `GET /products/photo/{id}` | public |
| | `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` (multipart) | FARMER (own products) or ADMIN |
| Cart | `GET /cart`, `POST /cart/add?productId&quantity`, `DELETE /cart/remove?productId[&quantity]` | logged in; the cart is the caller's |
| Orders | `POST /orders` `{items:[{productId,quantity}]}`, `POST /orders/checkout` (whole cart) | logged in |
| | `POST /orders/{id}/verify`, `POST /orders/{id}/cancel`, `GET /orders`, `GET /orders/{id}` | order owner or ADMIN |
| | `GET /orders/seller` (orders containing my products, only my lines, no buyer id) | FARMER, ADMIN |
| Quote requests | `POST /rfqs` `{productId,quantity,unit,targetPricePerUnit,deliveryLocation,requiredDeliveryDate,requirements,deadline}` | BUYER, CUSTOMER, ADMIN |
| | `GET /rfqs` (mine as buyer or seller; admins see all), `GET /rfqs/{id}` | the buyer, the seller, or ADMIN |
| | `POST /rfqs/{id}/quote` `{pricePerUnit,quantity,deliveryDate,notes}` | FARMER who owns the product |
| | `POST /rfqs/{id}/accept`, `/reject`, `/cancel`, `POST /rfqs/{id}/order` | the buyer |
| Warehouse | `POST /warehouse/store`, `GET /warehouse/location/{l}`, `PUT /warehouse/mark-ready/{id}`, `GET /warehouse/ready` | WAREHOUSE_OPERATOR, MANAGER, ADMIN |
| Advisory | `GET /advisory/all` | public |
| | `POST /advisory/post` | ADVISOR, ADMIN |
| Queries | `POST /query/submit`, `GET /query/mine` | logged in |
| | `POST /query/respond/{id}`, `GET /query/all` | ADVISOR, ADMIN |
| Notifications | `POST /notifications/send` | ADMIN, MANAGER |
| | `GET /notifications/me`, `GET /notifications/me/unread-count`, `POST /notifications/{id}/read`, `POST /notifications/read-all` | logged in (own inbox) |
| Complaints | `POST /complaints` | logged in |
| Admin | `GET /admin/users`, `POST /admin/suspend/{id}`, `POST /admin/unsuspend/{id}`, `PUT /admin/users/{id}/role`, `GET /admin/complaints`, `POST /admin/complaints/{id}/resolve`, `GET /admin/report/pdf`, `GET /admin/report/excel` | ADMIN |

### How an order works

1. `POST /orders` (or `/orders/checkout`) prices the items from the catalogue, **reserves the stock atomically**, creates
   a Razorpay order and returns what Razorpay Checkout needs. The client never sends a price or buyer id.
2. After paying, the browser calls `POST /orders/{id}/verify` with Razorpay's payment id and signature. The signature
   is checked with HMAC-SHA256; on success the order becomes `PAID`, those products leave the cart and the buyer is emailed.
3. Unpaid orders are cancelled and their stock released after 30 minutes (`app.orders.pending-expiry-minutes`), or
   immediately via `POST /orders/{id}/cancel`.

### How a quote request (RFQ) works

1. A buyer opens a product and sends a request: quantity, delivery location, deadline, optional target price.
   It is addressed to the seller who owns that product, who is notified in the inbox.
2. The seller answers with a quote (price per unit, quantity, delivery date) and can replace it until the buyer answers.
3. The buyer accepts or rejects it, or cancels the request. Requests past their deadline become `EXPIRED`.
4. After accepting, the buyer creates the order: it is priced **from the quote**, not the catalogue, and goes through the
   same stock reservation and Razorpay payment as any other order. Statuses: `OPEN, QUOTED, ACCEPTED, REJECTED, CANCELLED, EXPIRED`.

## What changed from the microservice version

The eleven Maven modules (gateway, service registry, config server, user, product, cart, order, warehouse, advisory,
notification, admin) and the `frontendRunner` helper became one deployable. Gone with them: Eureka, Spring Cloud
Config, API gateway routing, Feign clients, circuit breakers and per-service ports. One process, one port, one database.

Things that behave differently on purpose:

- **Orders moved from PostgreSQL to MongoDB**, so the whole application needs a single database. Existing rows in the old
  `orders` table are not migrated (the order module was never finished: nothing could read an order back).
- **Admin works on the real users.** The old admin service kept its own `User` collection that nothing wrote to. Suspension
  is now a `suspended` flag on the user (a suspended user cannot log in, and their token stops working at once).
- **Ids come from the token, not the request.** Cart, orders, product ownership, queries and complaints use the
  logged-in user, so nobody can act on someone else's behalf by changing a `userId` parameter.
- **Security fixes found while merging:** anyone could register as ADMIN or promote themselves through the profile
  update; the "self or admin" check compared a username to a database id, so regular users could not edit themselves;
  the JWT filter was registered twice (once outside the security chain); the 401 handler could not serialize its own
  timestamp. All fixed and covered by tests.
- **Removed:** `hello` health-ping endpoints, the unused `Listing` and `Report` models, the orphan `Order` enums and
  Feign stubs, `GET /users/{id}/exists` (it only existed for the cart service).
- **API paths:** everything is under `/api` on one port. The frontend calls `/api/...` (proxied by Vite in development).

## Not done yet

- **Logistics / shipment tracking** and **analytics endpoints** do not exist (the `CARRIER` role has nothing to do yet).
  Dashboards show real counts computed from existing data, not analytics.
- Order statuses are only `PENDING`, `PAID` and `CANCELLED`; there is no dispatch or delivery tracking.
- Products have no unit, minimum order, location or active/inactive flag, and a buyer cannot see a seller's name on a product.
- SMS and push notifications are mocked (they log instead of calling a provider); email needs a paid Render plan.
- No forgot-password flow (the login page links to it, but neither a route nor an endpoint exists).
- `Aadhar` numbers are stored and returned in plain text.
