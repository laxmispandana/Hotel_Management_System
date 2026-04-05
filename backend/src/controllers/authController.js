const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

const jwtSecret = process.env.JWT_SECRET || "dev_secret";

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await userService.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await userService.createUser({
      name,
      email,
      password,
      role: "customer",
    });

    const token = jwt.sign(user, jwtSecret, { expiresIn: "4h" });
    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }
    const user = await userService.authenticate(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(user, jwtSecret, { expiresIn: "4h" });
    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  signup,
  login,
  me,
};
