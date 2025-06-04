const pool = require('../models/db');

// Get detailed student results with multi-level breakdown
exports.getDetailedResults = async (req, res) => {
    const userId = req.user.id; // Assuming user ID is stored in the token

    try {
        // Get Core EPA level results
        const coreEpaResults = await pool.query(
            `
            SELECT ce.id, ce.name AS core_epa_name, ce.weight AS core_epa_weight,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY ce.id, ce.name, ce.weight
            ORDER BY ce.id
            `,
            [userId]
        );

        // Get Smaller EPA level results
        const smallerEpaResults = await pool.query(
            `
            SELECT se.id, se.name AS smaller_epa_name, se.weight AS smaller_epa_weight,
                   ce.id AS core_epa_id, ce.name AS core_epa_name,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY se.id, se.name, se.weight, ce.id, ce.name
            ORDER BY ce.id, se.id
            `,
            [userId]
        );

        // Get Activity level results
        const activityResults = await pool.query(
            `
            SELECT a.id, a.name AS activity_name, a.weight AS activity_weight,
                   se.id AS smaller_epa_id, se.name AS smaller_epa_name,
                   ce.id AS core_epa_id, ce.name AS core_epa_name,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY a.id, a.name, a.weight, se.id, se.name, ce.id, ce.name
            ORDER BY ce.id, se.id, a.id
            `,
            [userId]
        );

        // Get Behavior level results
        const behaviorResults = await pool.query(
            `
            SELECT b.id, b.description AS behavior_description,
                   a.id AS activity_id, a.name AS activity_name,
                   se.id AS smaller_epa_id, se.name AS smaller_epa_name,
                   ce.id AS core_epa_id, ce.name AS core_epa_name,
                   CASE WHEN e.is_met THEN true ELSE false END AS is_met,
                   e.evaluation_date,
                   e.rating,
                   e.comments
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            ORDER BY ce.id, se.id, a.id, b.id
            `,
            [userId]
        );

        // Get time-based progress data
        const progressOverTime = await pool.query(
            `
            SELECT 
                DATE_TRUNC('week', e.evaluation_date) AS week,
                ce.id AS core_epa_id,
                ce.name AS core_epa_name,
                COUNT(b.id) AS total_evaluated,
                SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS total_met
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY week, ce.id, ce.name
            ORDER BY week, ce.id
            `,
            [userId]
        );

        // Format the results into a hierarchical structure
        const formattedResults = {
            coreEpas: coreEpaResults.rows.map(core => ({
                id: core.id,
                name: core.core_epa_name,
                weight: parseFloat(core.core_epa_weight),
                percentageScore: Math.round((core.met_behaviors / core.total_behaviors) * 100) || 0,
                totalBehaviors: parseInt(core.total_behaviors),
                metBehaviors: parseInt(core.met_behaviors)
            })),
            smallerEpas: smallerEpaResults.rows.map(smaller => ({
                id: smaller.id,
                name: smaller.smaller_epa_name,
                weight: parseFloat(smaller.smaller_epa_weight),
                coreEpaId: smaller.core_epa_id,
                coreEpaName: smaller.core_epa_name,
                percentageScore: Math.round((smaller.met_behaviors / smaller.total_behaviors) * 100) || 0,
                totalBehaviors: parseInt(smaller.total_behaviors),
                metBehaviors: parseInt(smaller.met_behaviors)
            })),
            activities: activityResults.rows.map(activity => ({
                id: activity.id,
                name: activity.activity_name,
                weight: parseFloat(activity.activity_weight),
                smallerEpaId: activity.smaller_epa_id,
                smallerEpaName: activity.smaller_epa_name,
                coreEpaId: activity.core_epa_id,
                coreEpaName: activity.core_epa_name,
                percentageScore: Math.round((activity.met_behaviors / activity.total_behaviors) * 100) || 0,
                totalBehaviors: parseInt(activity.total_behaviors),
                metBehaviors: parseInt(activity.met_behaviors)
            })),
            behaviors: behaviorResults.rows.map(behavior => ({
                id: behavior.id,
                description: behavior.behavior_description,
                activityId: behavior.activity_id,
                activityName: behavior.activity_name,
                smallerEpaId: behavior.smaller_epa_id,
                smallerEpaName: behavior.smaller_epa_name,
                coreEpaId: behavior.core_epa_id,
                coreEpaName: behavior.core_epa_name,
                isMet: behavior.is_met,
                evaluationDate: behavior.evaluation_date,
                rating: behavior.rating || null,
                comments: behavior.comments || null
            })),
            progressOverTime: progressOverTime.rows.map(progress => ({
                week: progress.week,
                coreEpaId: progress.core_epa_id,
                coreEpaName: progress.core_epa_name,
                percentageScore: Math.round((progress.total_met / progress.total_evaluated) * 100) || 0,
                totalEvaluated: parseInt(progress.total_evaluated),
                totalMet: parseInt(progress.total_met)
            }))
        };

        // Add strength/weakness analysis
        const strengthsAndWeaknesses = analyzeStrengthsAndWeaknesses(formattedResults);
        formattedResults.analysis = strengthsAndWeaknesses;

        res.json(formattedResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Keep the original simple method for backward compatibility
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
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY ce.name
            `,
            [userId]
        );

        const formattedResults = results.rows.map((row) => ({
            coreEpaName: row.coreepaname,
            percentageScore: Math.round((row.metbehaviors / row.totalbehaviors) * 100) || 0,
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get recommendations for student improvement
exports.getRecommendations = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get activities with lowest completion rates
        const weakestActivities = await pool.query(
            `
            SELECT a.id, a.name AS activity_name, 
                   se.name AS smaller_epa_name,
                   ce.name AS core_epa_name,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors,
                   (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(b.id)) AS completion_rate
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY a.id, a.name, se.name, ce.name
            ORDER BY completion_rate ASC
            LIMIT 5
            `,
            [userId]
        );

        // Get behaviors that need improvement
        const behaviorsToImprove = await pool.query(
            `
            SELECT b.id, b.description, 
                   a.name AS activity_name,
                   se.name AS smaller_epa_name,
                   ce.name AS core_epa_name,
                   e.is_met,
                   e.rating,
                   e.comments
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1 AND (e.is_met = false OR e.rating < 3)
            ORDER BY e.rating ASC NULLS FIRST, e.evaluation_date DESC
            LIMIT 10
            `,
            [userId]
        );

        const recommendations = {
            weakestActivities: weakestActivities.rows.map(activity => ({
                id: activity.id,
                activityName: activity.activity_name,
                smallerEpaName: activity.smaller_epa_name,
                coreEpaName: activity.core_epa_name,
                completionRate: Math.round((activity.met_behaviors / activity.total_behaviors) * 100) || 0,
                recommendation: generateRecommendation(activity.activity_name, activity.completion_rate)
            })),
            behaviorsToImprove: behaviorsToImprove.rows.map(behavior => ({
                id: behavior.id,
                description: behavior.description,
                activityName: behavior.activity_name,
                smallerEpaName: behavior.smaller_epa_name,
                coreEpaName: behavior.core_epa_name,
                isMet: behavior.is_met,
                rating: behavior.rating,
                supervisorComments: behavior.comments,
                improvementTips: generateBehaviorTips(behavior.description)
            }))
        };

        res.json(recommendations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Get achievement badges for the student
exports.getAchievements = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get Core EPAs with high completion rates
        const masteredCoreEpas = await pool.query(
            `
            SELECT ce.id, ce.name,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors,
                   (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(b.id)) AS completion_rate
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY ce.id, ce.name
            HAVING (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(b.id)) >= 0.9
            `,
            [userId]
        );

        // Get Smaller EPAs with high completion rates
        const masteredSmallerEpas = await pool.query(
            `
            SELECT se.id, se.name, ce.name AS core_epa_name,
                   COUNT(b.id) AS total_behaviors, 
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_behaviors,
                   (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(b.id)) AS completion_rate
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1
            GROUP BY se.id, se.name, ce.name
            HAVING (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(b.id)) >= 0.9
            `,
            [userId]
        );

        // Get recent improvements
        const recentImprovements = await pool.query(
            `
            SELECT ce.name AS core_epa_name,
                   COUNT(e.id) AS evaluations_count,
                   SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END) AS met_count
            FROM Students s
            JOIN Evaluations e ON s.id = e.student_id
            JOIN Behaviors b ON e.behavior_id = b.id
            JOIN Activities a ON b.activity_id = a.id
            JOIN SmallerEPAs se ON a.smaller_epa_id = se.id
            JOIN CoreEPAs ce ON se.core_epa_id = ce.id
            WHERE s.user_id = $1 AND e.evaluation_date >= NOW() - INTERVAL '30 days'
            GROUP BY ce.name
            HAVING COUNT(e.id) > 0 AND (SUM(CASE WHEN e.is_met THEN 1 ELSE 0 END)::float / COUNT(e.id)) >= 0.7
            `,
            [userId]
        );

        const achievements = {
            badges: [
                ...masteredCoreEpas.rows.map(epa => ({
                    type: 'core_epa_mastery',
                    title: `إتقان ${epa.name}`,
                    description: `أتقنت ${Math.round(epa.completion_rate * 100)}% من سلوكيات ${epa.name}`,
                    level: 'gold'
                })),
                ...masteredSmallerEpas.rows.map(epa => ({
                    type: 'smaller_epa_mastery',
                    title: `إتقان ${epa.name}`,
                    description: `أتقنت ${Math.round(epa.completion_rate * 100)}% من سلوكيات ${epa.name} ضمن ${epa.core_epa_name}`,
                    level: 'silver'
                })),
                ...recentImprovements.rows.map(improvement => ({
                    type: 'recent_improvement',
                    title: `تحسن في ${improvement.core_epa_name}`,
                    description: `أظهرت تحسناً ملحوظاً في ${improvement.core_epa_name} خلال الـ 30 يوماً الماضية`,
                    level: 'bronze'
                }))
            ],
            stats: {
                totalBadges: masteredCoreEpas.rowCount + masteredSmallerEpas.rowCount + recentImprovements.rowCount,
                goldBadges: masteredCoreEpas.rowCount,
                silverBadges: masteredSmallerEpas.rowCount,
                bronzeBadges: recentImprovements.rowCount
            }
        };

        res.json(achievements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// Helper function to analyze strengths and weaknesses
function analyzeStrengthsAndWeaknesses(results) {
    // Find top 3 strongest and weakest smaller EPAs
    const smallerEpas = [...results.smallerEpas];
    
    // Sort by percentage score
    smallerEpas.sort((a, b) => b.percentageScore - a.percentageScore);
    
    const strengths = smallerEpas.slice(0, 3).map(epa => ({
        id: epa.id,
        name: epa.name,
        coreEpaName: epa.coreEpaName,
        percentageScore: epa.percentageScore
    }));
    
    const weaknesses = smallerEpas.slice(-3).reverse().map(epa => ({
        id: epa.id,
        name: epa.name,
        coreEpaName: epa.coreEpaName,
        percentageScore: epa.percentageScore
    }));
    
    return {
        strengths,
        weaknesses
    };
}

// Helper function to generate recommendations based on activity
function generateRecommendation(activityName, completionRate) {
    if (completionRate < 0.3) {
        return `يُنصح بالتركيز بشكل كبير على تحسين مهارات "${activityName}" من خلال التدريب العملي المكثف والمراجعة المنتظمة مع المشرف.`;
    } else if (completionRate < 0.6) {
        return `يُنصح بمزيد من الممارسة في "${activityName}" مع التركيز على النقاط التي تم تحديدها كنقاط ضعف.`;
    } else {
        return `أنت تتقدم بشكل جيد في "${activityName}"، استمر في الممارسة للوصول إلى مستوى الإتقان الكامل.`;
    }
}

// Helper function to generate behavior improvement tips
function generateBehaviorTips(behaviorDescription) {
    // This would ideally be more sophisticated, perhaps using a database of tips
    // or even AI-generated recommendations, but for now we'll use a simple approach
    return `للتحسين في "${behaviorDescription}"، يُنصح بمراجعة المواد التدريبية ذات الصلة وطلب تغذية راجعة إضافية من المشرف.`;
}
