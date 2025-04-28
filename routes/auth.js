const express = require('express');
const router = express.Router();

const { login, loginAdmin, currentUser, currentAdmin, } = require('../controllers/auth');
const { authCheck, adminCheck } = require('../middleware/authCheck');


router.post('/login', login);
router.post('/login-admin', loginAdmin);
router.get('/current-user', authCheck, currentUser);
router.get('/current-admin', adminCheck, currentAdmin);


module.exports = router;