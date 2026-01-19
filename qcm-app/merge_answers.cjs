const fs = require('fs');
const path = require('path');

const questionsPath = './src/assets/questions.json';
const answersPath = '../reponse.txt';

// Basic normalization function
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[.,…:;]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

try {
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    const answersRaw = fs.readFileSync(answersPath, 'utf8');

    // Split by newlines and filter empty lines
    const answerLines = answersRaw.split(/\r?\n/).filter(line => line.trim().length > 0);

    console.log(`Loaded ${questions.length} questions.`);
    console.log(`Loaded ${answerLines.length} answer lines.`);

    // Iterate
    questions.forEach((q, idx) => {
        if (idx >= answerLines.length) {
            console.warn(`No answer found for Q${q.id}`);
            return;
        }

        const ansText = answerLines[idx];
        const normAns = normalize(ansText);

        // Find matching option
        // Strategy 1: Exact substring match (normalized)
        let foundIndex = -1;
        let bestScore = 0;

        q.options.forEach((opt, optIdx) => {
            const normOpt = normalize(opt);

            // Text comparison
            // Check if ansText is contained in opt OR opt is contained in ansText
            // (The answer key might be a summary or partial)

            if (normOpt.includes(normAns) || normAns.includes(normOpt)) {
                // Determine quality of match? length overlap?
                // For now, first match or longest match?
                // Let's assume unique enough match.

                // Score could be length of matching string
                const score = Math.min(normOpt.length, normAns.length);
                if (score > bestScore) {
                    bestScore = score;
                    foundIndex = optIdx;
                }
            }
        });

        if (foundIndex !== -1) {
            q.correctAnswer = foundIndex;
            console.log(`Q${q.id} Answer updated to index ${foundIndex} (${q.options[foundIndex]}) matched with "${ansText}"`);
        } else {
            console.error(`Q${q.id} NO MATCH FOUND for answer "${ansText}"`);
            console.log("Options:", q.options);
        }
    });

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log("Updated questions.json successfully.");

} catch (err) {
    console.error("Error updating answers:", err);
}
