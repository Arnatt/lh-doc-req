const express = require('express');
const { getUserProfile } = require('../controllers/user');
const { authCheck } = require('../middleware/authCheck');
const router = express.Router();


router.get('/user-info', authCheck, getUserProfile)

module.exports = router;