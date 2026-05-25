const express = require("express");

const app = express();

app.use(express.json());

app.use(express.static(__dirname));

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

// UPDATE LOCATION API

app.post("/update-location", (req, res) => {

    let { busId, lat, lng, seats } = req.body;

    lat = parseFloat(lat);

    lng = parseFloat(lng);

    seats = parseInt(seats);

    const now = Date.now();

    if (buses[busId]) {

        let old = buses[busId];

        let dist = getDistance(

            old.lat,

            old.lng,

            lat,

            lng

        );

        let timeDiff = (now - old.time) / 1000;

        let speed = old.speed || 0;

        // IGNORE SMALL GPS MOVEMENTS

        if (dist > 2 && timeDiff > 2) {

            speed = (dist / timeDiff) * 3.6;

            // LIMIT UNREALISTIC SPEED

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

    console.log(

        "Bus Updated:",

        busId,

        "Seats:",

        seats

    );

    res.send("Location Updated");

});

// GET LOCATIONS API

app.get("/locations", (req, res) => {

    res.json(buses);

});

// START SERVER

app.listen(3000, () => {

    console.log(

        "Server running on http://localhost:3000"

    );

});