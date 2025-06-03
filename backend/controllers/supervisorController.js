const pool = require('../models/db');

// Get list of students supervised by the current supervisor
exports.getStudents = async (req, res) => {
    const userId = req.user.id; // Assuming user ID is stored in the token

    try {
        const students = await pool.query(
            `
            SELECT s.id, u.name 
            FROM Students s
            JOIN Users u ON s.user_id = u.id
            WHERE s.supervisor_id = $1
            `,
            [userId]
        );

        res.json(students.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get evaluations for a specific student
exports.getEvaluations = async (req, res) => {
    const { studentId } = req.params;

    try {
        const evaluations = await pool.query(
            `
            SELECT b.id, b.description 
            FROM Behaviors b
            JOIN Activities a ON b.activity_id = a.id
            JOIN CoreEPAs ce ON a.core_epa_id = ce.id
            WHERE b.id NOT IN (
                SELECT behavior_id 
                FROM Evaluations 
                WHERE student_id = $1
            )
            `,
            [studentId]
        );

        res.json(evaluations.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Submit evaluation
exports.submitEvaluation = async (req, res) => {
    const { studentId, behaviorId, isMet } = req.body;

    try {
        await pool.query(
            `
            INSERT INTO Evaluations (student_id, behavior_id, is_met)
            VALUES ($1, $2, $3)
            `,
            [studentId, behaviorId, isMet]
        );

        res.json({ message: 'تم حفظ التقييم بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};
