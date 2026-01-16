<template>
  <div class="qcm-container">
    <!-- Header / Progress -->
    <header class="qcm-header">
      <h1 v-if="viewState === 'MENU'">QCM Revision</h1>
      <div v-else class="header-status">
        <button class="back-btn" @click="goHome">← Accueil</button>
        <span v-if="viewState === 'QUIZ'">Série {{ currentSeriesIndex + 1 }} : {{ currentQIndex + 1 }} / {{ currentQuestions.length }}</span>
        <span v-if="viewState === 'RESULTS'">Résultats Série {{ currentSeriesIndex + 1 }}</span>
      </div>
    </header>

    <!-- MENU: Series Selection -->
    <main v-if="viewState === 'MENU'" class="menu-view">
      <p>Choisissez une série de questions :</p>
      <div class="series-grid">
        <button 
          v-for="(series, index) in seriesList" 
          :key="index"
          class="series-card"
          @click="startSeries(index)"
        >
          <span class="series-title">Série {{ index + 1 }}</span>
          <span class="series-info">{{ QUESTIONS_PER_SERIES }} questions</span>
        </button>
      </div>
    </main>

    <!-- QUIZ: Single Question -->
    <main v-else-if="viewState === 'QUIZ'" class="quiz-view">
      <div class="question-single-card">
        <div class="q-content">
          <span class="q-id">Q{{ currentQuestion.id }}</span>
          <p class="q-text">{{ currentQuestion.question }}</p>
        </div>
        
        <div class="options-container">
          <label 
            v-for="(opt, oIndex) in currentQuestion.options" 
            :key="oIndex" 
            class="option-block"
            :class="{ 
              selected: selectedOption === oIndex,
              val_correct: isValidated && oIndex === currentQuestion.correctAnswer, 
              val_wrong: isValidated && selectedOption === oIndex && selectedOption !== currentQuestion.correctAnswer
            }"
          >
            <!-- 
                Disable input if validated to prevent changing answer 
            -->
            <input 
              type="radio" 
              name="current-q" 
              :value="oIndex" 
              v-model="selectedOption"
              :disabled="isValidated"
            />
            <span class="option-marker">{{ getLetter(oIndex) }}</span>
            <span class="option-text">{{ opt }}</span>
            
            <!-- Feedback Icon -->
            <span v-if="isValidated && oIndex === currentQuestion.correctAnswer" class="feedback-icon">✅</span>
            <span v-if="isValidated && selectedOption === oIndex && oIndex !== currentQuestion.correctAnswer" class="feedback-icon">❌</span>
          </label>
        </div>

        <!-- Feedback Message Block -->
        <div v-if="isValidated" class="feedback-message" :class="{ success: isCurrentCorrect, error: !isCurrentCorrect }">
          <p v-if="isCurrentCorrect"><strong>Correct !</strong> Bien joué.</p>
          <p v-else><strong>Incorrect.</strong> La bonne réponse était {{ getLetter(currentQuestion.correctAnswer) }}.</p>
        </div>

        <div class="actions">
          <button class="nav-btn prev" @click="prevQuestion" :disabled="currentQIndex === 0">Précédent</button>
          
          <!-- Validation Button: Logic: Show if selected but not validated -->
          <button 
            v-if="selectedOption !== undefined && !isValidated" 
            class="nav-btn validate" 
            @click="validateAnswer"
          >
            Valider
          </button>

          <!-- Next Button: Logic: Show if validated AND not last question -->
          <button 
            v-if="isValidated && currentQIndex < currentQuestions.length - 1" 
            class="nav-btn next" 
            @click="nextQuestion"
          >
            Question Suivante
          </button>

          <!-- Finish Button: Logic: Show if validated AND last question -->
          <button 
            v-if="isValidated && currentQIndex === currentQuestions.length - 1" 
            class="nav-btn finish" 
            @click="finishSeries"
          >
            Voir les Résultats
          </button>
        </div>
      </div>
    </main>

    <!-- RESULTS: Summary -->
    <main v-else-if="viewState === 'RESULTS'" class="results-view">
      <div class="score-card">
        <h2>Votre Score</h2>
        <div class="score-display">
          <span class="score-number">{{ score }}</span>
          <span class="score-total">/ {{ currentQuestions.length }}</span>
        </div>
        <p class="score-message">{{ scoreMessage }}</p>
      </div>

      <div class="answers-review">
        <h3>Détails des réponses</h3>
        <div 
          v-for="(q, idx) in currentQuestions" 
          :key="q.id" 
          class="review-item"
          :class="{ correct: isCorrect(q.id), wrong: !isCorrect(q.id) }"
        >
          <div class="review-header">
            <strong>Q{{ q.id }}.</strong> {{ q.question }}
          </div>
          <div class="review-status">
            <span v-if="isCorrect(q.id)">✅ Correct</span>
            <span v-else>❌ Incorrect (Réponse : {{ getLetter(q.correctAnswer) }})</span>
          </div>
          <div class="review-choice" v-if="userAnswers[q.id] !== undefined">
            Votre choix : {{ getLetter(userAnswers[q.id]) }} - {{ q.options[userAnswers[q.id]] }}
          </div>
        </div>
      </div>

      <button class="btn-primary" @click="goHome">Retour à l'accueil</button>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import questionsData from '../assets/questions.json';

const QUESTIONS_PER_SERIES = 20;

// States: 'MENU', 'QUIZ', 'RESULTS'
const viewState = ref('MENU');
const questions = ref(questionsData);
const currentSeriesIndex = ref(0);
const currentQIndex = ref(0);
const userAnswers = ref({}); // Map question ID -> option index (int)
const validatedQuestions = ref(new Set()); // Track which questions have been validated

const seriesList = computed(() => {
  const count = Math.ceil(questions.value.length / QUESTIONS_PER_SERIES);
  return Array.from({ length: count }, (_, i) => i);
});

const currentQuestions = computed(() => {
  const start = currentSeriesIndex.value * QUESTIONS_PER_SERIES;
  const end = start + QUESTIONS_PER_SERIES;
  return questions.value.slice(start, end);
});

const currentQuestion = computed(() => {
  return currentQuestions.value[currentQIndex.value];
});

// Getter and Setter for v-model to handle the userAnswers map
const selectedOption = computed({
  get: () => userAnswers.value[currentQuestion.value.id],
  set: (val) => {
    // Only allow setting if not validated
    if (!isValidated.value) {
        userAnswers.value[currentQuestion.value.id] = val;
    }
  }
});

const isValidated = computed(() => {
    return validatedQuestions.value.has(currentQuestion.value.id);
});

const isCurrentCorrect = computed(() => {
    return userAnswers.value[currentQuestion.value.id] === currentQuestion.value.correctAnswer;
});

const score = computed(() => {
  let s = 0;
  currentQuestions.value.forEach(q => {
    if (userAnswers.value[q.id] === q.correctAnswer) {
      s++;
    }
  });
  return s;
});

const scoreMessage = computed(() => {
  const pct = score.value / currentQuestions.value.length;
  if (pct === 1) return "Parfait ! Excellent travail.";
  if (pct >= 0.8) return "Très bien !";
  if (pct >= 0.5) return "Pas mal, mais peut mieux faire.";
  return "Il faut réviser encore un peu.";
});

function getLetter(index) {
  if (index === undefined || index === null) return '?';
  return String.fromCharCode(65 + index); // A, B, C...
}

function startSeries(index) {
  currentSeriesIndex.value = index;
  currentQIndex.value = 0;
  userAnswers.value = {}; 
  validatedQuestions.value = new Set();
  viewState.value = 'QUIZ';
}

function validateAnswer() {
    if (selectedOption.value !== undefined) {
        validatedQuestions.value.add(currentQuestion.value.id);
    }
}

function nextQuestion() {
  if (currentQIndex.value < currentQuestions.value.length - 1) {
    currentQIndex.value++;
  }
}

function prevQuestion() {
  if (currentQIndex.value > 0) {
    currentQIndex.value--;
  }
}

function finishSeries() {
  viewState.value = 'RESULTS';
}

function goHome() {
  viewState.value = 'MENU';
}

function isCorrect(qId) {
  const q = questions.value.find(x => x.id === qId);
  return userAnswers.value[qId] === q.correctAnswer;
}
</script>

<style scoped>
/* Container & Header */
.qcm-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-color);
}

.qcm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
}

.qcm-header h1 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(90deg, #42d392, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.back-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
}
.back-btn:hover { color: #fff; }

/* Menu */
.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
}

.series-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: #2a2a2a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.series-card:hover {
  transform: translateY(-5px);
  border-color: #646cff;
  box-shadow: 0 5px 15px rgba(100, 108, 255, 0.2);
}

.series-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.series-info {
  font-size: 0.9rem;
  color: #888;
}

/* Quiz Card */
.question-single-card {
  background: #242424;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.q-content {
  margin-bottom: 2rem;
}

.q-text {
  font-size: 1.3rem;
  line-height: 1.6;
  margin-top: 0.5rem;
}

.q-id {
  background: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #aaa;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-block {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #2a2a2a;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.option-block:hover {
  background: #333;
}

.option-block.selected {
  border-color: #646cff;
  background: rgba(100, 108, 255, 0.1);
}

/* Validation Styles */
.option-block.val_correct {
    border-color: #42d392;
    background: rgba(66, 211, 146, 0.1);
}

.option-block.val_wrong {
    border-color: #ff6464;
    background: rgba(255, 100, 100, 0.1);
}

.option-block input { display: none; }

.option-marker {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #444;
  border-radius: 50%;
  margin-right: 1rem;
  font-weight: bold;
  flex-shrink: 0;
}

.option-block.selected .option-marker {
  background: #646cff;
  color: white;
}
.option-block.val_correct .option-marker {
    background: #42d392;
    color: #242424;
}
.option-block.val_wrong .option-marker {
    background: #ff6464;
    color: white;
}

.feedback-icon {
    margin-left: auto;
    font-size: 1.2rem;
}

.feedback-message {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
    font-size: 1.1rem;
    text-align: center;
}

.feedback-message.success {
    background: rgba(66, 211, 146, 0.2);
    color: #42d392;
    border: 1px solid #42d392;
}

.feedback-message.error {
    background: rgba(255, 100, 100, 0.2);
    color: #ff6464;
    border: 1px solid #ff6464;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.nav-btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn.prev {
  background: #333;
  color: #fff;
}

.nav-btn.validate {
    background: #646cff;
    color: white;
}

.nav-btn.next {
  background: #42d392;
  color: #000;
}

.nav-btn.finish {
  background: #646cff;
  color: #fff;
}

/* Results */
.score-card {
  text-align: center;
  padding: 2rem;
  background: #2a2a2a;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.score-display {
  font-size: 3rem;
  font-weight: bold;
  margin: 1rem 0;
  color: #646cff;
}

.score-total {
  font-size: 1.5rem;
  color: #666;
}

.review-item {
  background: #222;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border-left: 4px solid #555;
}

.review-item.correct { border-left-color: #42d392; }
.review-item.wrong { border-left-color: #ff6464; }

.review-header { margin-bottom: 0.5rem; }
.review-status { font-size: 0.9rem; margin-bottom: 0.5rem; color: #aaa; }
.review-choice { font-style: italic; color: #ddd; }

.btn-primary {
  display: block;
  width: 100%;
  padding: 1rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 2rem;
}
.btn-primary:hover { background: #535bf2; }
</style>
