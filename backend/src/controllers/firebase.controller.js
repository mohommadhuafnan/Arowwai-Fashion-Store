const User = require('../models/User.model');
const Branch = require('../models/Branch.model');
const { verifyFirebaseToken } = require('../config/firebase');
const { generateToken, generateRefreshToken } = require('../utils/helpers');

const mapProvider = (firebaseUser) => {
  const provider = firebaseUser.firebase?.sign_in_provider || 'password';
  if (provider.includes('google')) return 'google';
  if (provider.includes('github')) return 'github';
  return 'email';
};

const splitName = (displayName, email) => {
  const name = displayName || email?.split('@')[0] || 'User';
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || 'User' };
};

const firebaseLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token required' });
  }

  let decoded;
  try {
    decoded = await verifyFirebaseToken(idToken);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid Firebase token', detail: error.message });
  }

  const { uid, email, name, picture } = decoded;
  const { firstName, lastName } = splitName(name, email);
  const authProvider = mapProvider(decoded);

  let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });

  const defaultBranch = await Branch.findOne({ code: 'MAIN' });

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      firstName,
      lastName,
      email: email || `${uid}@firebase.local`,
      authProvider,
      avatar: picture,
      role: 'shop_owner',
      branch: defaultBranch?._id,
      password: require('crypto').randomBytes(32).toString('hex'),
    });
  } else {
    user.firebaseUid = uid;
    user.lastLogin = new Date();
    if (picture && !user.avatar) user.avatar = picture;
    if (authProvider !== 'email') user.authProvider = authProvider;
    await user.save();
  }

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  const populated = await User.findById(user._id).populate('branch', 'name code');

  res.json({
    success: true,
    data: {
      user: {
        id: populated._id,
        firstName: populated.firstName,
        lastName: populated.lastName,
        email: populated.email,
        role: populated.role,
        branch: populated.branch,
        avatar: populated.avatar,
        authProvider: populated.authProvider,
      },
      token,
      refreshToken,
    },
  });
};

module.exports = { firebaseLogin };
