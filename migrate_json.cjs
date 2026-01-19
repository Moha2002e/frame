const fs = require('fs');
const questionsPath = './src/assets/questions.json';

try {
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    questions.forEach(q => {
        // Convert existing integer correctAnswer to array if not already
        if (typeof q.correctAnswer === 'number') {
            q.correctAnswers = [q.correctAnswer];
            delete q.correctAnswer;
        } else if (!q.correctAnswers) {
            // If answer was missing or null
            q.correctAnswers = [];
        }
    });

    // Apply specific Q1-Q10 updates (indexes 0-9)
    // Q1: 1
    // Q2: 3
    // Q3: 3
    // Q4: 3
    // Q5: 2
    // Q6: 0
    // Q7: 3 (Because option 3 is "Toutes les propositions")
    // Q8: 3
    // Q9: 0
    // Q10: 0, 1, 2 (NoSQL is index 3)

    const updates = {
        1: [1],
        2: [3],
        3: [3],
        4: [3],
        5: [2],
        6: [0],
        7: [3],
        8: [3],
        9: [0],
        10: [0, 1, 2]
    };

    for (const [id, answers] of Object.entries(updates)) {
        const q = questions.find(x => x.id === parseInt(id));
        if (q) {
            q.correctAnswers = answers;
        }
    }

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log("Converted to correctAnswers array and updated Q1-10.");

} catch (err) {
    console.error(err);
}
