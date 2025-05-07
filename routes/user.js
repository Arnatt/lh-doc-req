const express = require('express');
const { getUserProfile, listRequest, updateUserProfile, submitRequest, cancelRequest } = require('../controllers/user');
const { authCheck } = require('../middleware/authCheck');
const router = express.Router();

router.get('/user-info', authCheck, getUserProfile);
router.get('/user/requests/:count', authCheck, listRequest);
router.put('/update-info', authCheck, updateUserProfile);
router.post('/submit-request', authCheck, submitRequest);
router.put('/cancelRequest/:id', authCheck, cancelRequest);

module.exports = router;