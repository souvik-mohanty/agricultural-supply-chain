# Frontend / backend integration: inspection, mapping and gaps

> **Status:** sections 1 to 6 are the original inspection (kept for the record). Section 7 says what was built afterwards.

Result of inspecting the existing frontend (`frontend/`) and the Spring Boot monolith (`backend/`) before changing
anything. Everything here was read from the code, not assumed. Nothing in this document requires a new backend.

## 1. What exists

### Frontend
| Area | Found |
|---|---|
| Framework / build | React 19, Vite 7, JavaScript (no TypeScript) |
| Routing | react-router-dom 7, routes in `src/routes/app.routes.jsx`, one `PrivateRoute` (token present or not) |
| Styling | Plain CSS file per page/component, dark green/black look. **No** Tailwind, shadcn, design tokens |
| State | Component state only. No global store, no data-fetching library |
| API layer | `src/service/apiClient.js` (axios, `VITE_API_BASE_URL`, bearer token), plus `authApi`, `userApi`, `productApi`, `cartApi`, `orderApi`, `checkout.js` |
| Forms | Hand-written controlled inputs, no validation library |
| Icons | react-icons |
| Themes | **Two competing systems**: `ThemeContext` (`darkMode`, unused) and the Navbar's own `theme` in `localStorage` |
| New in this session | `BackendGate` "waking up the server" page for free-tier cold starts |

### Backend (already complete for the flows below; MongoDB only)
Roles: `ADMIN, MANAGER, CUSTOMER, FARMER, BUYER, CARRIER, WAREHOUSE_OPERATOR, ADVISOR` (not just Farmer/Buyer/Admin).
Order statuses: `PENDING, PAID, CANCELLED`. JWT bearer auth, `GET /users/me` returns the profile including the role.
Errors are always `{ timestamp, status, error, message, path }`.

## 2. Page inventory

| Page / route | State | Notes |
|---|---|---|
| `/` Landing | Existing, **makes unsupported claims** | "AI-powered soil analysis", "real-time weather", "smart recommendations" have no backend at all |
| `/login` | Working | Real API; now also has demo-role buttons when the backend enables them |
| `/register` | Working | Fixed this session (was broken); staff roles hidden |
| `/update-profile` | Working, **not route-protected** | Real API |
| `/profile` | Working | Real API |
| `/home` (post-login) | **Placeholder** | Shows a "COMING SOON" countdown to an invalid date (`2025-09-31`). Every user lands here after login, so there is no dashboard of any kind |
| `Home.jsx` | Dead code | Imported in the routes file, never routed ("Website Under Development") |
| `/products` | Working, incomplete | Real API; client-side name search only; no category/price/availability filter, sort, pagination |
| `/products/:id` | Working, incomplete | Real fields only. Buy Now and Add to Cart work; no seller, unit, description, min order |
| `/cart` | Working, **not route-protected** | Real API |
| Product management (add/edit/delete) | **Missing** | Backend supports it (FARMER, ADMIN); no UI exists |
| My Orders / Order details | **Missing** | Backend supports list, get, cancel, verify |
| Payments history | **Missing** | No payments API; can only be derived from PAID orders |
| Dashboards (farmer / buyer / admin) | **Missing** | |
| Admin: users, complaints, reports | **Missing** | Backend supports all three |
| Warehouse | **Missing** | Backend supports it (WAREHOUSE_OPERATOR, MANAGER, ADMIN) |
| Advisory articles and farmer queries | **Missing** | Backend supports it |
| Notifications inbox | **Missing** | Backend can only *send*; no list or mark-read API |
| Unauthorized (403) page, session-expiry handling | **Missing** | A 401 currently just fails silently |
| About, Contact, Categories | **Missing** | Static or derived; no backend needed |
| RFQ, Logistics, Analytics | **Missing, and no backend either** | See section 4 |

Cross-cutting problems: the navbar knows nothing about roles (one hard-coded link list per `variant`), login state is read
once on mount, logout only deletes the token, no loading/empty/error states on data pages, the two theme systems.

## 3. Page to database mapping (what is real today)

| Frontend page | Service module | Endpoint | Controller -> service | Collection |
|---|---|---|---|---|
| Login | `authApi.loginUser` | `POST /api/auth/login` `{username,password}` -> `{token,role,expiresAt}` | `AuthController` -> `AuthService` | `users` |
| Register | `authApi.registerUser` | `POST /api/auth/register` `{username,password,email,aadhar,contactNumber,address,role,twoFactorEnabled}` | `AuthController` -> `AuthService` | `users` |
| Profile / Update | `userApi` | `GET /api/users/me`, `PUT /api/users/{id}` (role only changeable by ADMIN) | `UserController` -> `UserService` | `users` |
| Marketplace / details | `productApi` | `GET /api/products[?category=]`, `GET /api/products/{id}`, `GET /api/products/photo/{id}` -> `{id,farmerId,name,category,pricePerUnit,quantityAvailable,photoIds,qualityTag,cropInfo}` | `ProductController` -> `ProductService` | `products`, `photos` |
| Product management (to build) | `productApi` | `POST/PUT /api/products` (multipart: name, category, pricePerUnit, quantityAvailable, qualityTag, cropInfo, images), `DELETE /api/products/{id}` | same | `products`, `photos` |
| Cart | `cartApi` | `GET /api/cart`, `POST /api/cart/add?productId&quantity`, `DELETE /api/cart/remove?productId[&quantity]` | `CartController` -> `CartService` | `carts` |
| Checkout | `checkout.js`, `orderApi` | `POST /api/orders` `{items:[{productId,quantity}]}` or `POST /api/orders/checkout` -> `{orderId,razorpayOrderId,razorpayKeyId,currency,amount}`, then `POST /api/orders/{id}/verify` `{razorpayPaymentId,razorpaySignature}` | `OrderController` -> `OrderService` -> `PaymentGateway` | `orders`, `products` |
| My Orders (to build) | `orderApi` | `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel` -> `{id,buyerId,items[{productId,productName,quantity,unitPrice}],amount,status,razorpayOrderId,createdAt,updatedAt}` | `OrderController` | `orders` |
| Admin users (to build) | new `adminApi` | `GET /api/admin/users`, `POST /api/admin/suspend/{id}`, `POST /api/admin/unsuspend/{id}`, `PUT /api/admin/users/{id}/role` | `AdminController` -> `UserService` | `users` |
| Admin complaints / reports | `adminApi` | `GET /api/admin/complaints`, `POST /api/admin/complaints/{id}/resolve`, `GET /api/admin/report/pdf`, `GET /api/admin/report/excel`; users file with `POST /api/complaints` | `AdminController`, `ComplaintController` | `complaints`, `users` |
| Warehouse (to build) | new `warehouseApi` | `POST /api/warehouse/store`, `GET /api/warehouse/location/{l}`, `PUT /api/warehouse/mark-ready/{id}`, `GET /api/warehouse/ready` | `WarehouseController` | `warehouse_entries` |
| Advisory / queries (to build) | new `advisoryApi` | `GET /api/advisory/all`, `POST /api/advisory/post`, `POST /api/query/submit`, `GET /api/query/mine`, `GET /api/query/all`, `POST /api/query/respond/{id}` | `AdvisoryController`, `QueryController` | `advisory_contents`, `farmer_queries` |

## 4. Gaps: what the requirements ask for versus what the backend has

**Available** (frontend work only): login/register/session, profile, products list/detail/create/update/delete, cart,
buy-now and cart checkout with payment verification, order list/detail/cancel, admin users/complaints/reports, warehouse,
advisory articles and queries, sending notifications (staff), role-based routing (role comes from `/users/me`).

**Partial** (can be done with a visible limitation):
- Marketplace search, category filter, price/availability filter, sort and pagination: the API returns the full list
  (only `?category=` is server-side), so the rest would be client-side. Fine for hundreds of products, not for thousands.
- Product details: only name, category, price, quantity, quality tag, crop info, photos. There is **no** description,
  unit, minimum order quantity, location, harvest date, grade or seller name (`farmerId` only, and `GET /users/{id}` is
  self/admin only, so a buyer cannot resolve the seller's name).
- Payments history: derived from the buyer's own PAID orders. There is no payments API or payment method field.
- Farmer dashboard: a farmer's own products can be filtered client-side by `farmerId`, but there is **no seller-side order
  API**, so "orders for my products" and "revenue" cannot be shown. Only the buyer sees their orders.
- Categories: `category` is a free-text field on the product; there is no categories API. A categories page can only list
  the distinct values in use.

**Missing in the backend** (nothing to connect to; the frontend would have to fake it):
| Requested | Missing backend piece |
|---|---|
| RFQ: create, list, respond, accept/reject quotes | The whole module: entity, repository, service, controller, statuses |
| Logistics / shipment tracking | The whole module (a `CARRIER` role exists but has no endpoints) |
| Analytics dashboards and charts | Aggregate endpoints (orders over time, revenue, users by role, ...) |
| Notification inbox, unread count, mark as read | List / mark-read endpoints (only `POST /notifications/send` exists; sent items are stored) |
| Product activate/deactivate | An `active` flag on the product |
| Order timeline (processing, dispatched, in transit), seller/buyer split, delivery address | Extra order statuses and fields; today only PENDING / PAID / CANCELLED |
| Server-side pagination and sorting | `page`/`size`/`sort` parameters |
| Platform settings, category management | Endpoints |

Your instruction is to preserve the backend and not invent functionality, so these are **not** implemented in the
frontend. Building RFQ or analytics screens on mock data would be exactly the "fake transactions / fake statistics" you
asked to avoid. They need backend work first (see decisions below).

## 5. Proposed plan (uses the existing stack; no rewrite)

Keep JavaScript, plain CSS and axios. Moving 20+ existing files to TypeScript, Tailwind and shadcn/ui would be a rewrite,
which contradicts "preserve". Add **TanStack Query** and **React Hook Form + Zod** only when the pages that benefit
(lists, forms) are built, not everywhere.

1. **Foundation.** Auth context with role from `/users/me`; global 401 handling (token cleared, redirect to login with
   "session expired"); role-aware `ProtectedRoute`; Unauthorized page; one navigation config that drives a role-based
   navbar; shared Loading / Empty / Error components; user-friendly messages for 400/401/403/404/409/500/503 and network
   errors; one theme system; protect `/cart` and `/update-profile`.
2. **Marketplace and product management.** Search, category, price, availability, sort, pagination (client-side, labelled);
   product details with real fields only; Farmer/Admin "My products" with add, edit, delete and photos; validation.
3. **Orders and payments.** My Orders, Order details (status, items, cancel, paid state), payment history derived from
   PAID orders and clearly labelled as such; checkout stays backend-verified (already the case).
4. **Role features that already have APIs.** Admin (users, suspend/unsuspend, role change, complaints, PDF/Excel
   reports), Warehouse, Advisory and queries, file a complaint, staff notification sender.
5. **Dashboards and public pages.** Replace the "COMING SOON" post-login page with per-role dashboards built only from
   real data (buyer: orders, cart; farmer: own products and stock; admin: user and complaint counts). Rewrite the Landing
   page to describe what AgroLink actually does (drop the soil/weather/AI claims), add About, Contact, Categories.
6. **Test** each flow against a real backend, check desktop / tablet / mobile.

## 6. Decisions needed

1. **RFQ, logistics, analytics, notification inbox.** Build them in the backend first (a real module each, with tests),
   or leave them out for now? They are central to the B2B description but do not exist. My recommendation: add an RFQ
   module to the backend first (it is the core B2B feature), and defer logistics and analytics.
2. **Seller-side orders.** Farmers cannot see orders that contain their products. Add an endpoint for that?
   (Recommended: yes, it is small and needed for any farmer dashboard.)
3. **Stack.** Confirm: keep JavaScript and plain CSS, add TanStack Query and React Hook Form + Zod, no TypeScript/Tailwind/shadcn migration.
4. **Landing page.** OK to remove the soil analysis / weather / AI recommendation claims, since no such feature exists?

---

## 7. Status after implementation

Decisions taken: RFQ module and a seller-side orders endpoint added to the backend (with a small notification inbox
because RFQ events need one); logistics and analytics deferred; frontend kept on JavaScript + plain CSS, adding only
TanStack Query and React Hook Form + Zod.

**Built (backend):** `rfq` module, `GET /orders/seller`, notification inbox (list, unread count, mark read), a
`sellerId` on every order line, orders priced from an accepted quote, in-app notifications on RFQ events and payments.

**Built (frontend):**
- Session and security: `AuthProvider` (role loaded from `/users/me`), global 401 handling (session expired -> login),
  role-aware protected routes, Unauthorized and 404 pages, one navigation config driving a role-based navbar with
  unread badge and phone menu.
- Shared states: loading skeletons, empty and error states with retry on every data page; friendly messages for
  400/401/403/404/409/413/503, timeouts and network failures; confirm dialogs; accessible forms.
- Pages: per-role dashboards (buyer, farmer, admin, warehouse/manager, advisor, carrier), marketplace (search, category,
  price, stock, sort, pagination, URL-shareable), product details, cart, checkout, product management (add, edit, delete,
  photos), quote requests (list, create, detail with quote, accept, reject, cancel, order and pay), orders (list, details,
  cancel, seller view), payments history, notifications, admin (users, roles, suspend, complaints, reports), complaints,
  warehouse, advisory articles and farmer questions, categories, about, contact, honest landing page.

**Still not built, because the backend has nothing behind it:** logistics and shipment tracking, analytics
endpoints and charts, product activate/deactivate, order timeline beyond paid/cancelled, seller names on products,
server-side pagination, category management, platform settings, forgot-password.

**Limits worth knowing:** the payments page is built from paid orders (there is no payments API); categories are the
distinct values in use; marketplace filtering and paging run in the browser (the API returns the whole catalogue); the
warehouse can only be browsed by location (no "list everything" endpoint).

**How it was checked:** backend unit and HTTP-level tests (103), frontend unit tests (23), a scripted RFQ/inbox/seller-orders
run against a real MongoDB, and a 108-check run of the real frontend in Chrome against the real backend (buyer, farmer, admin,
anonymous; session expiry; role guards; phone layout; dark theme; keyboard basics). That run found and fixed three real
bugs: search input dropping characters, file uploads answered with 415, and unreadable links in dark mode.
Not exercised: a real Razorpay payment (no keys), real email, a real Render cold start.
