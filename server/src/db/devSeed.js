import { user } from "../models/index.js";
import { hashPassword } from "../utils/hashPassword.js";

export async function seedDevUser() {
  const hashedPassword = await hashPassword("password123");

  await user.create({
    email: "testuser1@example.com",
    first_name: "Test",
    last_name: "User1",
    password_hash: hashedPassword,
  });

  await user.create({
    email: "testuser2@example.com",
    first_name: "Test",
    last_name: "User2",
    password_hash: hashedPassword,
  });

  await user.create({
    email: "testuser3@example.com",
    first_name: "Test",
    last_name: "User3",
    password_hash: hashedPassword,
  });

  console.log("DB reset and seeded with Test Users");
}
