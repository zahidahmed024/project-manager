import { createMiddleware } from "hono/factory";
import { verifyToken, type JWTPayload } from "../utils/auth";
import { userRepo } from "../repositories/user.repo";

// Extend Hono context with user
declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: number;
      email: string;
      name: string;
      role: "admin" | "member";
    };
    jwtPayload: JWTPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  
  const user = await userRepo.findById(parseInt(payload.sub));
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  c.set("jwtPayload", payload);
  c.set("user", {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  
  await next();
});
