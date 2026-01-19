const fs = require('fs');
const questionsPath = './src/assets/questions.json';

const corrections = [
    { id: 11, match: "documentation" }, // "un outil ... documentation"
    { id: 12, match: "FAUX" },
    { id: 13, match: "spring-boot-starter-*" },
    { id: 14, match: "dépendances jar" },
    { id: 15, match: "standalone rapidement" },
    { id: 16, match: "FAUX" },
    { id: 17, match: "même package" },
    { id: 18, match: "@EnableAutoConfiguration, @ComponentScan et @Configuration" },
    { id: 19, match: "Une instance de ApplicationContext" },
    { id: 20, match: "getBean() de l'ApplicationContext" }
];

try {
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    let updates = 0;

    corrections.forEach(corr => {
        const q = questions.find(x => x.id === corr.id);
        if (!q) {
            console.error(`Question ${corr.id} not found`);
            return;
        }

        const optIdx = q.options.findIndex(o => o.toLowerCase().includes(corr.match.toLowerCase()));
        if (optIdx !== -1) {
            if (q.correctAnswer !== optIdx) {
                q.correctAnswer = optIdx;
                updates++;
                console.log(`Updated Q${q.id} to option ${optIdx}: "${q.options[optIdx]}"`);
            } else {
                console.log(`Q${q.id} already set to correct option ${optIdx}`);
            }
        } else {
            console.error(`Could not find option matching "${corr.match}" for Q${q.id}`);
            console.log("Options:", q.options);
        }
    });

    if (updates > 0) {
        fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
        console.log(`Saved ${updates} updates.`);
    } else {
        console.log("No changes needed.");
    }

} catch (err) {
    console.error(err);
}
