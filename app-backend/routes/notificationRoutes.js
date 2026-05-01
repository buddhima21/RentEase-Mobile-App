const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all notification routes require auth

router.get("/",               getMyNotifications);
router.get("/unread-count",   getUnreadCount);
router.put("/mark-all-read",  markAllRead);
router.put("/:id/read",       markAsRead);
router.delete("/:id",         deleteNotification);

module.exports = router;
