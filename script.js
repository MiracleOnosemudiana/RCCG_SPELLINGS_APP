// Load words from local storage or initialize categories
let words = JSON.parse(localStorage.getItem("words")) || {
    "6-8": [],
    "9-12": [],
    "13-15": [],
    "16-19": []
};

// Quiz-related variables
let currentCategory = "";
let quizWords;
let currentQuestionIndex;
let userName;
let quizStartTime;

// Timer variables
let timerInterval;
let timeLeft = 10 * 60; // 1 minute (adjust as needed)

document.addEventListener("DOMContentLoaded", function () {
    loadResults();
});

//REGISTER THE SERVICE WORKER
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(err => console.log("Service Worker Registration Failed:", err));
}


// Admin authentication functions
function adminLogin() {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;

    if (username === "admin" && password === "rccg") {
        localStorage.setItem("isAdminLoggedIn", "true");
        window.location.href = "admin-dashboard.html";
    } else {
        alert("Invalid username or password");
    }
}

function adminLogout() {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.replace("index.html");
}

function togglePassword() {
    let passwordField = document.getElementById("admin-password");
    let lockIcon = document.getElementById("lock-icon");

    // Toggle password visibility
    passwordField.type = passwordField.type === "password" ? "text" : "password";
    lockIcon.textContent = passwordField.type === "password" ? "🔒" : "🔓";
}

//Select between Add-words-section and view-results-section
function showSection(sectionId) {
    let addWordsSection = document.getElementById("add-words-section");
    let viewResultsSection = document.getElementById("view-results-section");
    document.getElementById("set-timer-section").style.display = "none";

    if (!addWordsSection || !viewResultsSection) {
        console.error("One or more sections are missing in the HTML.");
        return;
    }

    // Hide both sections
    addWordsSection.style.display = "none";
    viewResultsSection.style.display = "none";

    // Show the selected section
    let section = document.getElementById(sectionId);
    if (section) {
        section.style.display = "block";
    } else {
        console.error(`Section with ID '${sectionId}' not found.`);
    }

    // If viewing results, load them
    if (sectionId === "view-results-section") {
        loadAdminResults();
    }
}

//Adding questions functions
function setAddCategory(category) {
    currentCategory = category;
    document.getElementById("current-category").innerText = currentCategory || "Not selected";

    document.getElementById("word-list-current-category").innerText = currentCategory || "Not selected";

    let wordListHeading = document.getElementById("word-list-heading");
    let clearAllBtn = document.getElementById("clear-all-words");

    if (category && words[currentCategory].length > 0) {
        wordListHeading.classList.remove("hidden");
        clearAllBtn.classList.remove("hidden");
    } else {
        wordListHeading.classList.add("hidden");
        clearAllBtn.classList.add("hidden");
    }

    updateWordList();
}

function addBulkWords() {
    let bulkInput = document.getElementById("bulk-words").value.trim();

    if (!currentCategory) {
        alert("Please select a category before adding words.");
        return;
    }

    if (bulkInput) {
        let newWords = bulkInput.split(",").map(word => word.trim()).filter(word => word !== "");

        if (newWords.length > 0) {
            words[currentCategory] = words[currentCategory].concat(newWords);
            localStorage.setItem("words", JSON.stringify(words));
            document.getElementById("bulk-words").value = "";
            updateWordList();
            alert(`${newWords.length} words added successfully!`);
        } else {
            alert("No valid words found. Please enter words separated by commas.");
        }
    } else {
        alert("Please enter words.");
    }
}

function updateWordList() {
    let listElement = document.getElementById("word-list");
    let clearAllBtn = document.getElementById("clear-all-words");
    let wordListHeading = document.getElementById("word-list-heading");

    listElement.innerHTML = "";

    if (currentCategory && words[currentCategory].length > 0) {
        words[currentCategory].forEach((word, index) => {
            let li = document.createElement("li");
            li.innerHTML = `${index + 1}. ${word} 
                <button onclick="editWord(${index})">✏️ Edit</button> 
                <button onclick="deleteWord(${index})">🗑️ Delete</button>`;

            listElement.appendChild(li);
        });

        wordListHeading.classList.remove("hidden");
        // Show "Clear All Words" button only if words exist
        clearAllBtn.classList.remove("hidden");
    } else {
        // Hide "Clear All Words" button if no words are available
        wordListHeading.classList.add("hidden");
        clearAllBtn.classList.add("hidden");
    }
}

function editWord(index) {
    let newWord = prompt("Enter the new word:", words[currentCategory][index]);
    if (newWord) {
        words[currentCategory][index] = newWord.trim();
        localStorage.setItem("words", JSON.stringify(words));
        updateWordList();
    }
}

function deleteWord(index) {
    if (confirm("Are you sure you want to delete this word?")) {
        words[currentCategory].splice(index, 1);
        localStorage.setItem("words", JSON.stringify(words));
        updateWordList();
    }
}

function clearAllWords() {
    if (!currentCategory) {
        alert("Please select a category first.");
        return;
    }

    if (confirm(`Are you sure you want to delete all words in the "${currentCategory}" category?`)) {
        words[currentCategory] = []; // Clear words in the selected category
        localStorage.setItem("words", JSON.stringify(words)); // Update local storage
        updateWordList(); // Refresh the list

        document.getElementById("word-list-heading").classList.add("hidden")

        // Hide the "Clear All Words" button if no words remain
        document.getElementById("clear-all-words").classList.add("hidden");

        alert("All words have been cleared.");
    }
}



// Function to save quiz time
function setQuizTime() {
    let timeInput = document.getElementById("quiz-time").value;
    if (timeInput > 0) {
        localStorage.setItem("quizTime", timeInput);
        document.getElementById("current-time").textContent = timeInput + " min";
        alert("Quiz time set to " + timeInput + " minutes.");
    } else {
        alert("Please enter a valid time.");
    }
}

// Function to load saved timer when the page loads
document.addEventListener("DOMContentLoaded", function () {
    let savedTime = localStorage.getItem("quizTime");
    if (savedTime) {
        let currentTimeElement = document.getElementById("current-time");
        if (currentTimeElement) {
            currentTimeElement.textContent = savedTime + " min";
        }
    }
});


// Quiz initialization functions
function showStartButton() {
    document.getElementById("start-quiz").classList.toggle("hidden", !document.getElementById("quiz-category").value);
}

function startQuiz() {
    // Store quiz start time
    quizStartTime = new Date().getTime();
    currentQuestionIndex = 0;

    // Get user details
    userName = document.getElementById("user-name").value.trim();
    if (!userName) return alert("Please enter your name before starting the quiz.");

    // Get selected category
    currentCategory = document.getElementById("quiz-category").value;
    if (!currentCategory) return alert("Please select a category.");

    // Get words for the selected category
    quizWords = words[currentCategory] || [];
    if (quizWords.length === 0) return alert("No questions available in the selected category.");

    // Save user name for session tracking
    localStorage.setItem("currentUser", userName);

    // Hide the intro section, show quiz area
    document.getElementById("take-quiz-intro").style.display = "none";
    document.getElementById("quiz-area").classList.remove("hidden");

    // Start the timer
    startTimer();

    // Load the first question
    updateQuestion();
}


// Timer functions
function startTimer() {
    // Clear any existing timer interval
    clearInterval(timerInterval);

    // Get saved time from admin settings (or default to 5 minutes)
    let savedTime = localStorage.getItem("quizTime");
    let timeLeft = savedTime ? parseInt(savedTime) * 60 : 300; // Convert minutes to seconds

    // Get the timer display element
    let timerElement = document.getElementById("timer");

    // Start the countdown
    timerInterval = setInterval(() => {
        let hours = Math.floor(timeLeft / 3600);
        let minutes = Math.floor((timeLeft % 3600) / 60); // Correct minutes calculation
        let seconds = timeLeft % 60;

        // Display time in HH:MM:SS format
        timerElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // When time runs out, submit the quiz automatically
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Submitting quiz automatically.");
            submitQuiz();
        } else {
            timeLeft--; // Decrease time
        }
    }, 1000);
}


function updateTimerDisplay() {
    let hours = Math.floor(timeLeft / 3600);
    let minutes = Math.floor((timeLeft % 3600) / 60);
    let seconds = timeLeft % 60;

    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

// Quiz interaction functions
function pronounceWord() {
    if (quizWords.length === 0) return;
    let utterance = new SpeechSynthesisUtterance(quizWords[currentQuestionIndex]);
    speechSynthesis.speak(utterance);
}

function nextQuestion() {
    updateAnswer();
    if (currentQuestionIndex < quizWords.length - 1) {
        currentQuestionIndex++;
        updateQuestion();
    }
}

function previousQuestion() {
    updateAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestion();
    }
}

function updateQuestion() {
    document.getElementById("question").textContent = `Question ${currentQuestionIndex + 1}`;
    pronounceWord();

    // Load saved answer for the current questionF
    document.getElementById("answer").value = userAnswers[currentQuestionIndex] || "";

    document.getElementById("prev-btn").classList.toggle("hidden", currentQuestionIndex === 0);
    document.getElementById("next-btn").classList.toggle("hidden", currentQuestionIndex === quizWords.length - 1);
}

// Answer handling
let userAnswers = {};
function updateAnswer() {
    userAnswers[currentQuestionIndex] = document.getElementById("answer").value.trim().toLowerCase();
}

// Update answer when user types
document.getElementById("answer").addEventListener("input", updateAnswer);

// Quiz submission functions
function submitQuiz() {
    clearInterval(timerInterval);

    document.getElementById("quiz-area").classList.add("hidden");

    let { correctCount, totalQuestions } = calculateScore();
    let percentage = ((correctCount / totalQuestions) * 100).toFixed(2);
    let timeUsedFormatted = formatTimeUsed(new Date().getTime() - quizStartTime);


    // Show the result modal
    document.getElementById("user-result-modal").classList.remove("hidden");
    document.getElementById("user-result-modal").style.display = "flex";

    document.getElementById("user-result-text").innerHTML = `You scored ${correctCount} out of ${totalQuestions} (${percentage}%)<br>Time Used: <strong>${timeUsedFormatted}</strong>`;

    // Save result to localStorage
    saveQuizResult(correctCount, totalQuestions, timeUsedFormatted);
}

function calculateScore() {
    let correctCount = 0;
    let totalQuestions = quizWords.length;
    for (let i = 0; i < totalQuestions; i++) {
        if (userAnswers[i] === quizWords[i].toLowerCase()) correctCount++;
    }
    return { correctCount, totalQuestions };
}

function formatTimeUsed(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

//User result modal
function openUserResultModal(score, totalQuestions, timeUsed) {
    document.getElementById("user-result-text").innerHTML =
        `You scored ${score} out of ${totalQuestions}.<br>Time used: ${timeUsed}`;
    document.getElementById("user-result-modal").classList.remove("hidden");
}

function closeUserResultModal() {
    document.getElementById("user-result-modal").classList.add("hidden");
    window.location.href = "index.html"; // Redirect to home page
}

// Admin result functions
function loadAdminResults() {
    let resultsTable = document.getElementById("admin-results-table");
    resultsTable.innerHTML = ""; // Clear old data
    let results = JSON.parse(localStorage.getItem("quizResults")) || [];
    if (results.length === 0) {
        resultsTable.innerHTML = "<tr><td colspan='6'>No results found</td></tr>";
        return;
    }
    results.forEach((result, index) => {
        resultsTable.innerHTML += `<tr><td>${result.name}</td><td>${result.category}</td><td>${result.score}</td><td>${result.dateTime}</td><td>${result.timeUsed}</td><td><button onclick="deleteResult(${index})">Delete</button></td></tr>`;
    });
}

function showAdminResultsModal() {
    document.getElementById("admin-results-modal").classList.remove("hidden");
    loadAdminResults();
}

function closeAdminResultsModal() {
    document.getElementById("admin-results-modal").classList.add("hidden");
}

function deleteResult(index) {
    let results = JSON.parse(localStorage.getItem("quizResults")) || [];
    results.splice(index, 1);
    localStorage.setItem("quizResults", JSON.stringify(results));
    loadAdminResults(); // Reload the table after deletion
}

function clearAllResults() {
    if (confirm("Are you sure you want to delete all results?")) {
        localStorage.removeItem("quizResults");
        loadAdminResults(); // Reload the table after clearing
    }
}

// Save and load results
function saveQuizResult(correctCount, totalQuestions, timeUsed) {
    let result = {
        name: localStorage.getItem("currentUser") || "Unknown",
        category: currentCategory,
        score: `${correctCount} / ${totalQuestions}`,
        dateTime: new Date().toLocaleString(),
        timeUsed: timeUsed
    };
    let results = JSON.parse(localStorage.getItem("quizResults")) || [];
    results.push(result);
    localStorage.setItem("quizResults", JSON.stringify(results));
}

// document.addEventListener("DOMContentLoaded", loadResults);

function loadResults() {
    let resultsTable = document.getElementById("results-table");
    // resultsTable.innerHTML = "";
    let resultMessage = document.getElementById("user-result-text");

    if (!resultsTable || !resultMessage) {
        console.error("Results table or result message not found.");
        return;
    }

    // Retrieve last quiz result from sessionStorage
    let lastResult = JSON.parse(sessionStorage.getItem("lastQuizResult"));

    if (lastResult) {
        resultMessage.innerHTML = `You scored ${lastResult.correctCount} out of ${lastResult.totalQuestions} (${lastResult.percentage}%)`;
    } else {
        resultMessage.innerHTML = "No recent quiz results found.";
    }

    let results = JSON.parse(localStorage.getItem("quizResults")) || [];
    if (results.length === 0) {
        resultsTable.innerHTML = "<tr><td colspan='5'>No results found.</td></tr>";
        return;
    }
    results.forEach(result => {
        resultsTable.innerHTML += `<tr><td>${result.name}</td><td>${result.category}</td><td>${result.score}</td><td>${result.dateTime}</td></tr>`;
    });
}
