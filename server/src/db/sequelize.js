// db/sequelize.js
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from the server root explicitly so PM2/startup services
// that change the working directory still pick up the expected vars.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL DB!");
  } catch (err) {
    console.error("Can't connect to DB!", err);
    process.exit(1);
  }
}

export default sequelize;
