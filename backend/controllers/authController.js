const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  preferredLanguage: user.preferredLanguage,
  location: user.location,
  skills: user.skills,
  bio: user.bio,
  availability: user.availability,
  isOnboarded: user.isOnboarded
});

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Secure cookie in non-development envs
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, preferredLanguage, location } = req.body;

    if (!phone || !password || !location || location.longitude === undefined || location.latitude === undefined) {
      return res.status(400).json({ message: 'Phone, password, and location are required for signup' });
    }

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    const normalizedEmail = email?.trim().toLowerCase() || undefined;

    if (normalizedEmail) {
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists) {
        return res.status(400).json({ message: 'An account already exists with this email.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      phone,
      password: hashedPassword,
      role,
      preferredLanguage: preferredLanguage || 'en',
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      },
      // Customers don't need onboarding, providers do
      isOnboarded: role === 'customer' ? true : false
    };

    if (normalizedEmail) {
      userData.email = normalizedEmail;
    }

    // Create user
    const user = await User.create(userData);

      if (user) {
      generateToken(res, user._id);
      res.status(201).json(formatUserResponse(user));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account already exists with this email.' });
    }
    console.error('Signup error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token in cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      generateToken(res, user._id);
      res.status(200).json(formatUserResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public (destroys active token cookie)
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.status(200).json(formatUserResponse(user));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user with Google ID token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not configured');
      return res.status(500).json({ message: 'Google Sign-In is not configured' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid Google credential' });
    }

    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account does not have an email address' });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // New Google user - ask frontend to collect role before account creation
      if (!role) {
        return res.status(200).json({
          status: 'new_user',
          email: normalizedEmail,
          name: name || '',
          message: 'Please select your role (provider or customer)'
        });
      }

      // Create new account with selected role
      user = await User.create({
        googleId,
        email: normalizedEmail,
        name: name || 'User',
        phone: `GOOGLE_${googleId.substring(0, 10)}`, // Temporary phone for Google users
        role: role || 'provider',
        preferredLanguage: 'en',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Default to Delhi
        },
        isOnboarded: false // New users need onboarding
      });
    } else {
      // Existing user
      if (user.googleId && user.googleId !== googleId) {
        return res.status(409).json({ message: 'This email is linked to a different Google account' });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    generateToken(res, user._id);
    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this Google email already exists' });
    }
    console.error('Google login error:', error.message);
    res.status(500).json({ message: 'Google Sign-In failed. Please try again.' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    // Mock sending OTP
    res.status(200).json({ message: 'OTP sent successfully (mocked)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role, name, age, category } = req.body;
    
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    let user = await User.findOne({ phone });

    if (user) {
      // Returning user - don't need to update onboarding status
      generateToken(res, user._id);
    } else {
      // New user - create with isOnboarded = false so they go through onboarding
      user = await User.create({
        phone,
        role: role || 'provider',
        name: name || 'User',
        age,
        category,
        location: {
          type: 'Point',
          coordinates: [77.59, 12.97] // mock location
        },
        isOnboarded: false // New users must complete onboarding
      });
      generateToken(res, user._id);
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  sendOtp,
  verifyOtp
};
