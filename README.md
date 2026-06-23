# FinTech Digital Wallet & Payments Ledger

A secure, interactive digital wallet and transactional payments ledger. This platform enables users to register accounts, transfer funds via emails or QR codes, configure two-factor authentication, view real-time spend analytics, and manage fraud detection flags.

---

## Technical Architecture

The application is built as a split client-server monorepo structure:

### 💻 Frontend Client (`digital-wallet-next`)
A responsive, high-performance web dashboard:
- **Core Framework:** Next.js 16 (App Router) & React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **HTTP Client:** Axios with JWT request interceptors
- **Features:** Dynamic SVG volume charts, camera QR scanners, secure 2FA setups, and real-time transaction ledger rendering.

### ⚙️ Backend API (`backend`)
A RESTful backend service handling cryptography, transactions, and ledger management:
- **Core Framework:** Node.js & Express
- **Database ORM:** Sequelize
- **Databases:** SQLite (local development fallback) & PostgreSQL (production database)
- **Security & Cryptography:** JWT Authentication, speakeasy (2FA token generation & validation), and bcrypt password hashing.

---

## Key Features

1. **User Sign-In & Accounts:** Cryptographically signed user authentication with JSON Web Tokens (JWT).
2. **P2P Digital Wallet:** Real-time ledger updates, balance syncs, and transfer history filters.
3. **QR Code Operations:** Generate wallet address codes and parse QR payment keys using live web camera engines.
4. **Two-Factor Authentication (2FA):** Google Authenticator verification setups for secure logins and transfers.
5. **Real-time Spending Metrics:** Analytics panels displaying monthly transaction volumes, spending distributions, and anomaly indicators.
6. **Fraud Flag Monitoring:** Automated transaction velocity reviews with administrative resolution notes.

---

## How to Run Locally

For Windows systems, we have configured a root startup script:

1. Double-click the **`start.bat`** script at the project root.
2. The script will automatically:
   - Inspect and install dependencies for the backend.
   - Inspect and install dependencies for the Next.js client.
   - Spin up the Express backend (running on `http://localhost:5000`).
   - Spin up the Next.js frontend (running on `http://localhost:3000`).
3. Open your browser and navigate to **`http://localhost:3000`** to access the dashboard.

*Note: The database runs on a local SQLite file (`backend/database.sqlite`) by default during local development.*

---

## Production Deployment on Render

This codebase is ready to deploy directly on Render:

1. **Database:** Deploy a **Render PostgreSQL** instance (this injects the `DATABASE_URL` credential automatically).
2. **Backend Service:**
   - **Type:** Web Service
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `DATABASE_URL`: (linked database URL)
     - `DATABASE_SSL`: `true`
     - `PORT`: `5000`
     - `JWT_SECRET`: (your secure signing secret)
3. **Frontend Service:**
   - **Type:** Web Service
   - **Root Directory:** `digital-wallet-next`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `BACKEND_URL`: (the deployed backend URL, e.g., `https://your-backend.onrender.com`)
