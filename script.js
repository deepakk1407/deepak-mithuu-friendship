
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";

// The UIDs must match the two users allowed by your Firestore rules.
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

let currentUser = null;
let currentName = "";
let gameUnsubscribe = null;
let chatUnsubscribe = null;
let submitting = false;

const gameRef = doc(db, "friendshipGame", "main");

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

async function initializeGame() {
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(gameRef);

    // Create initial state only once; never reset existing progress.
    if (!snapshot.exists()) {
      transaction.set(gameRef, {
        currentIndex: 0,
        answers: {},
        lastAnswers: {},
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
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (!getRole(result.user)) {
      await signOut(auth);
      showMessage(
        authMessage,
        "Indha account Deepak/Mithra allowed account illa. Correct account use pannu."
      );
    }
  } catch (error) {
    showMessage(authMessage, authError(error));
  } finally {
    setBusy($("login-btn"), false);
  }
});

// ---------- Create account ----------
// Only the two UIDs already allowed in Firestore rules can use the app.
// A newly created account gets a different UID and will not be authorized.

$("signup-btn").addEventListener("click", async () => {
  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!["Deepak", "Mithra"].includes(name)) {
    showMessage(authMessage, "Name Deepak illa Mithra nu enter pannu.");
    return;
  }

  if (!email || password.length < 6) {
    showMessage(
      authMessage,
      "Valid email and minimum 6-character password enter pannu."
    );
    return;
  }

  showMessage(
    authMessage,
    "Rendu accounts already irundha Login use pannu. Pudhu account create panna UID allowlist update thevai."
  );
});

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
        currentUser.uid === DEEPAK_UID ? "Mithra" : "Deepak";

      if (index >= questions.length) {
        questionText.textContent =
          "50 questions complete! Namma friendship-ku ending illa ♾️❤️";
        answerInput.hidden = true;
        submitButton.hidden = true;
        showMessage(gameMessage, "Best Friends Forever 🫂");
        return;
      }

      answerInput.hidden = false;
      submitButton.hidden = false;
      questionText.textContent =
        `Question ${index + 1} / ${questions.length}\n\n${questions[index]}`;

      // Keep this user's saved answer visible after refresh.
      answerInput.value = myAnswer;
      answerInput.disabled = Boolean(myAnswer);
      submitButton.disabled = Boolean(myAnswer) || submitting;

      if (myAnswer && answers[otherUid]) {
        showMessage(gameMessage, "Rendu perum answer panniteenga! Next question load aagum...");
      } else if (myAnswer) {
        showMessage(gameMessage, `${otherName-""} answer pannura vara wait pannu ❤️`);
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

      // A user can submit only once for the current question.
      if (answers[currentUser.uid]) {
        throw new Error("Nee indha question-ku already answer pannita.");
      }

      answers[currentUser.uid] = answer;

      const otherUid =
        currentUser.uid === DEEPAK_UID ? MITHRA_UID : DEEPAK_UID;

      if (answers[otherUid]) {
        transaction.update(gameRef, {
          currentIndex: index + 1,
          answers: {},
          lastAnswers: answers,
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

$("send-btn").addEventListener("click", sendChat);

$("chat-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendChat();
});

async function sendChat() {
  if (!currentUser || !currentName) return;

  const input = $("chat-input");
  const text = input.value.trim();

  if (!text) return;

  if (text.length > 1000) {
    showMessage(gameMessage, "Chat message 1000 characters-kulla irukkanum.");
    return;
  }

  setBusy($("send-btn"), true);

  try {
    await addDoc(collection(db, "friendshipChat"), {
      uid: currentUser.uid,
      name: currentName,
      text,
      createdAt: serverTimestamp()
    });

    input.value = "";
  } catch (error) {
    showMessage(gameMessage, authError(error));
  } finally {
    setBusy($("send-btn"), false);
  }
}

// ---------- Logout ----------

$("logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showMessage(gameMessage, authError(error));
  }
});

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

  return messages[error.code] ||
    error.message ||
    "Something went wrong. Retry pannu da.";
    }
                              
