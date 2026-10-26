const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    // Password is optional for OAuth (GitHub) users who have no local password
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
      default: null,
    },
    // GitHub OAuth fields
    githubId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    githubUsername: {
      type: String,
      default: null,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'github'],
      default: 'local',
    },
    avatar: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified — skip for OAuth users with no password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plaintext candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || 'ai_paper_summarizer_jwt_secret_fallback';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
    },
    secret,
    { expiresIn }
  );
};

// Generate crypto reset token, hash it for storage, set expiration, return raw token
userSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version of token to protect against DB leaks
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expireMinutes = parseInt(process.env.RESET_PASSWORD_EXPIRE_MINUTES, 10) || 60;
  this.resetPasswordExpires = new Date(Date.now() + expireMinutes * 60 * 1000);

  return rawToken;
};

// Sanitize user object for JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.githubId;
  delete obj.googleId;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
