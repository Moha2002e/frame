const fs = require('fs');
const path = require('path');

const inputPath = 'questions.txt';
const outputPath = 'qcm-app/src/assets/questions.json';

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const lines = content.split(/\r?\n/);

    const questions = [];
    let currentQ = null;

    // Regex
    const headerPattern = /^(\d+)\)\s+(.*)/;
    const optionPattern = /^[•·]\s+☐\s+(.*)/;
    const separatorPattern = /^_{5,}$/;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        if (line.startsWith('Canevas')) return;

        if (separatorPattern.test(line)) {
            if (currentQ) {
                questions.push(currentQ);
                currentQ = null;
            }
            return;
        }

        const qMatch = line.match(headerPattern);
        if (qMatch) {
            if (currentQ) {
                questions.push(currentQ);
            }
            currentQ = {
                id: parseInt(qMatch[1]),
                question: qMatch[2],
                options: [],
                correctAnswer: 0 // Default answer for scoring logic
            };
            return;
        }

        const optMatch = line.match(optionPattern);
        if (optMatch) {
            if (currentQ) {
                currentQ.options.push(optMatch[1]);
            }
            return;
        }

        // Continuation
        if (currentQ) {
            if (currentQ.options.length > 0) {
                currentQ.options[currentQ.options.length - 1] += ' ' + line;
            } else {
                currentQ.question += ' ' + line;
            }
        }
    });

    if (currentQ) {
        questions.push(currentQ);
    }

    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Parsed ${questions.length} questions.`);

} catch (err) {
    console.error(err);
}
