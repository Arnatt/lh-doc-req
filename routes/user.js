const express = require('express');
const { getUserProfile, listRequest } = require('../controllers/user');
const { authCheck } = require('../middleware/authCheck');
const router = express.Router();

router.get('/user-info', authCheck, getUserProfile);
router.get('/user/requests/:count', authCheck, listRequest);

module.exports = router;