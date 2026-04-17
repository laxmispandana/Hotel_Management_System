# [Cloud-Ready Hotel Booking System with CI/CD Pipeline](https://hotel-management-system-omega-three.vercel.app/)

A full-stack hotel management system designed for cloud deployment. The project demonstrates a DevOps-ready workflow with Docker containerization and a GitHub Actions CI pipeline.

## Highlights
- Role-based authentication (Admin, Staff, Customer)
- Room management, bookings, check-in/out, services, and billing
- PostgreSQL schema with invoices and booking services
- Responsive React UI with dashboards and toasts
- Admin UPI registration with QR code display on invoices (demo)
- GitHub Actions workflow for automated build/test and Docker builds

## Architecture
- Frontend: React + Vite
- Backend: Node.js + Express (service-controller structure)
- Database: PostgreSQL
- CI/CD: GitHub Actions
- Containers: Docker and Docker Compose

## Quick Start (Local)
1. Install Node.js 20+ and PostgreSQL.
2. Configure backend env:

```
backend/.env
```

3. Start backend:

```bash
cd backend
npm install
npm run dev
```

4. Start frontend:

```bash
cd frontend
npm install
npm run dev
```


## Demo Credentials
- Admin: `admin@hotel.local` / `Admin@123`
- Staff: `staff@hotel.local` / `Staff@123`
- Customer: `guest@hotel.local` / `Guest@123`

## Admin UPI QR (Demo)
Admins can register a UPI ID from the Dashboard. The app generates a QR code and shows it on invoices.
This is UI-only demo behavior and does not process real payments.

## Deployment (Railway + Vercel)
### Backend (Railway)
1. Create a new Railway project from GitHub.
2. Set **Root Directory** to `backend`.
3. Set build/start commands:
   - Build: `npm install`
   - Start: `npm run start`
4. Environment variables:
   - `DATABASE_URL=...`
   - `JWT_SECRET=...`
   - `PORT=8081` (or let Railway assign)

### Frontend (Vercel)
1. Import the repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Environment variable:
   - `VITE_API_URL=https://<your-railway-backend-url>`
4. Deploy and open the Vercel URL.

## API Endpoints
Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Rooms:
- `GET /api/rooms`
- `GET /api/rooms/availability?checkIn=&checkOut=&type=`
- `POST /api/rooms` (admin)
- `PUT /api/rooms/:id` (admin)
- `DELETE /api/rooms/:id` (admin)

Bookings:
- `GET /api/bookings`
- `POST /api/bookings`
- `POST /api/bookings/:code/cancel`
- `POST /api/bookings/:code/check-in` (admin/staff)
- `POST /api/bookings/:code/check-out` (admin/staff)
- `GET /api/bookings/:code/invoice`

Services:
- `GET /api/services`
- `POST /api/services` (admin)
- `PUT /api/services/:id` (admin)
- `DELETE /api/services/:id` (admin)
- `POST /api/services/attach` (admin/staff)
- `GET /api/bookings/:bookingId/services`

Dashboard:
- `GET /api/dashboard/summary` (admin/staff)

## Database Schema
Tables:
- `users` (role-based auth)
- `rooms`
- `bookings`
- `services`
- `booking_services`
- `invoices`

## CI/CD Pipeline
The workflow in `.github/workflows/ci.yml` performs:
- dependency installs
- backend tests
- frontend build
- Docker image builds
- Docker image publishing to GitHub Container Registry on pushes to `main`

## Next Steps
- Add email notifications
- Integrate payments
- Deploy to a cloud provider

