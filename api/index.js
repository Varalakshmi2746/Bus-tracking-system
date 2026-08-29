const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Multi-waypoint city transit routes
const ROUTES = {
    "BUS-101": [
        [16.5062, 80.6480],
        [16.5085, 80.6450],
        [16.5110, 80.6410],
        [16.5145, 80.6360],
        [16.5180, 80.6310],
        [16.5160, 80.6270],
        [16.5120, 80.6230],
        [16.5070, 80.6280],
        [16.5030, 80.6350],
        [16.5010, 80.6420],
        [16.5040, 80.6460],
        [16.5062, 80.6480]
    ],
    "BUS-102": [
        [16.5150, 80.6320],
        [16.5190, 80.6380],
        [16.5230, 80.6450],
        [16.5210, 80.6540],
        [16.5160, 80.6600],
        [16.5090, 80.6580],
        [16.5040, 80.6510],
        [16.5080, 80.6420],
        [16.5120, 80.6350],
        [16.5150, 80.6320]
    ],
    "BUS-103": [
        [16.4950, 80.6620],
        [16.4980, 80.6550],
        [16.5020, 80.6490],
        [16.5070, 80.6430],
        [16.5050, 80.6380],
        [16.4990, 80.6420],
        [16.4930, 80.6510],
        [16.4910, 80.6590],
        [16.4950, 80.6620]
    ]
};

// Calculates continuous real-time coordinates along a waypoint path
function getSimulatedPosition(route, loopDurationSeconds = 70, offsetSeconds = 0) {
    const totalWaypoints = route.length;
    const now = (Date.now() / 1000) + offsetSeconds;
    const progress = (now % loopDurationSeconds) / loopDurationSeconds;
    const virtualIndex = progress * (totalWaypoints - 1);
    const index = Math.floor(virtualIndex);
    const fraction = virtualIndex - index;
    const nextIndex = (index + 1) % totalWaypoints;

    const p1 = route[index];
    const p2 = route[nextIndex];

    const lat = p1[0] + (p2[0] - p1[0]) * fraction;
    const lng = p1[1] + (p2[1] - p1[1]) * fraction;

    const dLng = (p2[1] - p1[1]) * Math.cos(lat * Math.PI / 180);
    const dLat = (p2[0] - p1[0]);
    const bearing = Math.round((Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360);

    const baseSpeed = 36 + Math.sin(now / 4) * 9;
    const speed = Math.max(18, Math.round(baseSpeed));

    return { lat, lng, bearing, speed };
}

// Initial state
let buses = {
    "BUS-101": {
        busId: "BUS-101",
        busNumber: "101A",
        route: "Downtown Express (Station -> Tech Hub)",
        driverName: "John Doe",
        totalSeats: 40,
        seatsAvailable: 14,
        status: "Active",
        loopDuration: 75,
        timeOffset: 0,
        isManual: false,
        lastManualUpdate: 0
    },
    "BUS-102": {
        busId: "BUS-102",
        busNumber: "204B",
        route: "Metro City Loop (Airport -> Central Market)",
        driverName: "Sarah Connor",
        totalSeats: 45,
        seatsAvailable: 8,
        status: "Active",
        loopDuration: 90,
        timeOffset: 25,
        isManual: false,
        lastManualUpdate: 0
    },
    "BUS-103": {
        busId: "BUS-103",
        busNumber: "305C",
        route: "University Shuttle (Campus -> North Terminal)",
        driverName: "David Miller",
        totalSeats: 35,
        seatsAvailable: 21,
        status: "Active",
        loopDuration: 60,
        timeOffset: 45,
        isManual: false,
        lastManualUpdate: 0
    }
};

// UPDATE LOCATION HANDLER (From Driver GPS)
const handleUpdateLocation = (req, res) => {
    let { busId, busNumber, route, driverName, lat, lng, speed, totalSeats, seatsAvailable, seats } = req.body;
    
    if (!busId) {
        return res.status(400).json({ success: false, error: "busId is required" });
    }

    lat = parseFloat(lat);
    lng = parseFloat(lng);
    const calculatedSpeed = speed !== undefined ? parseFloat(speed) : 35;
    const availableSeats = seatsAvailable !== undefined ? parseInt(seatsAvailable) : (seats !== undefined ? parseInt(seats) : 15);
    const maxSeats = totalSeats !== undefined ? parseInt(totalSeats) : 40;
    const nowIso = new Date().toISOString();

    const existing = buses[busId] || {};
    buses[busId] = {
        ...existing,
        busId: busId,
        busNumber: busNumber || existing.busNumber || busId,
        route: route || existing.route || "City Loop",
        driverName: driverName || existing.driverName || "Driver",
        lat: lat,
        lng: lng,
        speed: Math.round(calculatedSpeed),
        seatsAvailable: availableSeats,
        totalSeats: maxSeats,
        status: "Active",
        isManual: true,
        lastManualUpdate: Date.now(),
        updatedAt: nowIso
    };

    console.log(`[Live GPS] Updated ${busId}: Lat ${lat}, Lng ${lng}, Speed ${buses[busId].speed} km/h`);
    return res.status(200).json({ success: true, message: "Location updated successfully", busId: busId });
};

// GET LOCATIONS HANDLER (Returns real-time continuous bus positions)
const handleGetLocations = (req, res) => {
    const now = Date.now();
    const resultList = [];

    for (const [id, bus] of Object.entries(buses)) {
        // If received live driver GPS within 30 seconds, use manual coordinates
        if (bus.isManual && (now - bus.lastManualUpdate < 30000)) {
            resultList.push({
                ...bus,
                updatedAt: new Date(bus.lastManualUpdate).toISOString()
            });
        } else {
            // Otherwise, calculate real-time continuous movement along route
            const routePath = ROUTES[id] || ROUTES["BUS-101"];
            const sim = getSimulatedPosition(routePath, bus.loopDuration || 70, bus.timeOffset || 0);

            // Dynamic seats variance
            const seatFluctuation = Math.abs(Math.sin(now / 15000 + (bus.timeOffset || 0)));
            const seatsLeft = Math.max(2, Math.round(bus.totalSeats * (0.2 + 0.6 * seatFluctuation)));

            resultList.push({
                ...bus,
                lat: sim.lat,
                lng: sim.lng,
                bearing: sim.bearing,
                speed: sim.speed,
                seatsAvailable: seatsLeft,
                status: "Active",
                updatedAt: new Date().toISOString()
            });
        }
    }

    return res.status(200).json({
        success: true,
        count: resultList.length,
        buses: resultList,
        routes: ROUTES,
        timestamp: new Date().toISOString()
    });
};

// Express routes
app.post("/api/update-location", handleUpdateLocation);
app.post("/update-location", handleUpdateLocation);

app.get("/api/location", handleGetLocations);
app.get("/api/locations", handleGetLocations);
app.get("/locations", handleGetLocations);

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartBus Transit Real-Time Telemetry API is active",
        activeBuses: Object.keys(buses).length
    });
});

module.exports = app;
