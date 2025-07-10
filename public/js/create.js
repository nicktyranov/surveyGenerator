const surveyContainer = document.querySelector('.survey');

surveyContainer.addEventListener('click', (e) => {
	if (e.target.classList.contains('add-answer')) {
		e.preventDefault();

		const questionBlock = e.target.closest('.question');
		const questionIndex = questionBlock.dataset.questionIndex;
		const answersContainer = questionBlock.querySelector('.survey-answers');
		const currentAnswersCount = answersContainer.querySelectorAll('.answer-option').length;

		const newInput = document.createElement('div');
		newInput.className = 'answer-option';

		newInput.innerHTML = `
      <label>
        <span class="answer-text">Answer ${currentAnswersCount + 1}</span>
        <input type="text" name="questions[${questionIndex}][answers][${currentAnswersCount}][text]" required />
      </label>
    `;

		answersContainer.appendChild(newInput);
	}

	if (e.target.classList.contains('delete-answer')) {
		e.preventDefault();

		const questionBlock = e.target.closest('.question');
		const answersContainer = questionBlock.querySelector('.survey-answers');
		const currentAnswers = answersContainer.querySelectorAll('.answer-option');

		if (currentAnswers.length > 2) {
			answersContainer.removeChild(currentAnswers[currentAnswers.length - 1]);
		}
	}
});

document.querySelector('#add-question').addEventListener('click', (e) => {
	e.preventDefault();

	const survey = document.querySelector('.survey');
	const questionCount = survey.querySelectorAll('.question').length;

	const newQuestion = document.createElement('div');
	newQuestion.className = 'question';
	newQuestion.setAttribute('data-question-index', questionCount);

	newQuestion.innerHTML = `
    <label>Question ${questionCount + 1}</label>
    <input type='text' name='questions[${questionCount}][text]' class='question-input' required />

    <h4>Answers</h4>
    <div class='survey-answers' data-question-index="${questionCount}">
      <div class='answer-option'>
        <label>
          <span class='answer-text'>Answer 1</span>
          <input type='text' name='questions[${questionCount}][answers][0][text]' required />
        </label>
      </div>

      <div class='answer-option'>
        <label>
          <span class='answer-text'>Answer 2</span>
          <input type='text' name='questions[${questionCount}][answers][1][text]' required />
        </label>
      </div>
    </div>

    <div class='controls-buttons'>
      <span class='add-answer'>+ Add answer</span>
      <span class='delete-answer'>- Delete answer</span>
    </div>
  `;

	survey.appendChild(newQuestion);
});

document.querySelector('#delete-question').addEventListener('click', (e) => {
	e.preventDefault();

	const survey = document.querySelector('.survey');
	const questions = survey.querySelectorAll('.question');

	if (questions.length > 1) {
		survey.removeChild(questions[questions.length - 1]);
	}
});
