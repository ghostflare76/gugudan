// 게임 상태 관리
class MultiplicationGame {
    constructor() {
        this.playerName = '';
        this.currentScore = 0;
        this.currentQuestion = 1;
        this.totalQuestions = 10;
        this.correctAnswers = 0;
        this.consecutiveCorrect = 0;
        this.maxStreak = 0;
        this.timer = null;
        this.timeLeft = 5;
        this.currentAnswer = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        
        // 터치 드래그 상태 관리
        this.isDragging = false;
        this.draggedElement = null;
        this.touchOffset = { x: 0, y: 0 };
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        // DOM 요소들 참조
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultScreen = document.getElementById('resultScreen');
        this.playerNameInput = document.getElementById('playerName');
        this.currentScoreDisplay = document.getElementById('currentScore');
        this.questionText = document.getElementById('questionText');
        this.answerOptions = document.getElementById('answerOptions');
        this.dropZone = document.getElementById('dropZone');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.timerValue = document.getElementById('timerValue');
        this.timerFill = document.getElementById('timerFill');
        this.starRating = document.getElementById('starRating');
        
        // 피드백 효과 요소들
        this.perfectEffect = document.getElementById('perfectEffect');
        this.streakEffect = document.getElementById('streakEffect');
        this.streakText = document.getElementById('streakText');
        this.wrongEffect = document.getElementById('wrongEffect');
        
        // 결과 화면 요소들
        this.finalScore = document.getElementById('finalScore');
        this.finalStars = document.getElementById('finalStars');
        this.accuracyRate = document.getElementById('accuracyRate');
        this.maxStreakDisplay = document.getElementById('maxStreak');
    }
    
    setupEventListeners() {
        // 드래그 앤 드롭 이벤트 설정
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }
    
    generateQuestions() {
        this.questions = [];
        for (let i = 0; i < this.totalQuestions; i++) {
            const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
            const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
            const correctAnswer = num1 * num2;
            
            // 오답 선택지 생성
            const wrongAnswers = [];
            while (wrongAnswers.length < 3) {
                const wrong = correctAnswer + Math.floor(Math.random() * 20) - 10;
                if (wrong !== correctAnswer && wrong > 0 && !wrongAnswers.includes(wrong)) {
                    wrongAnswers.push(wrong);
                }
            }
            
            // 선택지를 섞어서 배치
            const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
            
            this.questions.push({
                num1,
                num2,
                correctAnswer,
                options
            });
        }
    }
    
    startGame() {
        this.playerName = this.playerNameInput.value.trim();
        if (!this.playerName) {
            alert('이름을 입력해주세요! 😊');
            return;
        }
        
        // 게임 상태 초기화
        this.currentScore = 0;
        this.currentQuestion = 1;
        this.correctAnswers = 0;
        this.consecutiveCorrect = 0;
        this.maxStreak = 0;
        this.currentQuestionIndex = 0;
        
        // 문제 생성
        this.generateQuestions();
        
        // 화면 전환
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.gameScreen.classList.add('fade-in');
        
        // 첫 번째 문제 시작
        this.showQuestion();
    }
    
    showQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        
        // 문제 표시
        this.questionText.textContent = `${question.num1} × ${question.num2} = ?`;
        
        // 진행률 업데이트
        const progress = (this.currentQuestion / this.totalQuestions) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `문제 ${this.currentQuestion} / ${this.totalQuestions}`;
        
        // 답안 선택지 생성
        this.createAnswerOptions(question.options);
        
        // 드롭존 초기화
        this.resetDropZone();
        
        // 타이머 시작
        this.startTimer();
    }
    
    createAnswerOptions(options) {
        this.answerOptions.innerHTML = '';
        
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'answer-option';
            optionElement.textContent = option;
            optionElement.draggable = true;
            optionElement.dataset.value = option;
            
            // 데스크톱 드래그 이벤트 설정
            optionElement.addEventListener('dragstart', this.handleDragStart.bind(this));
            optionElement.addEventListener('dragend', this.handleDragEnd.bind(this));
            
            // 모바일 터치 이벤트 설정
            optionElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            optionElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            optionElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            
            // 클릭 이벤트 (터치 대체용)
            optionElement.addEventListener('click', this.handleClick.bind(this));
            
            this.answerOptions.appendChild(optionElement);
        });
    }
    
    resetDropZone() {
        // 모바일 환경 감지
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
        
        const hintText = isMobile ? 
            '정답을 터치하거나 드래그하세요! 👆' : 
            '정답을 여기에 드래그하세요! 👆';
            
        this.dropZone.innerHTML = `<span class="drop-hint">${hintText}</span>`;
        this.dropZone.classList.remove('has-answer');
        this.currentAnswer = null;
    }
    
    startTimer() {
        this.timeLeft = 5;
        this.timerValue.textContent = this.timeLeft;
        
        // 타이머 바 애니메이션 재시작
        this.timerFill.style.animation = 'none';
        this.timerFill.offsetHeight; // 강제 리플로우
        this.timerFill.style.animation = 'countdown 5s linear';
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerValue.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleTimeUp();
            }
        }, 1000);
    }
    
    handleTimeUp() {
        this.showWrongEffect();
        this.consecutiveCorrect = 0;
        this.updateScore(-10); // 시간 초과 시 점수 차감
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }
    
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        e.target.style.opacity = '0.5';
    }
    
    handleDragEnd(e) {
        e.target.style.opacity = '1';
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        if (!this.dropZone.contains(e.relatedTarget)) {
            this.dropZone.classList.remove('drag-over');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const droppedValue = parseInt(e.dataTransfer.getData('text/plain'));
        this.currentAnswer = droppedValue;
        
        // 드롭존 업데이트
        this.dropZone.innerHTML = droppedValue;
        this.dropZone.classList.add('has-answer');
        
        // 정답 확인
        setTimeout(() => {
            this.checkAnswer(droppedValue);
        }, 500);
    }
    
    // 터치 이벤트 핸들러들
    handleTouchStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.draggedElement = e.target;
        
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        this.touchOffset.x = touch.clientX - rect.left;
        this.touchOffset.y = touch.clientY - rect.top;
        
        // 드래그 시작 스타일
        e.target.style.opacity = '0.8';
        e.target.style.transform = 'scale(1.1) rotate(5deg)';
        e.target.style.zIndex = '1000';
        e.target.style.position = 'fixed';
        e.target.style.pointerEvents = 'none';
        
        // 터치 좌표로 위치 설정
        e.target.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        e.target.style.top = (touch.clientY - this.touchOffset.y) + 'px';
    }
    
    handleTouchMove(e) {
        if (!this.isDragging || !this.draggedElement) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        
        // 드래그되는 요소의 위치 업데이트
        this.draggedElement.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        this.draggedElement.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        
        // 드롭존과의 충돌 감지
        const dropZoneRect = this.dropZone.getBoundingClientRect();
        const isOverDropZone = (
            touch.clientX >= dropZoneRect.left &&
            touch.clientX <= dropZoneRect.right &&
            touch.clientY >= dropZoneRect.top &&
            touch.clientY <= dropZoneRect.bottom
        );
        
        if (isOverDropZone) {
            this.dropZone.classList.add('drag-over');
        } else {
            this.dropZone.classList.remove('drag-over');
        }
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        
        // 드롭존과의 충돌 확인
        const dropZoneRect = this.dropZone.getBoundingClientRect();
        const isOverDropZone = (
            touch.clientX >= dropZoneRect.left &&
            touch.clientX <= dropZoneRect.right &&
            touch.clientY >= dropZoneRect.top &&
            touch.clientY <= dropZoneRect.bottom
        );
        
        if (isOverDropZone) {
            // 드롭 성공
            const droppedValue = parseInt(this.draggedElement.dataset.value);
            this.currentAnswer = droppedValue;
            
            // 드롭존 업데이트
            this.dropZone.innerHTML = droppedValue;
            this.dropZone.classList.add('has-answer');
            this.dropZone.classList.remove('drag-over');
            
            // 정답 확인
            setTimeout(() => {
                this.checkAnswer(droppedValue);
            }, 500);
        }
        
        // 드래그 종료 - 원래 상태로 복원
        this.resetDraggedElement();
    }
    
    handleClick(e) {
        // 모바일에서 간단한 클릭으로도 답안 선택 가능
        if (this.currentAnswer !== null) return; // 이미 답안이 선택된 경우 무시
        
        const clickedValue = parseInt(e.target.dataset.value);
        this.currentAnswer = clickedValue;
        
        // 드롭존 업데이트
        this.dropZone.innerHTML = clickedValue;
        this.dropZone.classList.add('has-answer');
        
        // 클릭된 옵션 강조
        e.target.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
        
        // 정답 확인
        setTimeout(() => {
            this.checkAnswer(clickedValue);
        }, 500);
    }
    
    resetDraggedElement() {
        if (this.draggedElement) {
            // 스타일 초기화
            this.draggedElement.style.opacity = '1';
            this.draggedElement.style.transform = '';
            this.draggedElement.style.zIndex = '';
            this.draggedElement.style.position = '';
            this.draggedElement.style.pointerEvents = '';
            this.draggedElement.style.left = '';
            this.draggedElement.style.top = '';
        }
        
        this.isDragging = false;
        this.draggedElement = null;
        this.dropZone.classList.remove('drag-over');
    }
    
    checkAnswer(answer) {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;
        
        // 타이머 정지
        clearInterval(this.timer);
        
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
        
        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
    }
    
    handleCorrectAnswer() {
        this.correctAnswers++;
        this.consecutiveCorrect++;
        this.maxStreak = Math.max(this.maxStreak, this.consecutiveCorrect);
        
        // 점수 계산 (연속 정답 시 보너스)
        let scoreToAdd = 10;
        if (this.consecutiveCorrect >= 2) {
            scoreToAdd += this.consecutiveCorrect * 2; // 연속 보너스
        }
        
        this.updateScore(scoreToAdd);
        this.showPerfectEffect();
        
        // 연속 정답 효과
        if (this.consecutiveCorrect >= 2) {
            this.showStreakEffect();
        }
        
        // 별점 업데이트
        this.updateStarRating();
    }
    
    handleWrongAnswer() {
        this.consecutiveCorrect = 0;
        this.updateScore(-5); // 틀렸을 때 점수 차감
        this.showWrongEffect();
    }
    
    updateScore(points) {
        this.currentScore = Math.max(0, this.currentScore + points); // 0점 이하로 내려가지 않음
        this.currentScoreDisplay.textContent = this.currentScore;
        
        // 점수 변화 애니메이션
        this.currentScoreDisplay.style.transform = 'scale(1.3)';
        this.currentScoreDisplay.style.color = points > 0 ? '#48bb78' : '#e53e3e';
        
        setTimeout(() => {
            this.currentScoreDisplay.style.transform = 'scale(1)';
            this.currentScoreDisplay.style.color = 'white';
        }, 300);
    }
    
    updateStarRating() {
        const stars = this.starRating.querySelectorAll('.star');
        const accuracy = this.correctAnswers / this.currentQuestion;
        
        stars.forEach((star, index) => {
            if (accuracy >= (index + 1) * 0.33) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    showPerfectEffect() {
        this.perfectEffect.classList.remove('hidden');
        setTimeout(() => {
            this.perfectEffect.classList.add('hidden');
        }, 1500);
    }
    
    showStreakEffect() {
        this.streakText.textContent = `${this.consecutiveCorrect} 연속 PERFECT! 🔥`;
        this.streakEffect.classList.remove('hidden');
        setTimeout(() => {
            this.streakEffect.classList.add('hidden');
        }, 1500);
    }
    
    showWrongEffect() {
        this.wrongEffect.classList.remove('hidden');
        setTimeout(() => {
            this.wrongEffect.classList.add('hidden');
        }, 1500);
    }
    
    nextQuestion() {
        this.currentQuestion++;
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endGame();
        } else {
            this.showQuestion();
        }
    }
    
    endGame() {
        // 화면 전환
        this.gameScreen.classList.add('hidden');
        this.resultScreen.classList.remove('hidden');
        this.resultScreen.classList.add('fade-in');
        
        // 최종 결과 표시
        this.showFinalResults();
    }
    
    showFinalResults() {
        // 최종 점수
        this.finalScore.textContent = this.currentScore;
        
        // 정확도 계산
        const accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
        this.accuracyRate.textContent = `${accuracy}%`;
        
        // 최고 연속 정답
        this.maxStreakDisplay.textContent = this.maxStreak;
        
        // 최종 별점 계산
        this.updateFinalStarRating(accuracy);
        
        // 결과에 따른 메시지
        this.showEncouragementMessage(accuracy);
    }
    
    updateFinalStarRating(accuracy) {
        const stars = this.finalStars.querySelectorAll('.star');
        let activeStars = 0;
        
        if (accuracy >= 90) activeStars = 3;
        else if (accuracy >= 70) activeStars = 2;
        else if (accuracy >= 50) activeStars = 1;
        
        stars.forEach((star, index) => {
            if (index < activeStars) {
                star.style.filter = 'grayscale(0%)';
                star.style.transform = 'scale(1.2)';
            } else {
                star.style.filter = 'grayscale(100%)';
                star.style.transform = 'scale(1)';
            }
        });
    }
    
    showEncouragementMessage(accuracy) {
        const resultTitle = this.resultScreen.querySelector('h2');
        
        if (accuracy >= 90) {
            resultTitle.textContent = '🎊 완벽해요! 구구단 마스터! 🎊';
        } else if (accuracy >= 70) {
            resultTitle.textContent = '🎉 잘했어요! 계속 연습해봐요! 🎉';
        } else if (accuracy >= 50) {
            resultTitle.textContent = '💪 좋은 시작이에요! 더 연습해봐요! 💪';
        } else {
            resultTitle.textContent = '📚 연습이 필요해요! 포기하지 마세요! 📚';
        }
    }
    
    resetGame() {
        // 모든 화면 숨기기
        this.gameScreen.classList.add('hidden');
        this.resultScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        // 입력 필드 초기화
        this.playerNameInput.value = '';
        
        // 게임 상태 초기화
        this.currentScore = 0;
        this.currentScoreDisplay.textContent = '0';
        
        // 별점 초기화
        const stars = this.starRating.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));
    }
}

// 게임 인스턴스 생성
const game = new MultiplicationGame();

// 전역 함수들 (HTML에서 호출)
function startGame() {
    game.startGame();
}

function resetGame() {
    game.resetGame();
}

// 키보드 이벤트 처리
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const startScreen = document.getElementById('startScreen');
        const resultScreen = document.getElementById('resultScreen');
        
        if (!startScreen.classList.contains('hidden')) {
            startGame();
        } else if (!resultScreen.classList.contains('hidden')) {
            resetGame();
        }
    }
});

// 페이지 로드 시 이름 입력 필드에 포커스
window.addEventListener('load', () => {
    const playerNameInput = document.getElementById('playerName');
    playerNameInput.focus();
});