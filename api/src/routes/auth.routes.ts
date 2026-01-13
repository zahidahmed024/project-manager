import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { userRepo } from "../repositories/user.repo";
import { hashPassword, verifyPassword, signToken, signRefreshToken, verifyRefreshToken } from "../utils/auth";
import { authMiddleware } from "../middlewares/auth";
import { success, error } from "../utils/response";

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

// Refresh token schema
const refreshSchema = z.object({
  refreshToken: z.string(),
});

// POST /auth/register
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  
  // Check if user exists
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return error(c, "Email already registered", 400);
  }
  
  // Create user
  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ email, password_hash: passwordHash, name });
  
  // Generate tokens
  const tokenPayload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = await signToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);
  
  return success(c, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    refreshToken,
  }, "Registration successful", 201);
});

// POST /auth/login
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  
  const user = await userRepo.findByEmail(email);
  if (!user) {
    return error(c, "Invalid credentials", 401);
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return error(c, "Invalid credentials", 401);
  }
  
  const tokenPayload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = await signToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);
  
  return success(c, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    refreshToken,
  }, "Login successful");
});

// POST /auth/refresh - Refresh access token
authRoutes.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");
  
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return error(c, "Invalid or expired refresh token", 401);
  }
  
  // Get user to ensure they still exist
  const user = await userRepo.findById(parseInt(payload.sub));
  if (!user) {
    return error(c, "User not found", 401);
  }
  
  // Generate new access token
  const newTokenPayload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = await signToken(newTokenPayload);
  
  return success(c, { token }, "Token refreshed successfully");
});

// GET /auth/me - Get current user
authRoutes.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  return success(c, { user }, "User retrieved successfully");
});

// GET /auth/users - List all users (for member selection)
authRoutes.get("/users", authMiddleware, async (c) => {
  const users = (await userRepo.findAll()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
  }));
  return success(c, { users }, "Users retrieved successfully");
});

export { authRoutes };
