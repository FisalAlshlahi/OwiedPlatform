const pool = require('../models/db');

// Get student results
exports.getResults = async (req, res) => {
    const userId = req.user.id; // Assuming user ID is stored in the token

    try {
        const results = await pool.query(
            `
            SELECT ce.name AS coreEpaName, 
                   COUNT(b.id) AS totalBehaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS metBehaviors
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN CoreEPAs ce ON a.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY ce.name
            `,
            [userId]
        );

        const formattedResults = results.rows.map((row) => ({
            coreEpaName: row.coreepaname,
            percentageScore: Math.round((row.metbehaviors / row.totalbehaviors) * 100),
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};
