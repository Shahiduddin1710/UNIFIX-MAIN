const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

require("./config/firebase");

const { generalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(generalLimiter);

app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/complaints", require("./routes/complaints"));
app.use("/lost-found", require("./routes/lostFound"));

app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() }),
);
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);
module.exports = app;
