# Cloud-Ready Hotel Booking System with CI/CD Pipeline

A full-stack hotel management system designed for cloud deployment. The project demonstrates a DevOps-ready workflow with Docker containerization and a GitHub Actions CI pipeline.

## Highlights
- Role-based authentication (Admin, Staff, Customer)
- Room management, bookings, check-in/out, services, and billing
- PostgreSQL schema with invoices and booking services
- Responsive React UI with dashboards and toasts
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
C:\Users\samee\OneDrive\Desktop\hotel\backend\.env
```

3. Start backend:

```bash
cd C:\Users\samee\OneDrive\Desktop\hotel\backend
npm install
npm run dev
```

4. Start frontend:

```bash
cd C:\Users\samee\OneDrive\Desktop\hotel\frontend
npm install
npm run dev
```

5. Open the UI at http://localhost:5173

## Demo Credentials
- Admin: `admin@hotel.local` / `Admin@123`
- Staff: `staff@hotel.local` / `Staff@123`
- Customer: `guest@hotel.local` / `Guest@123`

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

## Next Steps
- Add email notifications
- Integrate payments
- Deploy to a cloud provider
