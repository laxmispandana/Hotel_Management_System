const bcrypt = require("bcryptjs");
const { pool } = require("../db");

const SALT_ROUNDS = 10;

async function getUserByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0];
}

async function createUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

async function authenticate(email, password) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function ensureDefaultUsers() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) {
    return;
  }

  const defaults = [
    {
      name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@hotel.local",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
    },
    {
      name: "Front Desk",
      email: process.env.STAFF_EMAIL || "staff@hotel.local",
      password: process.env.STAFF_PASSWORD || "Staff@123",
      role: "staff",
    },
    {
      name: "Guest",
      email: process.env.CUSTOMER_EMAIL || "guest@hotel.local",
      password: process.env.CUSTOMER_PASSWORD || "Guest@123",
      role: "customer",
    },
  ];

  for (const user of defaults) {
    await createUser(user);
  }
}

module.exports = {
  createUser,
  authenticate,
  getUserByEmail,
  ensureDefaultUsers,
};
