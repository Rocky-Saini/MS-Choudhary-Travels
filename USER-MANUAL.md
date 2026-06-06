# MS Choudhary Travels — User Manual

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                 │
├──────────┬──────────────┬─────────────┬─────────────────┤
│  User    │    Admin     │   Driver    │  Track Booking  │
│  Homepage│   Dashboard  │  Dashboard  │     Page        │
└────┬─────┴──────┬───────┴──────┬──────┴────────┬────────┘
     │            │              │               │
     ▼            ▼              ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                   │
│  /api/trips  /api/bookings  /api/admin/*  /api/driver/* │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma ORM + PrismaPg Adapter               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma Postgres (Cloud Database)            │
│  Tables: Admin, Driver, Vehicle, Route, Trip, Booking,  │
│  Payment, Notification, LiveLocation, BusService,       │
│  WaitingList, FullCarBooking                            │
└─────────────────────────────────────────────────────────┘
```

---

## 👤 USER GUIDE — How to Book Your Seat

### Step 1: Open Website
Visit the MS Choudhary Travels website homepage.

### Step 2: Select Route
Choose your route:
- **Gangoh → Delhi** (Morning trips)
- **Delhi → Gangoh** (Evening trips)

### Step 3: Select Date
Pick any date from Today to 7 days ahead using the date buttons.

### Step 4: Choose a Vehicle
Browse available trips — each card shows:
- Vehicle number, Driver name, Contact
- Departure time, Fare (₹350/seat)
- Available seats (color bar: green = available, red = full)
- Tag badges (e.g. "⚡ Super Fast")

### Step 5: Click "Book Now"
Opens the booking form.

### Step 6: Fill Booking Details
- **Full Name** — Your name
- **Mobile** — 10-digit number (validated)
- **Pickup Point** — Select from dropdown (Gangoh, Chandpura, Fatehpur, etc.)
- **Drop Point** — Select from dropdown (Loni, Kashmere Gate Metro Gate 4/3/1)
- **Number of Seats** — How many seats you need

### Step 7: Confirm Booking
- If **Advance NOT required** → Booking confirmed instantly! Pay to driver after journey.
- If **Advance Required** → Razorpay payment → Booking confirmed after payment.

### Step 8: Get Confirmation
- Booking confirmed message with booking code
- **WhatsApp button** — Click to get full booking details on WhatsApp

### Step 9: Track Your Booking
Go to **"Track Booking"** page → Enter mobile number or booking code → See full details.

---

### 🚗 Book Full Car (Entire Vehicle)
1. Scroll down on homepage → "Book Full Car" section
2. Click **"Request Full Car"**
3. Select Date (7 days or "Other" for any future date)
4. Select Time (or custom time picker)
5. Enter Name, Mobile, Pickup Point, Drop Point
6. Submit → **Status: Pending Admin Approval**
7. Admin assigns vehicle → You get WhatsApp notification with details
8. Pay fare to driver as discussed with admin

### ⏳ Waiting List (When All Seats Full)
If all trips are full, a **"Join Waiting List"** button appears:
1. Click "Join Waiting List"
2. Select Date + Preferred Time
3. Fill Name, Mobile, Pickup, Drop, Seats
4. Submit → Added to waiting list
5. When a seat opens, admin confirms you → WhatsApp notification

---

## 🛡️ ADMIN GUIDE

### Login
- URL: `/admin/login`
- Credentials: Email + Password

### Dashboard Tab
- Revenue, Bookings, Today's Bookings, Seat Occupancy stats
- **7-day date selector** — view any day's trips
- Each trip shows: vehicle, driver, seats booked/available, passengers
- **Book Seat** — Admin can book on behalf of customers (call-based bookings)
- **Shift Passenger** — Move passenger to another vehicle (same date, same route)
- **Exchange** — Swap two passengers between vehicles
- All actions send WhatsApp notification to customer

### Drivers Tab
- Add/Edit/Delete drivers
- Toggle Active/Inactive
- Fields: Name, Mobile (10-digit validated), Password

### Vehicles Tab
- Add/Edit/Delete vehicles
- Assign driver to vehicle

### Trips Tab
- **Single Trip** — Create one trip manually
- **Smart Create** — Bulk create trips:
  - All Vehicles → One Route
  - Select Vehicles → One Route
  - Split Routes → Different vehicles to different routes
  - Multi-date support
  - Tag field (e.g. "Super Fast", "Premium")
- **Edit** any trip (vehicle, driver, route, date, time, tag)
- **Delete** trip (with confirmation modal)
- **Toggle Advance ON/OFF** per trip
- **Date filter** to view specific date's trips

### Bookings Tab
- View all bookings
- **Filter by Date** + **Filter by Mobile**
- Approve pending bookings
- Cancel bookings (WhatsApp notification sent to customer)

### Waiting List Tab
- 7-day date selector
- View waiting customers (name, mobile, route, date, time, pickup/drop, seats)
- **Confirm Seat** — Select available vehicle (same route only) → Book + WhatsApp notify
- Remove entries
- Auto-cleanup: past-date entries auto-deleted

### Full Car Tab
- View all full car requests (Pending/Approved/Rejected)
- **Approve & Assign** — Select vehicle → Approve → WhatsApp notify customer
- **Reject** — Reject request

### Bus Service Tab
- Add/Edit/Delete bus services
- Toggle Active/Inactive (shows/hides on homepage)
- Fields: Name, Route, Departure Time, Contact, Fare, Description

---

## 🚘 DRIVER GUIDE

### Login
- URL: `/driver/login`
- Credentials: Mobile (10-digit) + Password

### Dashboard
- 7-day date selector — view upcoming trips
- Each trip shows:
  - Vehicle number, Route, Time, Fare
  - Seat occupancy bar
  - Full passenger list with details

### Passenger Details
Each passenger shows:
- Name, Pickup → Drop, Seats, Fare
- Advance paid / Due amount
- **Direct Call button** (tap to call)
- **Collect Payment** button (for remaining due)

### Collect Payment
When passenger pays remaining fare:
1. Click **"💰 Collect ₹X & Mark Paid"**
2. Modal opens showing amount
3. Select: **Cash** or **Online/UPI**
4. Payment recorded → Badge shows "✓ Paid (CASH/ONLINE)"

### Start/Complete Journey
- **Start Journey** — Begins GPS sharing (every 15 sec)
- **Complete Journey** — Marks trip complete, notifies passengers

### Waiting List
- Click **"⏳ Waiting List"** button in header
- View customers waiting for seats
- If your vehicle has empty seats → Contact admin to confirm them

---

## 📱 WhatsApp Notifications

Messages are sent for:
- ✅ Booking Confirmed
- ❌ Booking Cancelled
- 🔄 Vehicle Changed (shift/exchange)
- ✅ Full Car Approved
- ✅ Waiting List Seat Available

All messages include: Vehicle, Driver, Route, Date, Time, Booking Code, Contact number.

---

## 🔑 Key URLs

| Page | URL |
|------|-----|
| Homepage | `/` |
| Track Booking | `/track` |
| Admin Login | `/admin/login` |
| Admin Dashboard | `/admin/dashboard` |
| Driver Login | `/driver/login` |
| Driver Dashboard | `/driver/dashboard` |

---

## 📞 Support
- Admin: +91 7830673603
- Email: adnanhasan01011988@gmail.com
- Developer: Rocky Saini (Codesefod IT Solutions)
