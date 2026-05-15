const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let buses = {};

// Haversine distance (meters)
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

app.post("/update-location", (req, res) => {

    let { busId, lat, lng } = req.body;

    // convert to numbers
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    const now = Date.now();

    if (buses[busId]) {

        let old = buses[busId];

        let dist = getDistance(old.lat, old.lng, lat, lng); // meters

        let timeDiff = (now - old.time) / 1000; // seconds

        let speed = 0;

        if (timeDiff > 0 && dist > 1) {
            speed = (dist / timeDiff) * 3.6; // km/h
        }

        buses[busId] = {
            lat,
            lng,
            time: now,
            speed: speed.toFixed(2)
        };

    } else {

        buses[busId] = {
            lat,
            lng,
            time: now,
            speed: 0
        };

    }

    console.log("Bus updated:", busId, lat, lng);

    res.send("Location updated");

});

app.get("/locations", (req, res) => {
    res.json(buses);
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});