import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  doc,
  runTransaction,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";

// Allowed Firebase users
const DEEPAK_UID = "qcv3WLgHY7MJ3KUeFrYIsbuegIf1";
const MITHRA_UID = "bUcWFDw5gbODe4PXUKYQgSoKKw33";

const questions = [
  "Namma first time pesunappo enna nenacha?",
  "Namma friendship start aanadhukku main reason enna?",
  "Enkitta first-ah unakku pudicha quality enna?",
  "Namma rendu perum close friends aanadhu eppo nu feel panra?",
  "Namma first conversation-la irundhu ippo varaikkum enna change aagirukku?",
  "Namma friendship-la unakku romba special-ah irukkura memory edhu?",
  "Enna paatha unakku first-ah nyabagam varra vishayam enna?",
  "Namma rendu perukkum mattum puriyura inside joke edhu?",
  "Namma friendship-ku oru song choose panna endha song?",
  "Namma friendship-ai oru word-la describe panna enna word?",
  "Namma rendu perula yaar romba over-ah pesuvaanga?",
  "Yaar first-ah sanda start pannuvaanga?",
  "Naan pannina funniest thing edhu?",
  "Namma rendu perum oru full day outing pona enna pannuvom?",
  "Enakku oru funny nickname vechaa enna vaippa?",
  "Naan unna hurt pannina, nee enna pannuva?",
  "Namma rendu perukkum misunderstanding vandha first yaar explain pannanum?",
  "Naan reply pannama irundha nee enna nenappa?",
  "Naan un mela kovama irundha, nee epdi samaadhaanapaduthuva?",
  "Namma fight-la nee solli, appuram regret pannina vaarthai edhavadhu irukka?",
  "Naan un feelings purinjikkaama pona, nee enna pannuva?",
  "Namma friendship-la biggest misunderstanding edhu?",
  "Oru fight nala namma friendship break aagura situation vandha, nee enna pannuva?",
  "Nee romba sad-ah irukkumbodhu naan enna pannanum?",
  "Naan silent-ah irundha, enakku enna problem nu nee epdi kandupidippa?",
  "Unakku ellarum against-ah irukkura maari feel aana, naan enna sollanum?",
  "Nee azhugumbodhu naan un pakkathula irundha enna expect pannuva?",
  "Naan en feelings hide pannina, nee enna pannuva?",
  "Unakku romba important-aana oru problem-ai ennoda share panna comfortable-ah irukkiya?",
  "Namma rendu perula yaar emotional-ah strong, yaar easy-ah hurt aaguvanga?",
  "Naan vera friend-kooda romba close-ah irundha unakku eppadi feel aagum?",
  "Enakku pudhu best friend vandha, nee enna nenappa?",
  "Naan unakku time kudukka mudiyama busy-ah irundha nee purinjippa?",
  "Namma friendship-la trust break aana, adhai thirumba build panna mudiyuma?",
  "Unakku en mela possessiveness irukka? Irundha enna situation-la?",
  "Naan un secret-ai accidental-ah share pannita enna pannuva?",
  "Namma friendship-la boundaries maintain panradhu important-ah?",
  "Naan oru periya mistake pannina, enna support pannuva illa first correct pannuva?",
  "Unakku oru problem irukku, aana naan help panna mudiyala na enna pannuva?",
  "Namma rendu perum different opinions vechirundha epdi handle pannuvom?",
  "Namma rendu perum romba busy aagi months-ah pesa mudiyala na friendship same-ah irukkuma?",
  "Yaaravadhu namma friendship-ai thappa pesina nee enna pannuva?",
  "Naan unakku important-aana oru event-ku vara mudiyala na nee epdi eduthuppa?",
  "Namma friendship-ai continue panna oru difficult decision edukka vendiya situation vandha enna pannuva?",
  "Five years later namma friendship epdi irukkanum nu aasai?",
  "Namma rendu perum achieve pannanum nu nee virumbura oru dream enna?",
  "Namma friendship-la nee change aaganum nu ninaikkura oru vishayam enna?",
  "Naan life-la romba successful aana, namma friendship epdi maintain pannuvom?",
  "Namma rendu perum distance-la irundhaalum friendship strong-ah irukka enna promise pannuva?",
  "Namma friendship-la evlo fights, misunderstandings vandhaalum, nee enakku solla virumbura kadaisi vaarthai enna?"
];

const $ = (id) => document.getElementById(id);

const loginSection = $("login-section");
const gameSection = $("game-section");
const authMessage = $("auth-message");
const gameMessage = $("game-message");
const answerInput = $("answer");
const questionText = $("question");
const submitButton = $("submit-answer");

const gameRef = doc(db, "friendshipGame", "main");

let currentUser = null;
let currentName = "";
let gameUnsubscribe = null;
let chatUnsubscribe = null;
let submitting = false;
let restartBusy = false;
let resultSection = null;

function getRole(user) {
  if (user.uid === DEEPAK_UID) return "Deepak";
  if (user.uid === MITHRA_UID) return "Mithra";
  return null;
}

function showMessage(element, message) {
  if (element) element.textContent = message;
}

function setBusy(button, busy) {
  if (button) button.disabled = busy;
}

function stopListeners() {
  if (gameUnsubscribe) gameUnsubscribe();
  if (chatUnsubscribe) chatUnsubscribe();
  gameUnsubscribe = null;
  chatUnsubscribe = null;
}

function authError(error) {
  const messages = {
    "auth/invalid-credential": "Email/password correct-ah check pannu.",
    "auth/user-not-found": "Indha email account kidaikkala.",
    "auth/wrong-password": "Password correct-ah check pannu.",
    "auth/invalid-email": "Email format correct illa.",
    "auth/email-already-in-use": "Indha email already registered.",
    "auth/weak-password": "Password minimum 6 characters venum.",
    "permission-denied": "Firestore Rules / UID permission check pannanum.",
    "unavailable": "Internet connection check pannitu retry pannu."
  };

  return messages[error.code] || error.message || "Something went wrong. Retry pannu da.";
}

async function initializeGame() {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(gameRef);

    // Existing progress-ai reset panna maatom.
    if (!snapshot.exists()) {
      transaction.set(gameRef, {
        currentIndex: 0,
        answers: {},
        lastAnswers: {},
        history: [],
        completedGames: [],
        updatedAt: serverTimestamp()
      });
    }
  });
}

// ---------- Login ----------

$("login-btn").addEventListener("click", async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    showMessage(authMessage, "Email and password enter pannu da.");
    return;
  }

  setBusy($("login-btn"), true);
  showMessage(authMessage, "Login aagudhu...");

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    if (!getRole(result.user)) {
      await signOut(auth);
      showMessage(authMessage, "Indha account allowed account illa.");
    }
  } catch (error) {
    showMessage(authMessage, authError(error));
  } finally {
    setBusy($("login-btn"), false);
  }
});

// Account creation is intentionally disabled.
// Existing allowed Deepak/Mithra accounts-ai use pannu.

// ---------- Auth state ----------

onAuthStateChanged(auth, async (user) => {
  stopListeners();
  currentUser = null;
  currentName = "";

  if (!user) {
    loginSection.hidden = false;
    gameSection.hidden = true;
    showMessage(authMessage, "");
    return;
  }

  const role = getRole(user);

  if (!role) {
    await signOut(auth);
    showMessage(authMessage, "Indha account-ku access permission illa.");
    return;
  }

  currentUser = user;
  currentName = role;

  loginSection.hidden = true;
  gameSection.hidden = false;
  $("welcome").textContent = `Welcome ${role} ❤️🐼`;
  showMessage(authMessage, "");
  showMessage(gameMessage, "Friendship world load aagudhu...");

  try {
    await initializeGame();
    listenToGame();
    listenToChat();
  } catch (error) {
    showMessage(gameMessage, authError(error));
  }
});

// ---------- Game UI ----------

function ensureResultSection() {
  if (resultSection) return resultSection;

  resultSection = document.createElement("section");
  resultSection.id = "friendship-final-result";
  resultSection.hidden = true;

  resultSection.style.cssText = `
    margin-top:24px;
    padding:18px;
    border-radius:20px;
    background:linear-gradient(135deg,#fff0f7,#f0eaff);
    color:#55264f;
    overflow-wrap:anywhere;
  `;

  gameSection.appendChild(resultSection);

  resultSection.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (button.dataset.action === "top") {
      gameSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (button.dataset.action === "restart") {
      await restartGame();
    }
  });

  return resultSection;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function renderFinalResult(game) {
  const result = ensureResultSection();
  const history = Array.isArray(game.history) ? [...game.history] : [];

  history.sort((a, b) => a.questionIndex - b.questionIndex);

  const deepakScore = history.filter(
    item => String(item.deepakAnswer ?? "").trim() !== ""
  ).length;

  const mithraScore = history.filter(
    item => String(item.mithraAnswer ?? "").trim() !== ""
  ).length;

  const matches = history.filter((item) =>
    normalized(item.deepakAnswer) !== "" &&
    normalized(item.deepakAnswer) === normalized(item.mithraAnswer)
  ).length;

  const rows = history.map((item) => {
    const same =
      normalized(item.deepakAnswer) !== "" &&
      normalized(item.deepakAnswer) === normalized(item.mithraAnswer);

    return `
      <article style="
        margin:12px 0;padding:14px;background:#fff;
        border-radius:14px;border:1px solid #f0d7e9;
      ">
        <strong>
          Q${Number(item.questionIndex) + 1}.
          ${escapeHTML(item.question || questions[item.questionIndex] || "")}
        </strong>
        <p><b>Deepak:</b> ${escapeHTML(item.deepakAnswer || "No answer")}</p>
        <p><b>Mithuu 🐼:</b> ${escapeHTML(item.mithraAnswer || "No answer")}</p>
        <span>${same ? "💗 Same answer" : "💭 Different answers"}</span>
      </article>
    `;
  }).join("");

  const missingCount = Math.max(0, 50 - history.length);

  result.hidden = false;
  questionText.hidden = true;
  answerInput.hidden = true;
  submitButton.hidden = true;

  result.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:42px">🎉💗🫂</div>
      <h2>50 Questions Complete!</h2>
      <p>Mithuu × Deepak — Our Little Universe ♾️</p>
    </div>

    <div style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(125px,1fr));
      gap:12px;margin:20px 0;
    ">
      <div style="padding:15px;background:white;border-radius:14px;text-align:center">
        <h3>Deepak ❤️</h3>
        <strong style="font-size:26px">${deepakScore}/50</strong>
        <p>Answers submitted</p>
      </div>
      <div style="padding:15px;background:white;border-radius:14px;text-align:center">
        <h3>Mithuu 🐼</h3>
        <strong style="font-size:26px">${mithraScore}/50</strong>
        <p>Answers submitted</p>
      </div>
      <div style="padding:15px;background:white;border-radius:14px;text-align:center">
        <h3>Answer Matches 💞</h3>
        <strong style="font-size:26px">${matches}/${history.length}</strong>
        <p>Same answers</p>
      </div>
    </div>

    <p>
      Note: Individual scores count submitted answers, not right or wrong
      answers. Matching answers are compared without case differences.
    </p>

    <h2>💌 Our Friendship Story</h2>
    <p>
      Answers same-ah irundhaalum different-ah irundhaalum,
      ovvoru answer-um namma friendship-ai innum nalla purinjikka
      oru chance. Sandai, misunderstanding, care, support —
      ellathayum thaandi namma friendship continue aaganum.
    </p>

    <h2 style="text-align:center">Best Friends Forever ❤️🫂♾️</h2>
    <p style="text-align:center">
      "Mithuu, nee en bestie mattum illa; en life-la special-aana
      oru person. Namma friendship-ku ending illa!" 💗
    </p>

    <h2>📖 Consolidated Answers (${history.length}/50)</h2>
    ${rows || "<p>Answer history innum available illa.</p>"}

    ${
      missingCount > 0
        ? `<p>⚠️ ${missingCount} question(s)-oda history missing. Old completed answers history save pannappadala.</p>`
        : ""
    }

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px">
      <button data-action="top" style="
        padding:12px 16px;border:0;border-radius:12px;
        background:#e8d5ff;color:#44205f;font-weight:bold;
      ">⬆️ Back to Game</button>

      <button data-action="restart" style="
        padding:12px 16px;border:0;border-radius:12px;
        background:#f6c5df;color:#55264f;font-weight:bold;
      ">🔁 Play Again</button>
    </div>
  `;

  showMessage(gameMessage, "Game complete! Ungaloda friendship report ready ❤️");
}

// ---------- Shared live game ----------

function listenToGame() {
  gameUnsubscribe = onSnapshot(
    gameRef,
    (snapshot) => {
      if (!snapshot.exists()) return;

      const game = snapshot.data();
      const index = Number(game.currentIndex || 0);
      const answers = game.answers || {};
      const myAnswer = answers[currentUser.uid] || "";
      const otherUid =
        currentUser.uid === DEEPAK_UID ? MITHRA_UID : DEEPAK_UID;
      const otherName =
        currentUser.uid === DEEPAK_UID ? "Mithuu" : "Deepak";

      if (index >= questions.length) {
        renderFinalResult(game);
        return;
      }

      questionText.hidden = false;

      const result = $("friendship-final-result");
      if (result) result.hidden = true;

      answerInput.hidden = false;
      submitButton.hidden = false;

      questionText.textContent =
        `Question ${index + 1} / ${questions.length}\n\n${questions[index]}`;

      answerInput.value = myAnswer;
      answerInput.disabled = Boolean(myAnswer);
      submitButton.disabled = Boolean(myAnswer) || submitting;

      if (myAnswer && answers[otherUid]) {
        showMessage(gameMessage, "Rendu perum answer panniteenga! Next question load aagum...");
      } else if (myAnswer) {
        showMessage(gameMessage, `${otherName} answer pannura vara wait pannu ❤️`);
      } else {
        showMessage(gameMessage, "Un answer type panni submit pannu 💌");
      }
    },
    (error) => showMessage(gameMessage, authError(error))
  );
}

// ---------- Submit shared answer ----------

submitButton.addEventListener("click", async () => {
  if (!currentUser || submitting) return;

  const answer = answerInput.value.trim();

  if (!answer) {
    showMessage(gameMessage, "Answer type pannitu submit pannu da.");
    return;
  }

  if (answer.length > 2000) {
    showMessage(gameMessage, "Answer 2000 characters-kulla irukkanum.");
    return;
  }

  submitting = true;
  setBusy(submitButton, true);
  showMessage(gameMessage, "Answer save aagudhu...");

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameRef);

      if (!snapshot.exists()) {
        throw new Error("Game not initialized. Refresh pannitu try pannu.");
      }

      const game = snapshot.data();
      const index = Number(game.currentIndex || 0);

      if (index >= questions.length) {
        throw new Error("50 questions already complete!");
      }

      const answers = { ...(game.answers || {}) };

      if (answers[currentUser.uid]) {
        throw new Error("Nee indha question-ku already answer pannita.");
      }

      answers[currentUser.uid] = answer;

      const otherUid =
        currentUser.uid === DEEPAK_UID ? MITHRA_UID : DEEPAK_UID;

      if (answers[otherUid]) {
        // Both answers exist: save this question permanently in history.
        const deepakAnswer = answers[DEEPAK_UID] || "";
        const mithraAnswer = answers[MITHRA_UID] || "";

        const history = Array.isArray(game.history)
          ? [...game.history]
          : [];

        // Avoid duplicate question records if a transaction retries.
        const alreadySaved = history.some(
          item => Number(item.questionIndex) === index
        );

        if (!alreadySaved) {
          history.push({
            questionIndex: index,
            question: questions[index],
            deepakAnswer,
            mithraAnswer
          });
        }

        transaction.update(gameRef, {
          currentIndex: index + 1,
          answers: {},
          lastAnswers: answers,
          history,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.update(gameRef, {
          answers,
          updatedAt: serverTimestamp()
        });
      }
    });

    answerInput.value = "";
  } catch (error) {
    showMessage(gameMessage, authError(error));
  } finally {
    submitting = false;
    setBusy(submitButton, false);
  }
});

// ---------- Play Again ----------
// Saves the completed run in completedGames before starting a new run.
// Both users share the same game state, so restart affects both.

async function restartGame() {
  if (!currentUser || restartBusy) return;

  const confirmed = window.confirm(
    "Play Again start pannalama? Current result saved as previous game. Rendu perukkum new game start aagum."
  );

  if (!confirmed) return;

  restartBusy = true;
  showMessage(gameMessage, "New game start aagudhu...");

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameRef);

      if (!snapshot.exists()) {
        throw new Error("Game data kidaikkala. Refresh panni try pannu.");
      }

      const game = snapshot.data();

      if (Number(game.currentIndex || 0) < questions.length) {
        throw new Error("Current game complete aana piragu Play Again use pannu.");
      }

      const completedGames = Array.isArray(game.completedGames)
        ? [...game.completedGames]
        : [];

      completedGames.push({
        history: Array.isArray(game.history) ? game.history : [],
        completedAt: new Date().toISOString()
      });

      transaction.update(gameRef, {
        currentIndex: 0,
        answers: {},
        lastAnswers: {},
        history: [],
        completedGames,
        updatedAt: serverTimestamp()
      });
    });

    showMessage(gameMessage, "New game ready! Question 1 start pannalaam ❤️");
  } catch (error) {
    showMessage(gameMessage, authError(error));
  } finally {
    restartBusy = false;
  }
}

// ---------- Live chat ----------

function listenToChat() {
  const chatQuery = query(
    collection(db, "friendshipChat"),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  chatUnsubscribe = onSnapshot(
    chatQuery,
    (snapshot) => {
      const box = $("chat-messages");
      if (!box) return;

      box.replaceChildren();

      snapshot.forEach((messageDoc) => {
        const message = messageDoc.data();

        const row = document.createElement("div");
        row.className =
          "chat-message" +
          (message.uid === currentUser?.uid ? " own-message" : "");

        const name = document.createElement("strong");
        name.textContent = message.name || "Bestie";

        const text = document.createElement("p");
        text.textContent = message.text || "";

        const time = document.createElement("small");
        if (message.createdAt?.toDate) {
          time.textContent = message.createdAt.toDate().toLocaleString();
        }

        row.append(name, text, time);
        box.appendChild(row);
      });

      box.scrollTop = box.scrollHeight;
    },
    (error) => showMessage(gameMessage, authError(error))
  );
}

const sendButton = $("send-btn");
const chatInput = $("chat-input");

if (!sendButton || !chatInput) {
  console.error("Chat elements missing:", {
    sendButtonFound: !!sendButton,
    chatInputFound: !!chatInput
  });
} else {
  sendButton.addEventListener("click", () => {
    console.log("Send button clicked");
    sendChat();
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendChat();
    }
  });
      }

      
