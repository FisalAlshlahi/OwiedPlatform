const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

// Get student results
router.get('/student/results', studentController.getResults);

module.exports = router;