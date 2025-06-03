// backend/controllers/utils/scoreCalculator.js

function calculateActivityScore(activity) {
    const totalBehaviors = activity.behaviors.length;
    const metBehaviors = activity.behaviors.filter((behavior) => behavior.met).length;
    return ((metBehaviors / totalBehaviors) * activity.weight).toFixed(2);
}

function calculateSmallerEPAScore(smallerEpa) {
    let score = 0;
    smallerEpa.activities.forEach((activity) => {
        score += parseFloat(calculateActivityScore(activity));
    });
    return score.toFixed(2);
}

function calculateCoreEPAScore(coreEpa) {
    let score = 0;
    coreEpa.smallerEPAs.forEach((smallerEpa) => {
        score += parseFloat(calculateSmallerEPAScore(smallerEpa));
    });
    return score.toFixed(2);
}

module.exports = {
    calculateActivityScore,
    calculateSmallerEPAScore,
    calculateCoreEPAScore
};
