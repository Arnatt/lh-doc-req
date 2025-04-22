const express = require('express');
const router = express.Router();

const { login, loginAdmin, currentUser, registerAdmin } = require('../controllers/auth');


router.post('/login', login);
router.post('/register', registerAdmin)
router.post('/login-admin', loginAdmin);
router.post('/current-user', currentUser);
router.post('/current-admin', currentUser);


module.exports = router;