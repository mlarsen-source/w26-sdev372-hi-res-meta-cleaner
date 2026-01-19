import cors from "cors";
import express from "express";
import sequelize, { connectDB } from "./db/sequelize.js";
import "./models/index.js";
import apiRouter from "./routes/routes.js";
import { seedDevUser } from "./db/devSeed.js"; // development  only
import { errorHandler } from "./middleware/errorHandler.js";

// Initialize Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for all routes
// app.use(cors()); // Break credentialed request, default to 'Access-Control-Allow-Origin: *'

app.use(
  cors({
    origin: 'http://localhost:3000', // frontend origin
    credentials: true,               // allow cookies
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Mount the API router at the root path
app.use("/", apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Define the port number for the server
const PORT = 3001;

// Connect to DB
await connectDB();

// for development purposes. refactor database sync code for production
if (process.env.NODE_ENV === "development") {
  await sequelize.sync({ force: true }); // drop & recreate every start
  await seedDevUser(); // seed database with test user
} else {
  await sequelize.sync();
}

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
