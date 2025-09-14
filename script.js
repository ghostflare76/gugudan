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
        this.personalBestDisplay = document.getElementById('personalBest');
        this.rankingTable = document.getElementById('rankingTable');
        
        // 사운드 요소들
        this.applauseSound = document.getElementById('applauseSound');
        this.streakSound = document.getElementById('streakSound');
        this.wrongSound = document.getElementById('wrongSound');
        this.completionSound = document.getElementById('completionSound');
        
        // 사운드 볼륨 설정
        this.applauseSound.volume = 0.7;
        this.streakSound.volume = 0.8;
        this.wrongSound.volume = 0.5;
        this.completionSound.volume = 0.8;
        
        // Web Audio API 컨텍스트 초기화
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API 지원되지 않음:', error);
            this.audioContext = null;
        }
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
            let num1, num2;
            
            // 1단 문제 제거: 둘 중 하나라도 1이면 다시 생성
            do {
                num1 = Math.floor(Math.random() * 9) + 1; // 1-9
                num2 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (num1 === 1 || num2 === 1);
            
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
        
        // 오디오 컨텍스트 활성화 (사용자 인터랙션 필요)
        this.resumeAudioContext();
        
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
    
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('오디오 컨텍스트 활성화됨');
            }).catch(error => {
                console.log('오디오 컨텍스트 활성화 실패:', error);
            });
        }
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
        this.playApplauseSound();
        setTimeout(() => {
            this.perfectEffect.classList.add('hidden');
        }, 1500);
    }
    
    showStreakEffect() {
        this.streakText.textContent = `${this.consecutiveCorrect} 연속 PERFECT! 🔥`;
        this.streakEffect.classList.remove('hidden');
        this.playStreakSound();
        setTimeout(() => {
            this.streakEffect.classList.add('hidden');
        }, 1500);
    }
    
    showWrongEffect() {
        this.wrongEffect.classList.remove('hidden');
        this.playWrongSound();
        setTimeout(() => {
            this.wrongEffect.classList.add('hidden');
        }, 1500);
    }
    
    // 사운드 재생 메서드들
    playApplauseSound() {
        // HTML 오디오 파일 우선 사용
        try {
            this.applauseSound.currentTime = 0;
            this.applauseSound.play().catch(error => {
                console.log('박수 소리 재생 실패:', error);
                // 폴백: Web Audio API로 박수 소리 효과 생성
                if (this.audioContext) {
                    this.createApplauseEffect();
                }
            });
        } catch (error) {
            console.log('박수 소리 재생 오류:', error);
            // 폴백: Web Audio API로 박수 소리 효과 생성
            if (this.audioContext) {
                this.createApplauseEffect();
            }
        }
    }
    
    playStreakSound() {
        // Web Audio API로 연속 효과음 생성
        if (this.audioContext) {
            this.createStreakEffect();
        } else {
            // 폴백: HTML 오디오 사용
            try {
                this.streakSound.currentTime = 0;
                this.streakSound.play().catch(error => {
                    console.log('연속 효과음 재생 실패:', error);
                });
            } catch (error) {
                console.log('연속 효과음 재생 오류:', error);
            }
        }
    }
    
    playWrongSound() {
        // HTML 오디오 파일 우선 사용
        try {
            this.wrongSound.currentTime = 0;
            this.wrongSound.play().catch(error => {
                console.log('오답 효과음 재생 실패:', error);
                // 폴백: Web Audio API로 오답 효과음 생성
                if (this.audioContext) {
                    this.createWrongEffect();
                }
            });
        } catch (error) {
            console.log('오답 효과음 재생 오류:', error);
            // 폴백: Web Audio API로 오답 효과음 생성
            if (this.audioContext) {
                this.createWrongEffect();
            }
        }
    }
    
    playCompletionSound() {
        // HTML 오디오 파일 재생
        try {
            this.completionSound.currentTime = 0;
            this.completionSound.play().catch(error => {
                console.log('완료 효과음 재생 실패:', error);
            });
        } catch (error) {
            console.log('완료 효과음 재생 오류:', error);
        }
    }
    
    // Web Audio API를 사용한 사운드 효과 생성
    createApplauseEffect() {
        if (!this.audioContext) return;
        
        try {
            // 복수의 박수 소리를 시뮬레이션
            const times = [0, 0.1, 0.25, 0.4, 0.6, 0.8];
            
            times.forEach((time, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const noiseBuffer = this.audioContext.createBuffer(1, 4410, 44100);
                    const noiseSource = this.audioContext.createBufferSource();
                    
                    // 화이트 노이즈 생성 (박수 소리)
                    const channelData = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < channelData.length; i++) {
                        channelData[i] = Math.random() * 2 - 1;
                    }
                    
                    noiseSource.buffer = noiseBuffer;
                    noiseSource.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    // 볼륨 엔벨로프
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    
                    noiseSource.start(this.audioContext.currentTime);
                    noiseSource.stop(this.audioContext.currentTime + 0.1);
                }, time * 1000);
            });
        } catch (error) {
            console.log('박수 효과음 생성 오류:', error);
        }
    }
    
    createStreakEffect() {
        if (!this.audioContext) return;
        
        try {
            // 상승하는 톤으로 연속 효과 표현
            const frequencies = [440, 554, 659, 880]; // A, C#, E, A (한 옥타브 위)
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'triangle';
                
                const startTime = this.audioContext.currentTime + index * 0.1;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            });
        } catch (error) {
            console.log('연속 효과음 생성 오류:', error);
        }
    }
    
    createWrongEffect() {
        if (!this.audioContext) return;
        
        try {
            // 하강하는 톤으로 오답 효과 표현
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('오답 효과음 생성 오류:', error);
        }
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
        
        // 게임 완료 사운드 재생
        this.playCompletionSound();
        
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
        
        // 개인 최고 점수 표시 (점수 저장 이전에 확인)
        const personalBestBeforeSave = this.getPersonalBest(this.playerName);
        
        // 점수 저장
        this.saveScore(this.playerName, this.currentScore, accuracy);
        
        // 랭킹 업데이트 및 표시
        this.updateRanking(this.playerName, this.currentScore);
        this.displayRanking();
        
        // 개인 최고 점수 표시
        if (this.personalBestDisplay) {
            if (personalBestBeforeSave !== null) {
                // 이전 기록이 있는 경우
                if (this.currentScore > personalBestBeforeSave) {
                    // 신기록 달성
                    this.personalBestDisplay.textContent = `${this.playerName}님 신기록! ${this.currentScore}점 (이전: ${personalBestBeforeSave}점)`;
                    this.personalBestDisplay.style.color = '#e53e3e'; // 빨간색으로 강조
                } else {
                    // 이전 기록이 더 높음
                    this.personalBestDisplay.textContent = `${this.playerName}님 최고 점수: ${personalBestBeforeSave}점 (현재: ${this.currentScore}점)`;
                    this.personalBestDisplay.style.color = '#2d3748'; // 기본 색상
                }
            } else {
                // 첫 기록
                this.personalBestDisplay.textContent = `${this.playerName}님 첫 기록: ${this.currentScore}점`;
                this.personalBestDisplay.style.color = '#38a169'; // 초록색으로 축하
            }
        }
        
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
    
    // localStorage 점수 저장 메서드들
    saveScore(playerName, score, accuracy) {
        try {
            // 기존 점수 데이터 로드
            const scores = this.getStoredScores();
            
            // 새 점수 데이터 생성
            const newScore = {
                playerName: playerName,
                score: score,
                accuracy: accuracy,
                date: new Date().toISOString()
            };
            
            // 점수 배열에 추가
            scores.push(newScore);
            
            // localStorage에 저장
            localStorage.setItem('gugudan-scores', JSON.stringify(scores));
        } catch (error) {
            console.log('점수 저장 중 오류:', error);
            // localStorage 오류 시에도 게임은 계속 진행
        }
    }
    
    getStoredScores() {
        try {
            const storedData = localStorage.getItem('gugudan-scores');
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (error) {
            console.log('저장된 점수 로드 중 오류:', error);
            // JSON.parse 오류 시 빈 배열로 초기화
        }
        return [];
    }
    
    getPersonalBest(playerName) {
        try {
            const scores = this.getStoredScores();
            const playerScores = scores.filter(score => score.playerName === playerName);
            
            if (playerScores.length > 0) {
                return Math.max(...playerScores.map(score => score.score));
            }
        } catch (error) {
            console.log('개인 최고 점수 조회 중 오류:', error);
        }
        return null;
    }
    
    // 랭킹 관리 메서드들
    updateRanking(playerName, score) {
        try {
            const ranking = this.getRanking();
            const newEntry = {
                name: playerName,
                score: score,
                date: new Date().toISOString()
            };
            
            // 기존 랭킹에 새 항목 추가
            ranking.push(newEntry);
            
            // 점수 기준 내림차순 정렬
            ranking.sort((a, b) => b.score - a.score);
            
            // 최대 5명으로 제한 (최저 점수 제거)
            if (ranking.length > 5) {
                ranking.splice(5);
            }
            
            // localStorage에 저장
            localStorage.setItem('gugudan-ranking', JSON.stringify(ranking));
        } catch (error) {
            console.log('랭킹 업데이트 중 오류:', error);
            // localStorage 오류 시에도 게임은 계속 진행
        }
    }
    
    getRanking() {
        try {
            const storedData = localStorage.getItem('gugudan-ranking');
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (error) {
            console.log('랭킹 데이터 로드 중 오류:', error);
            // JSON.parse 오류 시 빈 배열로 초기화
        }
        return [];
    }
    
    displayRanking() {
        try {
            const ranking = this.getRanking();
            
            if (!this.rankingTable) {
                return; // DOM 요소가 없으면 종료
            }
            
            if (ranking.length === 0) {
                this.rankingTable.innerHTML = '<div class="ranking-item">아직 랭킹 데이터가 없습니다.</div>';
                return;
            }
            
            let rankingHTML = '';
            ranking.forEach((entry, index) => {
                const rank = index + 1;
                const isCurrentPlayer = entry.name === this.playerName && entry.score === this.currentScore;
                const currentPlayerClass = isCurrentPlayer ? ' current-player' : '';
                
                let rankIcon = '';
                if (rank === 1) rankIcon = '🥇';
                else if (rank === 2) rankIcon = '🥈';
                else if (rank === 3) rankIcon = '🥉';
                else rankIcon = `${rank}위`;
                
                rankingHTML += `
                    <div class="ranking-item${currentPlayerClass}">
                        <span class="ranking-rank rank-${rank}">${rankIcon}</span>
                        <span class="ranking-name">${entry.name}</span>
                        <span class="ranking-score">${entry.score}점</span>
                    </div>
                `;
            });
            
            this.rankingTable.innerHTML = rankingHTML;
        } catch (error) {
            console.log('랭킹 표시 중 오류:', error);
            // 오류 시 기본 메시지 표시
            if (this.rankingTable) {
                this.rankingTable.innerHTML = '<div class="ranking-item">랭킹을 불러올 수 없습니다.</div>';
            }
        }
    }
}

// 전역 함수들 (HTML에서 호출) - 먼저 선언
function startGame() {
    console.log('startGame 함수 호출됨');
    try {
        if (window.game) {
            window.game.startGame();
        } else {
            console.error('게임 인스턴스가 아직 초기화되지 않았습니다');
        }
    } catch (error) {
        console.error('게임 시작 오류:', error);
        alert('게임 시작 중 오류가 발생했습니다: ' + error.message);
    }
}

function resetGame() {
    if (window.game) {
        window.game.resetGame();
    }
}

// 게임 인스턴스 생성 - 함수 선언 후에
let game;

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

// 페이지 로드 시 게임 초기화
window.addEventListener('load', () => {
    // 게임 인스턴스 생성
    game = new MultiplicationGame();
    window.game = game; // 전역 접근 가능하도록
    
    // 이름 입력 필드에 포커스
    const playerNameInput = document.getElementById('playerName');
    playerNameInput.focus();
    
    console.log('게임이 초기화되었습니다');
});