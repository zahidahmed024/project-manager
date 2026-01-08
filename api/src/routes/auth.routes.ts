import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { userRepo } from "../repositories/user.repo";
import { hashPassword, verifyPassword, signToken } from "../utils/auth";
import { authMiddleware } from "../middlewares/auth";

const authRoutes = new Hono();

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /auth/register
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  
  // Check if user exists
  const existing = userRepo.findByEmail(email);
  if (existing) {
    return c.json({ error: "Email already registered" }, 400);
  }
  
  // Create user
  const passwordHash = await hashPassword(password);
  const user = userRepo.create({ email, password_hash: passwordHash, name });
  
  // Generate token
  const token = await signToken({
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
  });
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  }, 201);
});

// POST /auth/login
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  
  const user = userRepo.findByEmail(email);
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const token = await signToken({
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
  });
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  });
});

// GET /auth/me - Get current user
authRoutes.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export { authRoutes };
