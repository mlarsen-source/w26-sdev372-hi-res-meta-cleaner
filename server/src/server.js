import cors from "cors";
import express from "express";
import sequelize, { connectDB } from "./db/sequelize.js";
import "./models/index.js";
import apiRouter from "./routes/routes.js";
import { seedDevUser } from "./db/devSeed.js"; // development  only
import { errorHandler } from "./middleware/errorHandler.js";

// Initialize Express application
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Mount the API router at the root path
app.use("/", apiRouter);

// Error handling middleware (must be last app.use)
app.use(errorHandler);

// Define the port number for the server
const PORT = process.env.PORT || 3001;

// Connect to DB
await connectDB();

// for development purposes. refactor database sync for production
if (process.env.NODE_ENV === "development") {
  await sequelize.sync({ force: true }); // drop & recreate every start
  await seedDevUser(); // seed database with test user
} else {
  await sequelize.sync();
}

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});