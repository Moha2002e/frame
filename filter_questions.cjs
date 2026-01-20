const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'assets', 'questions.json');
// Handle potential BOM or encoding issues if any, but usually utf8 is fine
const rawData = fs.readFileSync(filePath, 'utf8');
const questions = JSON.parse(rawData);

console.log(`Original count: ${questions.length}`);

// Filter out questions where correctAnswer is an array
const filteredQuestions = questions.filter(q => !Array.isArray(q.correctAnswer));

console.log(`Filtered count: ${filteredQuestions.length}`);

fs.writeFileSync(filePath, JSON.stringify(filteredQuestions, null, 2), 'utf8');
console.log('Successfully wrote filtered questions to file.');
