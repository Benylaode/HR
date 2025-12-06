/**
 * Test Examination System with Anti-Cheating Features
 * Fitur: Fullscreen mode, prevent tab switching, prevent copy-paste, time limit
 */

// Test State
let testState = {
  token: null,
  candidateName: null,
  categoryId: null,
  categoryName: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  violations: 0,
  maxViolations: 3,
  timeRemaining: 0, // in seconds
  timerInterval: null,
  startTime: null,
  isActive: false,
};

// Dummy data - sama dengan di admin
const dummyCategories = {
  1: {
    id: 1,
    name: "Test CPNS 2025",
    duration: 120,
    questions: [
      {
        id: 1,
        question:
          "Pancasila sebagai dasar negara Indonesia disahkan pada tanggal...",
        type: "multiple_choice",
        options: [
          "17 Agustus 1945",
          "18 Agustus 1945",
          "1 Juni 1945",
          "22 Juni 1945",
        ],
        correctAnswer: 1,
        points: 5,
      },
      {
        id: 2,
        question: "Berapa hasil dari 15 x 8 + 120 ÷ 6?",
        type: "multiple_choice",
        options: ["140", "150", "160", "170"],
        correctAnswer: 0,
        points: 5,
      },
      {
        id: 3,
        question:
          "Seorang ASN harus memiliki integritas tinggi dalam menjalankan tugasnya.",
        type: "true_false",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        points: 5,
      },
      {
        id: 4,
        question:
          "UUD 1945 pertama kali disahkan oleh PPKI pada tanggal 18 Agustus 1945.",
        type: "true_false",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        points: 5,
      },
      {
        id: 5,
        question: "Siapa presiden pertama Indonesia?",
        type: "multiple_choice",
        options: ["Ir. Soekarno", "Mohammad Hatta", "Soeharto", "B.J. Habibie"],
        correctAnswer: 0,
        points: 5,
      },
    ],
  },
  2: {
    id: 2,
    name: "Test Potensi Akademik",
    duration: 90,
    questions: [
      {
        id: 4,
        question: "Jika semua A adalah B, dan semua B adalah C, maka...",
        type: "multiple_choice",
        options: [
          "Semua A adalah C",
          "Semua C adalah A",
          "Tidak ada A yang C",
          "Sebagian A adalah C",
        ],
        correctAnswer: 0,
        points: 10,
      },
      {
        id: 5,
        question:
          "Deret angka: 2, 6, 12, 20, 30, ... Angka selanjutnya adalah?",
        type: "multiple_choice",
        options: ["40", "42", "44", "46"],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 8,
        question: "Jika 3x + 5 = 20, maka nilai x adalah...",
        type: "multiple_choice",
        options: ["3", "5", "7", "9"],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 9,
        question: 'Sinonim dari kata "KONSISTEN" adalah...',
        type: "multiple_choice",
        options: ["Berubah-ubah", "Tetap", "Dinamis", "Fleksibel"],
        correctAnswer: 1,
        points: 10,
      },
    ],
  },
  3: {
    id: 3,
    name: "Test Bahasa Inggris",
    duration: 60,
    questions: [
      {
        id: 6,
        question: "Choose the correct sentence:",
        type: "multiple_choice",
        options: [
          "She don't like coffee",
          "She doesn't like coffee",
          "She didn't likes coffee",
          "She doesn't likes coffee",
        ],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 7,
        question: 'What is the synonym of "difficult"?',
        type: "multiple_choice",
        options: ["Easy", "Hard", "Simple", "Clear"],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: 10,
        question: 'The past tense of "go" is "went".',
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: 0,
        points: 10,
      },
    ],
  },
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  testState.token = urlParams.get("token");
  testState.candidateName = urlParams.get("candidate");

  // If token or candidate missing, fall back to dummy data for local/testing
  if (!testState.token || !testState.candidateName) {
    console.warn(
      "Tidak ada parameter token/candidate di URL — menggunakan data dummy untuk testing lokal."
    );
    // Use any provided value, otherwise set safe defaults
    testState.token = testState.token || "dummy_1_local";
    testState.candidateName = testState.candidateName || "Test Kandidat";
    // Note: token format expected to be something like "xxx_<categoryId>_yyy".
    // We'll fallback to category 1 when parsing fails.
  }

  // Parse token to get category ID (expected token format: xxx_<categoryId>_yyy)
  const tokenParts = String(testState.token).split("_");
  testState.categoryId = parseInt(tokenParts[1]) || 1; // fallback to category 1 for dummy/test

  // Validate token and load test data
  if (!loadTestData()) {
    alert("Test tidak ditemukan atau sudah tidak berlaku!");
    return;
  }

  // Setup security measures
  setupSecurity();

  // Display candidate name
  document.getElementById(
    "candidateName"
  ).textContent = `Kandidat: ${testState.candidateName}`;
});

// Load test data from dummy
function loadTestData() {
  const category = dummyCategories[testState.categoryId];

  if (!category) {
    return false;
  }

  testState.categoryName = category.name;
  testState.questions = category.questions;
  testState.timeRemaining = category.duration * 60; // convert to seconds
  testState.answers = new Array(testState.questions.length).fill(null);

  document.getElementById("testTitle").textContent = category.name;

  return true;
}

// Start test
function startTest() {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("testContainer").style.display = "block";

  // Enter fullscreen
  enterFullscreen();

  // Start timer
  testState.isActive = true;
  testState.startTime = Date.now();
  startTimer();

  // Render first question
  renderQuestion();
  renderNavigationDots();
  updateProgress();
}

// Setup security measures
function setupSecurity() {
  // Prevent right click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showViolation("Klik kanan tidak diperbolehkan!");
  });

  // Prevent copy, cut, paste
  document.addEventListener("copy", (e) => {
    e.preventDefault();
    showViolation("Copy tidak diperbolehkan!");
  });

  document.addEventListener("cut", (e) => {
    e.preventDefault();
    showViolation("Cut tidak diperbolehkan!");
  });

  document.addEventListener("paste", (e) => {
    e.preventDefault();
  });

  // Prevent keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && e.key === "u")
    ) {
      e.preventDefault();
      showViolation("Developer tools tidak diperbolehkan!");
    }

    // Prevent Alt+Tab, Windows key
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      showViolation("Switching window tidak diperbolehkan!");
    }
  });

  // Detect page visibility change (tab switching)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && testState.isActive) {
      showViolation("Anda keluar dari halaman test!");
      showWarningOverlay(
        "Anda terdeteksi keluar dari halaman test! Ini akan dihitung sebagai pelanggaran."
      );
    }
  });

  // Detect window blur (switching to another app)
  window.addEventListener("blur", () => {
    if (testState.isActive) {
      showViolation("Anda berpindah ke aplikasi lain!");
      showWarningOverlay(
        "Anda terdeteksi berpindah ke aplikasi lain! Tetap fokus pada test."
      );
    }
  });

  // Detect fullscreen exit
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && testState.isActive) {
      showViolation("Anda keluar dari fullscreen mode!");
      showWarningOverlay(
        "Anda keluar dari fullscreen mode! Test harus dilakukan dalam fullscreen."
      );
      enterFullscreen();
    }
  });

  // Prevent navigation
  window.addEventListener("beforeunload", (e) => {
    if (testState.isActive) {
      e.preventDefault();
      e.returnValue = "";
      return "";
    }
  });
}

// Enter fullscreen
function enterFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch((err) => {
      console.error("Error entering fullscreen:", err);
    });
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

// Show violation
function showViolation(message) {
  testState.violations++;

  const badge = document.getElementById("violationBadge");
  const text = document.getElementById("violationText");
  text.textContent = `${message} (${testState.violations}/${testState.maxViolations})`;
  badge.style.display = "block";

  setTimeout(() => {
    badge.style.display = "none";
  }, 5000);

  // Auto submit if max violations reached
  if (testState.violations >= testState.maxViolations) {
    alert(
      "Anda telah mencapai batas maksimal pelanggaran! Test akan disubmit otomatis."
    );
    submitTest(true);
  }
}

// Show warning overlay
function showWarningOverlay(message) {
  document.getElementById("warningMessage").textContent = message;
  document.getElementById("violationCount").textContent = testState.violations;
  document.getElementById("warningOverlay").classList.add("active");
}

// Return to test
function returnToTest() {
  document.getElementById("warningOverlay").classList.remove("active");
  enterFullscreen();
}

// Start timer
function startTimer() {
  updateTimerDisplay();

  testState.timerInterval = setInterval(() => {
    testState.timeRemaining--;
    updateTimerDisplay();

    // Warning when 5 minutes left
    if (testState.timeRemaining === 300) {
      alert("Perhatian! Sisa waktu 5 menit!");
    }

    // Auto submit when time is up
    if (testState.timeRemaining <= 0) {
      clearInterval(testState.timerInterval);
      alert("Waktu habis! Test akan disubmit otomatis.");
      submitTest(true);
    }
  }, 1000);
}

// Update timer display
function updateTimerDisplay() {
  const hours = Math.floor(testState.timeRemaining / 3600);
  const minutes = Math.floor((testState.timeRemaining % 3600) / 60);
  const seconds = testState.timeRemaining % 60;

  const display = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
  document.getElementById("timerDisplay").textContent = display;

  // Add warning class when less than 5 minutes
  const timer = document.getElementById("timer");
  if (testState.timeRemaining <= 300) {
    timer.classList.add("warning");
  } else {
    timer.classList.remove("warning");
  }
}

// Render question
function renderQuestion() {
  const question = testState.questions[testState.currentQuestionIndex];
  const container = document.getElementById("questionContainer");

  const questionNumber = testState.currentQuestionIndex + 1;

  container.innerHTML = `
        <div class="question-card">
            <div class="mb-6">
                <div class="flex items-center gap-3 mb-4">
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Soal ${questionNumber}
                    </span>
                    <span class="text-gray-600 text-sm">
                        <i class="fas fa-star text-yellow-500"></i> ${
                          question.points
                        } poin
                    </span>
                </div>
                <h2 class="text-xl font-semibold text-gray-800">
                    ${question.question}
                </h2>
            </div>
            <div class="space-y-3">
                ${question.options
                  .map(
                    (option, index) => `
                    <button
                        class="option-btn ${
                          testState.answers[testState.currentQuestionIndex] ===
                          index
                            ? "selected"
                            : ""
                        }"
                        onclick="selectAnswer(${index})">
                        <div class="option-letter">${String.fromCharCode(
                          65 + index
                        )}</div>
                        <span class="flex-1">${option}</span>
                    </button>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;

  updateNavigationButtons();
}

// Select answer
function selectAnswer(optionIndex) {
  testState.answers[testState.currentQuestionIndex] = optionIndex;
  renderQuestion();
  renderNavigationDots();
}

// Navigation
function prevQuestion() {
  if (testState.currentQuestionIndex > 0) {
    testState.currentQuestionIndex--;
    renderQuestion();
    updateProgress();
    renderNavigationDots();
  }
}

function nextQuestion() {
  if (testState.currentQuestionIndex < testState.questions.length - 1) {
    testState.currentQuestionIndex++;
    renderQuestion();
    updateProgress();
    renderNavigationDots();
  }
}

function goToQuestion(index) {
  testState.currentQuestionIndex = index;
  renderQuestion();
  updateProgress();
  renderNavigationDots();
}

// Update navigation buttons
function updateNavigationButtons() {
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnSubmit = document.getElementById("btnSubmit");

  btnPrev.disabled = testState.currentQuestionIndex === 0;

  if (testState.currentQuestionIndex === testState.questions.length - 1) {
    btnNext.style.display = "none";
    btnSubmit.style.display = "inline-flex";
  } else {
    btnNext.style.display = "inline-flex";
    btnSubmit.style.display = "none";
  }
}

// Update progress
function updateProgress() {
  const progress =
    ((testState.currentQuestionIndex + 1) / testState.questions.length) * 100;
  document.getElementById("progressFill").style.width = `${progress}%`;
  document.getElementById("progressText").textContent = `Soal ${
    testState.currentQuestionIndex + 1
  } dari ${testState.questions.length}`;
}

// Render navigation dots
function renderNavigationDots() {
  const container = document.getElementById("navigationDots");
  container.innerHTML = testState.questions
    .map((_, index) => {
      const isAnswered = testState.answers[index] !== null;
      const isCurrent = index === testState.currentQuestionIndex;
      const classes = ["nav-dot"];
      if (isAnswered) classes.push("answered");
      if (isCurrent) classes.push("current");

      return `
            <button class="${classes.join(
              " "
            )}" onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    })
    .join("");
}

// Submit test
function submitTest(forced = false) {
  // Check unanswered questions
  const unanswered = testState.answers.filter((a) => a === null).length;

  if (!forced && unanswered > 0) {
    if (
      !confirm(
        `Anda masih memiliki ${unanswered} soal yang belum dijawab. Yakin ingin submit?`
      )
    ) {
      return;
    }
  }

  // Calculate score
  let correct = 0;
  let wrong = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  testState.questions.forEach((question, index) => {
    totalPoints += question.points;
    const userAnswer = testState.answers[index];

    if (userAnswer !== null && userAnswer === question.correctAnswer) {
      correct++;
      earnedPoints += question.points;
    } else if (userAnswer !== null) {
      wrong++;
    }
  });

  const score = Math.round((earnedPoints / totalPoints) * 100);

  // Stop timer
  testState.isActive = false;
  if (testState.timerInterval) {
    clearInterval(testState.timerInterval);
  }

  // Exit fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }

  // Show results
  showResults(score, correct, wrong);
}

// Show results
function showResults(score, correct, wrong) {
  document.getElementById("testContainer").style.display = "none";
  document.getElementById("resultScreen").style.display = "flex";

  document.getElementById("scoreValue").textContent = score;
  document.getElementById("correctAnswers").textContent = correct;
  document.getElementById("wrongAnswers").textContent = wrong;
  document.getElementById("violations").textContent = testState.violations;

  const scoreCircle = document.getElementById("scoreCircle");
  const resultMessage = document.getElementById("resultMessage");

  if (score >= 80) {
    scoreCircle.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";
    resultMessage.textContent = "Luar biasa! Hasil yang sangat memuaskan!";
  } else if (score >= 60) {
    scoreCircle.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
    resultMessage.textContent =
      "Bagus! Anda telah menyelesaikan test dengan baik.";
  } else {
    scoreCircle.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
    resultMessage.textContent = "Terus berlatih untuk hasil yang lebih baik!";
  }

  // Save result (in real app, send to backend)
  console.log("Test Results:", {
    token: testState.token,
    candidateName: testState.candidateName,
    categoryName: testState.categoryName,
    score: score,
    correct: correct,
    wrong: wrong,
    violations: testState.violations,
    answers: testState.answers,
    completedAt: new Date().toISOString(),
  });
}

console.log("Test Examination System loaded");
console.log("Security features enabled");
