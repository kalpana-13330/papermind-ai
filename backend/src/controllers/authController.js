const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

// State tracking for GitHub OAuth CSRF protection (one-time nonces)
const activeOAuthStates = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of activeOAuthStates.entries()) {
    if (now > expiry) activeOAuthStates.delete(nonce);
  }
}, 10 * 60 * 1000).unref();

function getClientBaseUrl() {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return clientUrl.split(',')[0].trim().replace(/\/$/, '');
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest('An account with this email address already exists.');
  }

  // Create new user (pre-save hook hashes password)
  const user = await User.create({
    name,
    email,
    password,
  });

  const token = user.generateAuthToken();

  return ApiResponse.success(
    res,
    'User registered successfully',
    {
      user: user.toJSON(),
      token,
    },
    201
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = user.generateAuthToken();

  return ApiResponse.success(res, 'Login successful', {
    user: user.toJSON(),
    token,
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (JWT required)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authMiddleware
  return ApiResponse.success(res, 'User profile retrieved successfully', {
    user: req.user.toJSON(),
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token & email reset link
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const genericSuccessMessage =
    'If an account exists with this email address, a password reset link has been sent.';

  const user = await User.findOne({ email });

  // Prevent account enumeration: return same message if account is not found
  if (!user) {
    return ApiResponse.success(res, genericSuccessMessage);
  }

  // Generate crypto reset token & set expiration
  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  // Resolve frontend URL for the reset link
  const clientOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
    : ['http://localhost:5173'];
  const frontendUrl = clientOrigins[0];
  const resetUrl = `${frontendUrl}/reset-password.html?token=${resetToken}`;

  try {
    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken,
      resetUrl,
    });

    return ApiResponse.success(res, genericSuccessMessage);
  } catch (error) {
    // Invalidate token if email dispatch fails completely
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw ApiError.internal('Failed to dispatch password reset email. Please try again later.');
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash received raw token to compare against stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching active token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.');
  }

  // Update password and clear reset token fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Generate fresh token
  const newToken = user.generateAuthToken();

  return ApiResponse.success(res, 'Password has been successfully reset.', {
    user: user.toJSON(),
    token: newToken,
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (e.g. name)
 * @access  Private (JWT required)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    throw ApiError.badRequest('Name must be at least 2 characters long.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  user.name = name.trim();
  await user.save();

  return ApiResponse.success(res, 'Profile updated successfully', {
    user: user.toJSON(),
  });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private (JWT required)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required.');
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters long.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password does not match.');
  }

  user.password = newPassword;
  await user.save();

  const token = user.generateAuthToken();

  return ApiResponse.success(res, 'Password changed successfully', {
    user: user.toJSON(),
    token,
  });
});

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth web application flow with CSRF state
 * @access  Public
 */
const githubAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const clientBase = getClientBaseUrl();

  if (!clientId || clientId.includes('YOUR_GITHUB_CLIENT_ID')) {
    const errorMsg = encodeURIComponent('GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID in backend/.env.');
    return res.redirect(`${clientBase}/login.html?error=${errorMsg}`);
  }

  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';

  // Generate cryptographically secure one-time nonce and sign it
  const nonce = crypto.randomBytes(24).toString('hex');
  activeOAuthStates.set(nonce, Date.now() + 10 * 60 * 1000); // 10 minutes TTL

  const stateToken = jwt.sign(
    { nonce, type: 'github_oauth_state' },
    process.env.JWT_SECRET || 'ai_paper_summarizer_jwt_secret_fallback',
    { expiresIn: '10m' }
  );

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read:user%20user:email&state=${encodeURIComponent(
    stateToken
  )}`;

  // If request expects JSON (e.g. fetch from frontend)
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return ApiResponse.success(res, 'GitHub authorization URL generated', { url: authUrl });
  }

  // Otherwise direct browser redirect
  return res.redirect(authUrl);
});

/**
 * @route   GET /api/auth/github/callback
 * @desc    Handle GitHub OAuth callback, exchange code, retrieve verified identity, and issue JWT
 * @access  Public
 */
const githubCallback = asyncHandler(async (req, res) => {
  const clientBase = getClientBaseUrl();
  const { code, state, error, error_description } = req.query;

  // 1. Handle user cancellation or GitHub provider errors
  if (error) {
    const message = encodeURIComponent(error_description || error || 'GitHub authorization was denied.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  if (!code || !state) {
    const message = encodeURIComponent('Missing authorization code or state from GitHub.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  // 2. Validate one-time CSRF state token
  try {
    const decoded = jwt.verify(
      state,
      process.env.JWT_SECRET || 'ai_paper_summarizer_jwt_secret_fallback'
    );

    if (decoded.type !== 'github_oauth_state' || !activeOAuthStates.has(decoded.nonce)) {
      throw new Error('State token is invalid or has already been used.');
    }

    // Immediately consume nonce (strictly one-time use)
    activeOAuthStates.delete(decoded.nonce);
  } catch (err) {
    console.warn('[GitHub OAuth Security] State validation failed:', err.message);
    const message = encodeURIComponent('Security verification failed (invalid or expired OAuth state). Please try again.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  // 3. Verify server environment configuration
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';

  if (!clientId || !clientSecret || clientId.includes('YOUR_GITHUB_CLIENT_ID') || clientSecret.includes('YOUR_GITHUB_CLIENT_SECRET')) {
    const message = encodeURIComponent('GitHub OAuth credentials are not configured in backend/.env.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  // 4. Exchange authorization code for access token exclusively on backend
  let accessToken;
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      },
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PaperMind-AI',
        },
        timeout: 10000,
      }
    );

    if (tokenResponse.data.error) {
      throw new Error(tokenResponse.data.error_description || tokenResponse.data.error);
    }

    accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('No access token received from GitHub.');
    }
  } catch (tokenErr) {
    console.error('[GitHub OAuth Error] Token exchange failed:', tokenErr.message);
    const message = encodeURIComponent('Failed to exchange authorization code with GitHub.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  // 5. Retrieve authenticated GitHub user profile using official GitHub API
  let githubProfile;
  try {
    const profileResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PaperMind-AI',
        Accept: 'application/vnd.github+json',
      },
      timeout: 10000,
    });
    githubProfile = profileResponse.data;
  } catch (profileErr) {
    console.error('[GitHub OAuth Error] Profile retrieval failed:', profileErr.message);
    const message = encodeURIComponent('Failed to retrieve GitHub profile.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  if (!githubProfile || !githubProfile.id) {
    const message = encodeURIComponent('Invalid profile data received from GitHub.');
    return res.redirect(`${clientBase}/login.html?error=${message}`);
  }

  // Stable external identity key: numeric GitHub ID as string
  const stableGithubId = String(githubProfile.id);

  // 6. Obtain verified email from GitHub email endpoint
  let resolvedEmail = null;
  try {
    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PaperMind-AI',
        Accept: 'application/vnd.github+json',
      },
      timeout: 10000,
    });

    if (Array.isArray(emailsResponse.data)) {
      // Find primary and verified email
      const primaryVerified = emailsResponse.data.find((e) => e.verified && e.primary);
      if (primaryVerified) {
        resolvedEmail = primaryVerified.email;
      } else {
        // Any verified email
        const anyVerified = emailsResponse.data.find((e) => e.verified);
        if (anyVerified) {
          resolvedEmail = anyVerified.email;
        }
      }
    }
  } catch (emailErr) {
    console.warn('[GitHub OAuth Warning] Could not fetch private emails endpoint:', emailErr.message);
  }

  // If no email returned from emails endpoint, check profile email
  if (!resolvedEmail && githubProfile.email) {
    resolvedEmail = githubProfile.email;
  }

  // Fallback to standard GitHub noreply email format if user keeps email private
  if (!resolvedEmail) {
    resolvedEmail = `${githubProfile.id}+${githubProfile.login}@users.noreply.github.com`;
  }

  const normalizedEmail = resolvedEmail.trim().toLowerCase();

  // 7. Resolve user in MongoDB by stable GitHub ID
  let user = await User.findOne({ githubId: stableGithubId });

  if (!user) {
    // Check if an existing account is already registered with this email
    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });

    if (existingUserWithEmail) {
      // Strict security: Do not automatically merge accounts solely because emails match!
      console.warn(`[GitHub OAuth] Account collision: email ${normalizedEmail} already belongs to an existing account.`);
      const message = encodeURIComponent('An account with this email address already exists. Please sign in with your email and password.');
      return res.redirect(`${clientBase}/login.html?error=${message}`);
    }

    // Create new MongoDB user record
    user = await User.create({
      name: githubProfile.name || githubProfile.login || 'GitHub User',
      email: normalizedEmail,
      githubId: stableGithubId,
      githubUsername: githubProfile.login || null,
      avatar: githubProfile.avatar_url || null,
      authProvider: 'github',
    });
  } else {
    // Existing user: update avatar and username if changed
    let hasUpdates = false;
    if (githubProfile.avatar_url && user.avatar !== githubProfile.avatar_url) {
      user.avatar = githubProfile.avatar_url;
      hasUpdates = true;
    }
    if (githubProfile.login && user.githubUsername !== githubProfile.login) {
      user.githubUsername = githubProfile.login;
      hasUpdates = true;
    }
    if (hasUpdates) {
      await user.save({ validateBeforeSave: false });
    }
  }

  // 8. Issue standard application JWT
  const token = user.generateAuthToken();
  const safeUser = user.toJSON();

  // 9. Redirect to frontend OAuth callback with token and user details
  const redirectTarget = `${clientBase}/oauth-callback.html?token=${encodeURIComponent(
    token
  )}&user=${encodeURIComponent(JSON.stringify(safeUser))}`;

  return res.redirect(redirectTarget);
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  githubAuth,
  githubCallback,
};
