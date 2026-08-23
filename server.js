const path = require("path");
const express = require("express");
const app = require("./api/index");

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});