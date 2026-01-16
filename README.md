# Smart Safety Helmet Platform

A complete production-ready Smart Safety Helmet platform integrated with ESP32 hardware, supporting real-time monitoring, automatic attendance, and role-based dashboards.

## Prerequisites

- Node.js (v18+)
- MongoDB (Must be running locally on default port 27017)
- MQTT Broker (Default: test.mosquitto.org, can be changed in `.env`)

## Project Structure

- `backend/`: Node.js + Express + TypeScript API & Real-time Server
- `frontend/`: React + Vite + Tailwind CSS Dashboard & Mobile View
- `firmware/`: ESP32 Arduino C++ Code

## Setup & Running (Local Development)

### 1. Database Setup
Make sure your local MongoDB service is running. Then seed the database with initial users and devices:

```bash
cd backend
npm install
npm run seed
```

**Default Credentials (npm run seed):**
- **Admin**: `admin@example.com` / `password123`
- **Supervisor**: `supervisor@example.com` / `password123`
- **Worker 1**: `worker1@example.com` / `password123`
- **Worker 2**: `worker2@example.com` / `password123`

### 2. Backend Server
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`

### 4. Environment Configuration

#### Backend `.env` (in `backend/.env`)
Key entries:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthelmet
JWT_SECRET=your_jwt_secret_here
MQTT_BROKER=mqtt://test.mosquitto.org
SERIAL_PORT=COM10
SERIAL_DEVICE_ID=ESP32_001

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
```

Adjust `SERIAL_PORT`, `SERIAL_DEVICE_ID`, and SMTP settings to match your environment.

#### Frontend `.env` (in `frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

These must point to the backend URL and Socket.IO endpoint.

### 5. ESP32 Firmware (Live Mode)
- Open `firmware/esp32_helmet/esp32_helmet.ino` in Arduino IDE.
- Install libraries: `PubSubClient`, `ArduinoJson`.
- Update:
  - WiFi SSID and password.
  - MQTT broker URL to match `MQTT_BROKER` in backend `.env`.
  - Device ID to match `SERIAL_DEVICE_ID` / created device (for example `ESP32_001`).
- Flash the firmware to the ESP32.
- Once running, the ESP32 will publish sensor data and alert flags (including LED alert) to topics:
  - `helmet/<deviceId>/data`
  - `helmet/<deviceId>/status`
  - `helmet/<deviceId>/scan`

The backend MQTT handler ingests these and pushes real-time updates to the dashboards via Socket.IO.

## Simulation (Without Hardware)
To test the system without hardware, run the device simulator:
```bash
cd backend
node simulate_device.js
```
This script acts as a helmet, sending sensor data and alerts (SOS) to the system.

## Features

- **Role-Based Dashboards**
  - **Worker Dashboard**: Personal live vitals, helmet status, LED alert indicator, location map, attendance widget, SOS button, DPR submission, and materials request.
  - **Supervisor Dashboard**: Workforce monitoring, site map, alerts command center, compliance analytics, AI insights.
  - **Admin Dashboard**: System-wide control panel for users, devices, sites, shifts, attendance, alerts, reports, settings, and backups.

- **Real-time Monitoring**
  - Live heart rate, body temperature, gas level, battery, and helmet-on status via Socket.IO.
  - System-wide map of workers and devices, with live status.

- **Alerts & LED Status**
  - Alerts for gas, fall, heart rate, helmet removed, disconnect, and SOS.
  - LED alert flag from the ESP32 shown on:
    - **Admin monitoring views** (Safety Monitor / Admin Dashboard).
    - **Worker Dashboard** (LED status card and helmet status card).

- **Attendance & Shifts**
  - Shift configuration per site.
  - Automatic attendance via QR / scan logs, with audit trails.
  - Worker self-view of attendance.

- **Admin Features**
  - Secure admin login with JWT.
  - Worker & supervisor management (CRUD).
  - Helmet / ESP32 device management and assignment.
  - Site creation with geo-fencing and supervisor/worker assignment.
  - Shift scheduling and attendance rules.
  - Full attendance management and logs.
  - Alert and incident management with status updates.
  - Analytics and dashboards for alerts and DPRs.
  - PDF / CSV exports for reports (DPR and materials).
  - System thresholds & configurations (safety limits, notification options).
  - Audit logs and activity tracking for key changes.
  - Notification channel management (Email / SMS / push).
  - Multi-site scalability with per-site monitoring.
  - Data backup and download endpoint from the admin settings.

- **Live Charts**
  - Worker dashboard shows live, continuously updating charts for:
    - Heart rate.
    - Environment temperature.
  - Charts are driven from the same data used in the cards, so visuals match the values shown.
