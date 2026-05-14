const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, forgotPassword, resetPassword, logout } = require('../controllers/auth.controller');
const { firebaseLogin } = require('../controllers/firebase.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], validate, register);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], validate, login);

router.post('/firebase', body('idToken').notEmpty(), validate, firebaseLogin);

router.get('/me', protect, getMe);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), validate, resetPassword);
router.post('/logout', protect, logout);

module.exports = router;
