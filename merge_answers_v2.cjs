const fs = require('fs');
const path = require('path');

const questionsPath = './src/assets/questions.json';
const answersPath = './reponses_correctes.txt';

function normalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[.,…:;?()"']/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

function getTokens(str) {
    return normalize(str).split(' ').filter(t => t.length > 2);
}

function calculateOverlap(str1, str2) {
    const tokens1 = new Set(getTokens(str1));
    const tokens2 = getTokens(str2);
    let intersection = 0;
    tokens2.forEach(t => {
        if (tokens1.has(t)) intersection++;
    });
    const union = new Set([...tokens1, ...tokens2]).size;
    return union === 0 ? 0 : intersection / union; // Jaccard index
}

try {
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    const content = fs.readFileSync(answersPath, 'utf8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    let currentQ = null;
    let updates = 0;

    for (const line of lines) {
        if (line.length < 5) continue;

        // 1. Try to find a matching question
        let bestQ = null;
        let bestQScore = 0;

        questions.forEach(q => {
            const score = calculateOverlap(q.question, line);
            if (score > 0.5 && score > bestQScore) { // Threshold 0.5 overlap
                bestQScore = score;
                bestQ = q;
            }
        });

        if (bestQ) {
            currentQ = bestQ;
            // console.log(`Matched Q${currentQ.id} (Score ${bestQScore.toFixed(2)}): ${line.substring(0,30)}...`);
            continue;
        }

        // 2. If no new question matched, try to match options of currentQ
        if (currentQ) {
            let bestOptIdx = -1;
            let bestOptScore = 0;

            currentQ.options.forEach((opt, idx) => {
                // Try simple inclusion first
                const normOpt = normalize(opt);
                const normLine = normalize(line);

                if (normOpt.includes(normLine) || normLine.includes(normOpt)) {
                    // Inclusion is a strong signal
                    const score = 1.0;
                    if (score > bestOptScore) {
                        bestOptScore = score;
                        bestOptIdx = idx;
                    }
                } else {
                    // Try Jaccard as fallback
                    const score = calculateOverlap(opt, line);
                    if (score > 0.4 && score > bestOptScore) {
                        bestOptScore = score;
                        bestOptIdx = idx;
                    }
                }
            });

            if (bestOptIdx !== -1) {
                // Only update if different
                if (currentQ.correctAnswer !== bestOptIdx) {
                    currentQ.correctAnswer = bestOptIdx;
                    updates++;
                    console.log(`Updated Q${currentQ.id} -> ${bestOptIdx} [${currentQ.options[bestOptIdx].substring(0, 30)}...] matched "${line.substring(0, 30)}..."`);
                }
            }
        }
    }

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Updated ${updates} questions.`);

} catch (err) {
    console.error(err);
}
