const express = require('express');
const supervisorController = require('../controllers/supervisorController');
const authenticateToken = require('../middleware/authMiddleware'); // Assuming you have auth middleware

const router = express.Router();

// Get list of students
router.get('/supervisor/students', authenticateToken, supervisorController.getStudents);

// Get evaluations for a student
router.get('/supervisor/evaluations/:studentId', authenticateToken, supervisorController.getEvaluations);

// Submit evaluation
router.post('/supervisor/evaluate', authenticateToken, supervisorController.submitEvaluation);

module.exports = router;
