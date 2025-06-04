const pool = require('../models/db');

// Get list of students supervised by the current supervisor
exports.getStudents = async (req, res) => {
    const userId = req.user.id; // Assuming user ID is stored in the token

    try {
        const students = await pool.query(
            `
            SELECT s.id, u.name, u.email,
                   (SELECT COUNT(*) FROM Evaluations e WHERE e.student_id = s.id) AS evaluations_count,
                   (SELECT COUNT(*) FROM Evaluations e WHERE e.student_id = s.id AND e.is_met = true) AS met_count
            FROM Students s
            JOIN Users u ON s.user_id = u.id
            WHERE s.supervisor_id = $1
            ORDER BY u.name
            `,
            [userId]
        );

        const formattedStudents = students.rows.map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            evaluationsCount: parseInt(student.evaluations_count) || 0,
            metCount: parseInt(student.met_count) || 0,
            progressPercentage: student.evaluations_count > 0 
                ? Math.round((student.met_count / student.evaluations_count) * 100) 
                : 0
        }));

        res.json(formattedStudents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get evaluations for a specific student
exports.getEvaluations = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Get behaviors that haven't been evaluated yet
        const pendingBehaviors = await pool.query(
            `
            SELECT b.id, b.description, 
                   a.id AS activity_id, a.name AS activity_name,
                   se.id AS smaller_epa_id, se.name AS smaller_epa_name,
                   ce.id AS core_epa_id, ce.name AS core_epa_name
            FROM Behaviors b
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE b.id NOT IN (
                SELECT behavior_id 
                FROM Evaluations 
                WHERE student_id = $1
            )
            ORDER BY ce.id, se.id, a.id, b.id
            `,
            [studentId]
        );

        // Get already evaluated behaviors
        const evaluatedBehaviors = await pool.query(
            `
            SELECT b.id, b.description, 
                   a.id AS activity_id, a.name AS activity_name,
                   se.id AS smaller_epa_id, se.name AS smaller_epa_name,
                   ce.id AS core_epa_id, ce.name AS core_epa_name,
                   e.is_met, e.rating, e.comments, e.evaluation_date
            FROM Evaluations e
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE e.student_id = $1
            ORDER BY e.evaluation_date DESC, ce.id, se.id, a.id, b.id
            `,
            [studentId]
        );

        // Get student progress summary
        const progressSummary = await pool.query(
            `
            SELECT ce.id, ce.name AS core_epa_name,
                   COUNT(b.id) AS total_behaviors,
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors,
                   AVG(e.rating) AS avg_rating
            FROM CoreEPAs ce
            JOIN SmallerEPAs se ON se.core_epa_id = ce.id
            JOIN Activities a ON a.smaller_epa_id = se.id
            JOIN Behaviors b ON b.activity_id = a.id
            LEFT JOIN Evaluations e ON e.behavior_id = b.id AND e.student_id = $1
            GROUP BY ce.id, ce.name
            ORDER BY ce.id
            `,
            [studentId]
        );

        const result = {
            pendingBehaviors: pendingBehaviors.rows.map(behavior => ({
                id: behavior.id,
                description: behavior.description,
                activityId: behavior.activity_id,
                activityName: behavior.activity_name,
                smallerEpaId: behavior.smaller_epa_id,
                smallerEpaName: behavior.smaller_epa_name,
                coreEpaId: behavior.core_epa_id,
                coreEpaName: behavior.core_epa_name
            })),
            evaluatedBehaviors: evaluatedBehaviors.rows.map(behavior => ({
                id: behavior.id,
                description: behavior.description,
                activityId: behavior.activity_id,
                activityName: behavior.activity_name,
                smallerEpaId: behavior.smaller_epa_id,
                smallerEpaName: behavior.smaller_epa_name,
                coreEpaId: behavior.core_epa_id,
                coreEpaName: behavior.core_epa_name,
                isMet: behavior.is_met,
                rating: behavior.rating,
                comments: behavior.comments,
                evaluationDate: behavior.evaluation_date
            })),
            progressSummary: progressSummary.rows.map(summary => ({
                coreEpaId: summary.id,
                coreEpaName: summary.core_epa_name,
                totalBehaviors: parseInt(summary.total_behaviors),
                metBehaviors: parseInt(summary.met_behaviors) || 0,
                progressPercentage: summary.total_behaviors > 0 
                    ? Math.round((summary.met_behaviors / summary.total_behaviors) * 100) 
                    : 0,
                averageRating: summary.avg_rating ? parseFloat(summary.avg_rating).toFixed(1) : null
            }))
        };

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Submit evaluation with enhanced data
exports.submitEvaluation = async (req, res) => {
    const { studentId, behaviorId, isMet, rating, comments } = req.body;

    try {
        // Validate rating is between 1-5 if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });
        }

        await pool.query(
            `
            INSERT INTO Evaluations (student_id, behavior_id, is_met, rating, comments, evaluation_date)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (student_id, behavior_id) 
            DO UPDATE SET 
                is_met = $3, 
                rating = $4, 
                comments = $5, 
                evaluation_date = CURRENT_TIMESTAMP
            `,
            [studentId, behaviorId, isMet, rating, comments]
        );

        res.json({ message: 'تم حفظ التقييم بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get student progress over time
exports.getStudentProgressOverTime = async (req, res) => {
    const { studentId } = req.params;
    const { timeframe } = req.query; // 'week', 'month', or 'all'

    try {
        let timeInterval;
        switch (timeframe) {
            case 'week':
                timeInterval = "day";
                break;
            case 'month':
                timeInterval = "week";
                break;
            default:
                timeInterval = "month";
        }

        const progressData = await pool.query(
            `
            SELECT 
                DATE_TRUNC($1, e.evaluation_date) AS time_period,
                COUNT(e.id) AS evaluations_count,
                SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_count,
                AVG(e.rating) AS avg_rating
            FROM Evaluations e
            WHERE e.student_id = $2
            GROUP BY time_period
            ORDER BY time_period
            `,
            [timeInterval, studentId]
        );

        const result = progressData.rows.map(row => ({
            timePeriod: row.time_period,
            evaluationsCount: parseInt(row.evaluations_count),
            metCount: parseInt(row.met_count),
            progressPercentage: Math.round((row.met_count / row.evaluations_count) * 100),
            averageRating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Add comments or notes about a student
exports.addStudentNote = async (req, res) => {
    const { studentId, note, category } = req.body;
    const supervisorId = req.user.id;

    try {
        await pool.query(
            `
            INSERT INTO StudentNotes (student_id, supervisor_id, note, category, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            `,
            [studentId, supervisorId, note, category]
        );

        res.json({ message: 'تمت إضافة الملاحظة بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get notes about a student
exports.getStudentNotes = async (req, res) => {
    const { studentId } = req.params;

    try {
        const notes = await pool.query(
            `
            SELECT n.id, n.note, n.category, n.created_at,
                   u.name AS supervisor_name
            FROM StudentNotes n
            JOIN Users u ON n.supervisor_id = u.id
            WHERE n.student_id = $1
            ORDER BY n.created_at DESC
            `,
            [studentId]
        );

        res.json(notes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};
