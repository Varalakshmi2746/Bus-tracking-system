const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Initial seed buses for instant live display
let buses = {
    "BUS-101": {
        busId: "BUS-101",
        busNumber: "101A",
        route: "Downtown Express (Station -> Tech Hub)",
        driverName: "John Doe",
        lat: 16.5062,
        lng: 80.6480,
        speed: 38,
        seatsAvailable: 14,
        totalSeats: 40,
        status: "Active",
        updatedAt: new Date().toISOString()
    },
    "BUS-102": {
        busId: "BUS-102",
        busNumber: "204B",
        route: "Metro City Loop (Airport -> Central Market)",
        driverName: "Sarah Connor",
        lat: 16.5150,
        lng: 80.6320,
        speed: 45,
        seatsAvailable: 6,
        totalSeats: 45,
        status: "Active",
        updatedAt: new Date().toISOString()
    },
    "BUS-103": {
        busId: "BUS-103",
        busNumber: "305C",
        route: "University Shuttle (Campus -> North Terminal)",
        driverName: "David Miller",
        lat: 16.4950,
        lng: 80.6620,
        speed: 28,
        seatsAvailable: 22,
        totalSeats: 35,
        status: "Active",
        updatedAt: new Date().toISOString()
    }
};

// HAVERSINE DISTANCE FUNCTION
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
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

// UPDATE LOCATION HANDLER
const handleUpdateLocation = (req, res) => {
    let { busId, busNumber, route, driverName, lat, lng, speed, totalSeats, seatsAvailable, seats } = req.body;
    
    if (!busId) {
        return res.status(400).json({ success: false, error: "busId is required" });
    }

    lat = parseFloat(lat);
    lng = parseFloat(lng);
    const calculatedSpeed = speed !== undefined ? parseFloat(speed) : 0;
    const availableSeats = seatsAvailable !== undefined ? parseInt(seatsAvailable) : (seats !== undefined ? parseInt(seats) : 15);
    const maxSeats = totalSeats !== undefined ? parseInt(totalSeats) : 40;
    const nowIso = new Date().toISOString();

    if (buses[busId]) {
        let old = buses[busId];
        let currentSpeed = calculatedSpeed;

        if (isNaN(currentSpeed) || currentSpeed === 0) {
            let dist = getDistance(old.lat, old.lng, lat, lng);
            let timeDiff = (Date.now() - new Date(old.updatedAt).getTime()) / 1000;
            if (dist > 2 && timeDiff > 2) {
                currentSpeed = Math.min((dist / timeDiff) * 3.6, 120);
            } else {
                currentSpeed = old.speed || 0;
            }
        }

        buses[busId] = {
            ...old,
            busId: busId,
            busNumber: busNumber || old.busNumber || busId,
            route: route || old.route || "City Loop",
            driverName: driverName || old.driverName || "Driver",
            lat: lat,
            lng: lng,
            speed: Math.round(currentSpeed),
            seatsAvailable: availableSeats,
            totalSeats: maxSeats,
            status: "Active",
            updatedAt: nowIso
        };
    } else {
        buses[busId] = {
            busId: busId,
            busNumber: busNumber || busId,
            route: route || "City Loop",
            driverName: driverName || "Driver",
            lat: lat,
            lng: lng,
            speed: Math.round(calculatedSpeed) || 35,
            seatsAvailable: availableSeats,
            totalSeats: maxSeats,
            status: "Active",
            updatedAt: nowIso
        };
    }

    console.log(`[Telemetry] Updated ${busId} (${buses[busId].busNumber}): Lat ${lat}, Lng ${lng}, Speed ${buses[busId].speed} km/h`);
    return res.status(200).json({ success: true, message: "Location updated successfully", busId: busId });
};

// GET LOCATIONS HANDLER
const handleGetLocations = (req, res) => {
    const busList = Object.values(buses);
    return res.status(200).json({
        success: true,
        count: busList.length,
        buses: busList,
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
        message: "SmartBus Transit API is operational",
        activeBuses: Object.keys(buses).length
    });
});

module.exports = app;
