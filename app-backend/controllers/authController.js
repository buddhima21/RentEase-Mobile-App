const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "tenant",
      phone,
    });

    if (user) {
      // 4. Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Check for user email
    const user = await User.findOne({ email }).select("+password"); // Need to explicitly select password since it has select: false

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2.5 Validate role if provided
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `This account is registered as "${user.role}". Please select the correct role to continue.`,
      });
    }

    // 3. Generate token and return user data
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      // Update fields if provided in request body, otherwise retain existing
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      // Ensure password is hashed if being updated
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("UpdateProfile Error:", error.message);
    // Handle unique constraint duplicate email error gracefully
    if (error.code === 11000) {
       return res.status(400).json({ message: "Email is already in use" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
