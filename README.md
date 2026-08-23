# 🚍 Smart Bus Tracking System

A real-time Smart Bus Tracking System built with HTML5, CSS3, JavaScript, Leaflet.js, Node.js, and Express.js. It allows passengers to track live bus locations, estimated arrival times (ETA), vehicle speed, available seats, and bus stops in real time.

---

## 🌐 Live Demo

- **Live URL**: [https://bus-tracking-system-dusky.vercel.app](https://bus-tracking-system-dusky.vercel.app)
- **Alternative Demo**: [https://bus-tracking-system-sumithalanke46s-projects.vercel.app](https://bus-tracking-system-sumithalanke46s-projects.vercel.app)

---

## ✨ Features

- 📍 **Real-Time GPS Tracking**: Live location broadcasting using HTML5 Geolocation API.
- 🗺️ **Interactive Maps**: Powered by OpenStreetMap and Leaflet.js.
- ⚡ **Speed & ETA Calculation**: Calculates distance, speed, and expected arrival time dynamically using the Haversine formula.
- 💺 **Live Seat Availability**: Real-time updates of available seats for each bus.
- 🔐 **Passenger & Driver Portals**:
  - `login.html` / `signup.html`: Passenger & Driver access.
  - `dashboard.html`: Quick navigation hub.
  - `map.html`: Passenger live tracking view with bus search.
  - `gps.html`: Driver GPS broadcast transmitter.

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Varalakshmi2746/Bus-tracking-system.git
   cd Bus-tracking-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:3000`

---

## ☁️ Deployment on Vercel

This project is configured for **1-click deployment on Vercel**:

1. Push code to GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com).
3. Vercel automatically deploys the frontend static files and serverless API functions located in `/api`.
