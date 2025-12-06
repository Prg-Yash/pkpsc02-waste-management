import express from "express";
import "dotenv/config";
import cors from "cors";

// Import route modules
import userRoutes from "./routes/user.js";
import wasteRoutes from "./routes/waste.js";
import notificationRoutes from "./routes/notifications.js";
import webhookRoutes from "./routes/webhooks.js";
import leaderboardRoutes from "./routes/leaderboard.js";

const app = express();

app.use(
    cors({
        origin: "*", // allow all origins
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Accept", "x-user-id", "Authorization"],
        exposedHeaders: ["Content-Type"],
        credentials: false,
    })
);

// Additional CORS headers for all requests
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Accept, x-user-id, Authorization, Origin, X-Requested-With"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    next();
});

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(
        `📨 ${req.method} ${req.path} from ${req.headers.origin || "unknown"}`
    );
    next();
});

// Webhook route needs raw body for signature verification
// Must come BEFORE json parser
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }));

// Body parser middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "EcoFlow Waste Management API",
        version: "1.0.0",
        endpoints: {
            user: "/api/user/me",
            waste: "/api/waste/report",
            notifications: "/api/notifications",
            webhook: "/api/webhooks/clerk",
            leaderboard: "/api/leaderboard/global",
        },
    });
});

// Mount route modules
app.use("/api/user", userRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 EcoFlow API Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📚 Documentation: See README.md`);
});
