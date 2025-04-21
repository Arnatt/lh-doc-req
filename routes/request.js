const express = require('express');
const router = express.Router();
const { createRequest, listRequest, deleteRequest, readRequest } = require('../controllers/request');
const { authCheck } = require('../middleware/authCheck')


router.post('/request-document', authCheck, createRequest);
router.get('request-documents/:count', authCheck, listRequest)
router.get('/request-document/:req_id', authCheck, readRequest);
router.delete('/request-document/:req_id', authCheck, deleteRequest);



module.exports = router;

