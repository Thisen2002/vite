const express = require("express");
const supabase = require("./db"); // ✅ correct import

const app = express();
const PORT = 3000;

app.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("feedback")  // 👈 query your real table
        .select("*")
        .limit(5);         // grab just a few rows for testing

    if (error) {
        console.error("❌ Supabase error:", error.message);
        return res.status(500).send("Connection failed!");
    }

    res.send({
        message: "✅ Connected to Supabase!",
        sampleRows: data,
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
