require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Registration failed', details: error });
  }
});

router.get('/users', async (req, res) => {
  const { id } = req.query; // Access query parameter instead of body
  console.log(id);
  try {
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to fetch users', details: error });
  }
});

router.get('/user', async (req, res) => {
  try {
    // Extract the JWT token from the request headers
    const token = req.headers.authorization.split(' ')[1];
    
    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract the user ID from the decoded token
    const userId = decodedToken.id;
    console.log(userId);
    // Fetch the user data from the database
    const user = await User.findById(userId);
     // Access query parameter instead of body
  
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to fetch users', details: error });
  }
});
// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: 'Invalid email or password' });
    }
    

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION} );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour in milliseconds
      secure: process.env.NODE_ENV === 'production', // Enable only in production
      sameSite: 'strict' // Adjust according to your requirements
    });
    
    res.status(200).send({ token , email: user.email, username: user.username  , _id: user._id});
  } catch (error) {
    res.status(500).send({ error: 'Login failed', details: error });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: '771373002@smtp-brevo.com',
        pass: 'PNLcB80A3TmyO41E'
      }
    });

    const mailOptions = {
      to: user.email,
      from: 'akshatjain481@gmail.com',
      subject: 'Password Reset OTP',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
             Your OTP for resetting the password is: ${otp}\n\n
             This OTP will expire in 5 minutes.\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        return res.status(500).send({ error: 'Failed to send password reset email' , message: err});
      }
      console.log(mailOptions);
      res.status(200).send({ message: 'Password reset OTP sent successfully' });
    });
  } catch (error) {
    res.status(500).send({ error: 'Failed to send password reset email', details: error });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).send({ error: 'Invalid OTP' });
    }

    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).send({ error: 'OTP has expired' });
    }

    user.password = newPassword; // Hash the password before saving in production
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to reset password', details: error });
  }
});


module.exports = router;
