import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const LOGIN_PASSWORD = process.env.PASSWORD!;

export function status(req: Request, res: Response) {
  const token = req.cookies.token;
  
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.json({ authenticated: true });
    } catch {
      res.clearCookie("token");
    }
  }
  
  return res.json({ authenticated: false });
}

export function login(req: Request, res: Response) {
  const { password } = req.body;

  if (password !== LOGIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({}, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: "Login successful" });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
}
