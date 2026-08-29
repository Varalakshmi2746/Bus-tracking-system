const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Multi-waypoint city transit routes for path display
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

// Haversine Distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Initial Real Bus State (Stationary until moved by driver or telemetry update)
let buses = {
    "BUS-101": {
        busId: "BUS-101",
        busNumber: "101A",
        route: "Downtown Express (Station -> Tech Hub)",
        driverName: "John Doe",
        lat: 16.5062,
        lng: 80.6480,
        speed: 0,
        bearing: 0,
        totalSeats: 40,
        seatsAvailable: 14,
        status: "Stationary",
        updatedAt: new Date().toISOString()
    },
    "BUS-102": {
        busId: "BUS-102",
        busNumber: "204B",
        route: "Metro City Loop (Airport -> Central Market)",
        driverName: "Sarah Connor",
        lat: 16.5150,
        lng: 80.6320,
        speed: 0,
        bearing: 0,
        totalSeats: 45,
        seatsAvailable: 8,
        status: "Stationary",
        updatedAt: new Date().toISOString()
    },
    "BUS-103": {
        busId: "BUS-103",
        busNumber: "305C",
        route: "University Shuttle (Campus -> North Terminal)",
        driverName: "David Miller",
        lat: 16.4950,
        lng: 80.6620,
        speed: 0,
        bearing: 0,
        totalSeats: 35,
        seatsAvailable: 21,
        status: "Stationary",
        updatedAt: new Date().toISOString()
    }
};

// UPDATE LOCATION API (Called ONLY when driver transmits new position)
const handleUpdateLocation = (req, res) => {
    let { busId, busNumber, route, driverName, lat, lng, speed, totalSeats, seatsAvailable, seats, isStopped } = req.body;
    
    if (!busId) {
        return res.status(400).json({ success: false, error: "busId is required" });
    }

    const now = Date.now();
    const existing = buses[busId] || {
        lat: parseFloat(lat) || 16.5062,
        lng: parseFloat(lng) || 80.6480,
        updatedAt: new Date().toISOString()
    };

    const newLat = parseFloat(lat);
    const newLng = parseFloat(lng);

    if (isNaN(newLat) || isNaN(newLng)) {
        return res.status(400).json({ success: false, error: "Invalid lat/lng" });
    }

    let calculatedSpeed = speed !== undefined ? parseFloat(speed) : 0;
    let bearing = existing.bearing || 0;

    // Check if the bus has actually moved from previous position
    const dist = getDistanceMeters(existing.lat, existing.lng, newLat, newLng);

    if (dist > 1) {
        // Calculate bearing/direction
        const dLng = (newLng - existing.lng) * Math.cos(newLat * Math.PI / 180);
        const dLat = (newLat - existing.lat);
        bearing = Math.round((Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360);

        if (speed === undefined || speed === null) {
            const timeDiffSec = (now - new Date(existing.updatedAt).getTime()) / 1000;
            if (timeDiffSec > 0.5) {
                calculatedSpeed = Math.min((dist / timeDiffSec) * 3.6, 120);
            }
        }
    } else {
        // Bus has not moved
        calculatedSpeed = 0;
    }

    if (isStopped) {
        calculatedSpeed = 0;
    }

    const availableSeats = seatsAvailable !== undefined ? parseInt(seatsAvailable) : (seats !== undefined ? parseInt(seats) : existing.seatsAvailable || 15);
    const maxSeats = totalSeats !== undefined ? parseInt(totalSeats) : (existing.totalSeats || 40);

    buses[busId] = {
        busId: busId,
        busNumber: busNumber || existing.busNumber || busId,
        route: route || existing.route || "City Loop",
        driverName: driverName || existing.driverName || "Driver",
        lat: newLat,
        lng: newLng,
        speed: Math.round(calculatedSpeed),
        bearing: bearing,
        seatsAvailable: availableSeats,
        totalSeats: maxSeats,
        status: calculatedSpeed > 1 ? "Active" : "Stationary",
        updatedAt: new Date().toISOString()
    };

    console.log(`[Driver GPS] ${busId}: Lat ${newLat}, Lng ${newLng}, Speed ${buses[busId].speed} km/h, Status: ${buses[busId].status}`);
    return res.status(200).json({ success: true, message: "Location updated successfully", bus: buses[busId] });
};

// GET LOCATIONS API (Returns actual positions without fake auto-advancement)
const handleGetLocations = (req, res) => {
    const busList = Object.values(buses);
    return res.status(200).json({
        success: true,
        count: busList.length,
        buses: busList,
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
        message: "SmartBus Transit Telemetry API is active",
        buses: Object.keys(buses).length
    });
});

module.exports = app;
