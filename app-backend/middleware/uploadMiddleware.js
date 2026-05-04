const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/signatures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `sig-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for signatures"), false);
  }
};

const uploadSignature = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { uploadSignature };
