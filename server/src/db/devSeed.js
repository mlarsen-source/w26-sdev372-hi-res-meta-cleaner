import { user } from "../models/index.js";

export async function seedDevUser() {
  await user.create({
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    password_hash: "password123",
  });

  console.log("DB reset and seeded with Test User");
}
