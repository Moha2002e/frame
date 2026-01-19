const fs = require('fs');

const questionsPath = './src/assets/questions.json';
const answersPath = './reponse.txt';

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[.,…:;?()"']/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

try {
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    const content = fs.readFileSync(answersPath, 'utf8');
    // Filter non-empty lines
    const answerLines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    console.log(`Found ${answerLines.length} answer lines for ${questions.length} questions.`);

    let updates = 0;

    questions.forEach((q, idx) => {
        if (idx >= answerLines.length) {
            console.warn(`No answer line found for Q${q.id} (Index ${idx})`);
            return;
        }

        const ansLine = answerLines[idx];
        const normAns = normalize(ansLine);

        // Find best option match
        let bestOptIdx = -1;
        let bestScore = 0;

        q.options.forEach((opt, optIdx) => {
            const normOpt = normalize(opt);

            // Check for inclusion
            // If the answer line is a substring of the option OR the option is a substring of the answer line
            // Use length of the shorter string as score base, or just 1.0 for perfect inclusion

            if (normOpt.includes(normAns) || normAns.includes(normOpt)) {
                // If the answer line is very short (e.g. "VRAI"), verify exactness or use context?
                // But inclusion is usually good enough for this data.
                if (normOpt === normAns) {
                    bestScore = 2.0; // Exact match priority
                    bestOptIdx = optIdx;
                } else {
                    const score = 1.0;
                    if (score > bestScore) {
                        bestScore = score;
                        bestOptIdx = optIdx;
                    }
                }
            } else {
                // Fallback: word overlap
                // ...
            }
        });

        if (bestOptIdx !== -1) {
            if (q.correctAnswer !== bestOptIdx) {
                q.correctAnswer = bestOptIdx;
                updates++;
                // console.log(`Updated Q${q.id} -> ${bestOptIdx} (Line: "${ansLine}")`);
            }
        } else {
            console.warn(`Could not match answer for Q${q.id}: "${ansLine}"`);
            console.log("Options:", q.options);
        }
    });

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Updated ${updates} questions from ordered list.`);

} catch (err) {
    console.error(err);
}
