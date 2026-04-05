const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile } = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);

// === TESTING ROUTES FOR ROLE AUTHORIZATION ===
router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Welcome Admin! You have special access." });
});

router.get("/owner-or-admin", protect, authorizeRoles("owner", "admin"), (req, res) => {
  res.json({ message: "Welcome! Owner or Admin access granted." });
});

module.exports = router;
