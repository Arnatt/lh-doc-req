const express = require('express');
const router = express.Router();
const { listAllRequest } = require('../controllers/admin');
const { adminCheck } = require('../middleware/authCheck');


router.get('/requests', adminCheck ,listAllRequest);

module.exports = router;