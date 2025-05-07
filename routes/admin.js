const express = require('express');
const router = express.Router();
const { listAllRequest, readRequest, updateRequest } = require('../controllers/admin');
const { adminCheck } = require('../middleware/authCheck');


router.get('/requests', adminCheck ,listAllRequest);
router.get('/request/:id', adminCheck, readRequest);
router.put('/requests/:id', adminCheck, updateRequest)

module.exports = router;