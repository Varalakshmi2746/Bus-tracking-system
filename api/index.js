const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let buses = {};

// HAVERSINE DISTANCE FUNCTION
function getDistance(lat1, lon1, lat2, lon2) {
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

// UPDATE LOCATION HANDLER
const handleUpdateLocation = (req, res) => {
    let { busId, lat, lng, seats } = req.body;
    if (!busId) {
        return res.status(400).send("Bus ID is required");
    }

    lat = parseFloat(lat);
    lng = parseFloat(lng);
    seats = parseInt(seats) || 0;
    const now = Date.now();

    if (buses[busId]) {
        let old = buses[busId];
        let dist = getDistance(old.lat, old.lng, lat, lng);
        let timeDiff = (now - old.time) / 1000;
        let speed = old.speed || 0;

        // IGNORE SMALL GPS MOVEMENTS
        if (dist > 2 && timeDiff > 2) {
            speed = (dist / timeDiff) * 3.6;
            if (speed > 120) {
                speed = old.speed;
            }
        }

        buses[busId] = {
            lat: lat,
            lng: lng,
            time: now,
            speed: parseFloat(speed).toFixed(2),
            seats: seats
        };
    } else {
        buses[busId] = {
            lat: lat,
            lng: lng,
            time: now,
            speed: 0,
            seats: seats
        };
    }

    console.log("Bus Updated:", busId, "Seats:", seats);
    res.status(200).send("Location Updated");
};

// GET LOCATIONS HANDLER
const handleGetLocations = (req, res) => {
    res.status(200).json(buses);
};

// Express routes
app.post("/update-location", handleUpdateLocation);
app.post("/api/update-location", handleUpdateLocation);

app.get("/locations", handleGetLocations);
app.get("/api/locations", handleGetLocations);

app.get("/api", (req, res) => {
    res.status(200).json({ status: "API is running", buses: Object.keys(buses).length });
});

module.exports = app;
