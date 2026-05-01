const denominations = [50, 10, 5, 1];
const tapModes = ["double", "single"];
const TAP_DISTANCE = 12;
const DOUBLE_TAP_MS = 430;
const priceRanges = {
  under100: { min: 1, max: 99 },
  under200: { min: 100, max: 199 },
  under500: { min: 1, max: 499 },
};

const dom = {
  score: document.querySelector("#score"),
  streak: document.querySelector("#streak"),
  correctCount: document.querySelector("#correctCount"),
  wrongCount: document.querySelector("#wrongCount"),
  roundNumber: document.querySelector("#roundNumber"),
  targetAmount: document.querySelector("#targetAmount"),
  currentTotal: document.querySelector("#currentTotal"),
  placedCoins: document.querySelector("#placedCoins"),
  dropZone: document.querySelector("#dropZone"),
  dropZoneTitle: document.querySelector("#dropZoneTitle"),
  emptyHint: document.querySelector("#emptyHint"),
  questionCoins: document.querySelector("#questionCoins"),
  feedback: document.querySelector("#feedback"),
  payMode: document.querySelector("#payMode"),
  countMode: document.querySelector("#countMode"),
  payChallenge: document.querySelector("#payChallenge"),
  countChallenge: document.querySelector("#countChallenge"),
  answerPanel: document.querySelector("#answerPanel"),
  answerValue: document.querySelector("#answerValue"),
  checkButton: document.querySelector("#checkButton"),
  clearButton: document.querySelector("#clearButton"),
  undoButton: document.querySelector("#undoButton"),
  newRoundButton: document.querySelector("#newRoundButton"),
  soundToggle: document.querySelector("#soundToggle"),
  soundIcon: document.querySelector("#soundIcon"),
  numberPad: document.querySelector(".number-pad"),
  coinBank: document.querySelector(".coin-bank"),
  rangeButtons: document.querySelectorAll("[data-range]"),
  tapModeButtons: document.querySelectorAll("[data-tap-mode]"),
};

const savedRange = localStorage.getItem("coinGameRange");
const savedTapMode = localStorage.getItem("coinGameTapMode");

const state = {
  mode: "pay",
  range: priceRanges[savedRange] ? savedRange : "under100",
  tapMode: tapModes.includes(savedTapMode) ? savedTapMode : "double",
  score: 0,
  streak: 0,
  correctCount: 0,
  wrongCount: 0,
  round: 1,
  target: 0,
  placed: [],
  question: [],
  answer: "",
  muted: localStorage.getItem("coinGameMuted") === "true",
};

let audioContext;
let dragState = null;
let lastCoinTap = { action: null, value: null, index: null, time: 0 };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function coinClass(value) {
  return `coin-${value}`;
}

function makeCoin(value, extraClass = "") {
  const coin = document.createElement("button");
  coin.type = "button";
  coin.className = `coin ${coinClass(value)} ${extraClass}`.trim();
  coin.dataset.coin = String(value);
  coin.setAttribute("aria-label", `${value}元硬幣`);
  coin.innerHTML = `<span>${value}</span>`;
  return coin;
}

function moneyText(value) {
  return `$${value}`;
}

function setFeedback(message, status = "") {
  dom.feedback.textContent = message;
  dom.feedback.classList.toggle("is-correct", status === "correct");
  dom.feedback.classList.toggle("is-wrong", status === "wrong");
}

function updateScoreboard() {
  dom.score.textContent = String(state.score);
  dom.streak.textContent = String(state.streak);
  dom.correctCount.textContent = String(state.correctCount);
  dom.wrongCount.textContent = String(state.wrongCount);
  dom.roundNumber.textContent = String(state.round);
}

function updateSoundButton() {
  dom.soundToggle.classList.toggle("is-muted", state.muted);
  dom.soundToggle.setAttribute("aria-pressed", String(state.muted));
  dom.soundIcon.textContent = state.muted ? "×" : "♪";
}

function updateRangeButtons() {
  dom.rangeButtons.forEach((button) => {
    const isActive = button.dataset.range === state.range;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateTapModeButtons() {
  dom.tapModeButtons.forEach((button) => {
    const isActive = button.dataset.tapMode === state.tapMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function currentPlacedTotal() {
  return state.placed.reduce((sum, value) => sum + value, 0);
}

function resetCoinTap() {
  lastCoinTap = { action: null, value: null, index: null, time: 0 };
}

function addCoinToPayment(value) {
  state.placed.push(value);
  updatePaymentView();
  setFeedback(`已放入 ${value} 元，目前共 ${currentPlacedTotal()} 元`);
}

function removeCoinFromPayment(index) {
  const value = state.placed[index];
  if (value === undefined) return;

  state.placed.splice(index, 1);
  updatePaymentView();
  setFeedback(`已拿掉 ${value} 元，目前共 ${currentPlacedTotal()} 元`);
}

function updatePaymentView() {
  const total = currentPlacedTotal();
  dom.currentTotal.textContent = moneyText(total);
  dom.placedCoins.innerHTML = "";

  state.placed.forEach((value, index) => {
    const coin = makeCoin(value);
    coin.dataset.index = String(index);
    coin.title = state.tapMode === "single" ? "拖出付款盤或點一下移除" : "拖出付款盤或連點兩次移除";
    dom.placedCoins.appendChild(coin);
  });

  dom.dropZone.classList.toggle("has-coins", state.placed.length > 0);
}

function updateAnswerView() {
  dom.answerValue.textContent = state.answer || "0";
}

function generateTargetAmount() {
  const range = priceRanges[state.range];
  return randomInt(range.min, range.max);
}

function makeCoinsForAmount(amount) {
  const coins = [];
  let remaining = amount;

  denominations.forEach((value) => {
    const count = Math.floor(remaining / value);
    remaining -= count * value;

    for (let i = 0; i < count; i += 1) {
      coins.push(value);
    }
  });

  return coins;
}

function generateCoinQuestion() {
  const target = generateTargetAmount();
  const coins = makeCoinsForAmount(target);

  return coins.sort((a, b) => b - a);
}

function renderQuestionCoins() {
  dom.questionCoins.innerHTML = "";
  state.question.forEach((value) => {
    dom.questionCoins.appendChild(makeCoin(value));
  });
}

function setMode(mode) {
  state.mode = mode;
  state.placed = [];
  state.answer = "";

  const isPay = mode === "pay";
  dom.payMode.classList.toggle("is-active", isPay);
  dom.countMode.classList.toggle("is-active", !isPay);
  dom.payMode.setAttribute("aria-selected", String(isPay));
  dom.countMode.setAttribute("aria-selected", String(!isPay));
  dom.payChallenge.classList.toggle("is-hidden", !isPay);
  dom.countChallenge.classList.toggle("is-hidden", isPay);
  dom.dropZone.classList.toggle("is-hidden", !isPay);
  dom.answerPanel.classList.toggle("is-hidden", isPay);
  dom.coinBank.classList.toggle("is-hidden", !isPay);
  dom.undoButton.classList.toggle("is-hidden", !isPay);
  dom.clearButton.classList.toggle("is-hidden", false);
  dom.dropZoneTitle.textContent = "付款盤";

  newRound(false);
}

function setRange(range) {
  if (!priceRanges[range] || state.range === range) return;

  state.range = range;
  localStorage.setItem("coinGameRange", range);
  updateRangeButtons();
  newRound(false);
}

function setTapMode(tapMode) {
  if (!tapModes.includes(tapMode) || state.tapMode === tapMode) return;

  state.tapMode = tapMode;
  localStorage.setItem("coinGameTapMode", tapMode);
  resetCoinTap();
  updateTapModeButtons();
  updatePaymentView();
  setFeedback(tapMode === "single" ? "點一下硬幣就會放入" : "連點兩次硬幣就會放入");
}

function newRound(advance = true) {
  if (advance) {
    state.round += 1;
  }

  state.placed = [];
  state.answer = "";
  resetCoinTap();

  if (state.mode === "pay") {
    state.target = generateTargetAmount();
    dom.targetAmount.textContent = String(state.target);
    setFeedback("拖曳或點硬幣，付出剛好的金額；放錯可拖出付款盤");
  } else {
    state.question = generateCoinQuestion();
    state.target = state.question.reduce((sum, value) => sum + value, 0);
    renderQuestionCoins();
    setFeedback("算出這些硬幣一共有多少元");
  }

  updateScoreboard();
  updatePaymentView();
  updateAnswerView();
}

function awardCorrect() {
  state.streak += 1;
  state.correctCount += 1;
  state.score += 10 + Math.min(10, state.streak * 2);
  updateScoreboard();
  playMelody("correct");
  setFeedback(`答對了，得到 ${state.target} 元`, "correct");

  window.setTimeout(() => {
    newRound(true);
  }, 1150);
}

function markWrong(message) {
  state.streak = 0;
  state.wrongCount += 1;
  updateScoreboard();
  playMelody("wrong");
  setFeedback(message, "wrong");
}

function checkAnswer() {
  if (state.mode === "pay") {
    const total = currentPlacedTotal();
    if (total === state.target) {
      awardCorrect();
      return;
    }

    const diff = Math.abs(state.target - total);
    markWrong(total < state.target ? `還少 ${diff} 元` : `多了 ${diff} 元`);
    return;
  }

  const answer = Number(state.answer || 0);
  if (answer === state.target) {
    awardCorrect();
    return;
  }

  markWrong(answer < state.target ? "答案太小了" : "答案太大了");
}

function clearCurrentInput() {
  resetCoinTap();

  if (state.mode === "pay") {
    state.placed = [];
    updatePaymentView();
  } else {
    state.answer = "";
    updateAnswerView();
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playNote(ctx, start, frequency, duration, type, gainLevel) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainLevel, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function playMelody(kind) {
  if (state.muted) return;

  const ctx = ensureAudioContext();
  const now = ctx.currentTime + 0.02;

  if (kind === "correct") {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      playNote(ctx, now + index * 0.105, freq, 0.18, "triangle", 0.18);
    });
    playNote(ctx, now + 0.34, 1318.51, 0.22, "sine", 0.09);
  } else {
    [392, 329.63, 246.94].forEach((freq, index) => {
      playNote(ctx, now + index * 0.13, freq, 0.2, "sawtooth", 0.11);
    });
  }
}

function pointIsInside(element, x, y) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function moveGhost(clientX, clientY) {
  if (!dragState) return;
  const isInsideDropZone = pointIsInside(dom.dropZone, clientX, clientY);

  dragState.ghost.style.transform = `translate3d(${clientX - dragState.offsetX}px, ${clientY - dragState.offsetY}px, 0)`;
  dom.dropZone.classList.toggle("is-ready", dragState.source === "bank" && isInsideDropZone);
  dom.dropZone.classList.toggle("is-removing", dragState.source === "placed" && !isInsideDropZone);
}

function runCoinTapAction(action, value, index = null) {
  if (action === "add") {
    addCoinToPayment(value);
    return;
  }

  removeCoinFromPayment(index);
}

function handleCoinTap(action, value, index = null) {
  if (state.tapMode === "single") {
    runCoinTapAction(action, value, index);
    return;
  }

  const now = Date.now();
  const isSameTap =
    lastCoinTap.action === action &&
    lastCoinTap.value === value &&
    (action === "add" || lastCoinTap.index === index);
  const isSecondTap = isSameTap && now - lastCoinTap.time <= DOUBLE_TAP_MS;

  if (isSecondTap) {
    runCoinTapAction(action, value, index);
    resetCoinTap();
    return;
  }

  lastCoinTap = { action, value, index, time: now };
  setFeedback(action === "add" ? `再點一次 ${value} 元硬幣就會放入` : `再點一次 ${value} 元硬幣就會拿掉`);
}

function startPaymentCoinDrag(event, coin, source) {
  if (state.mode !== "pay") return;

  if (!coin) return;

  event.preventDefault();
  ensureAudioContext();

  const value = Number(coin.dataset.coin);
  const rect = coin.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.appendChild(makeCoin(value));
  document.body.appendChild(ghost);

  dragState = {
    source,
    value,
    index: source === "placed" ? Number(coin.dataset.index) : null,
    ghost,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: rect.width / 2,
    offsetY: rect.height / 2,
  };

  coin.setPointerCapture(event.pointerId);
  moveGhost(event.clientX, event.clientY);
}

function startBankCoinDrag(event) {
  const coin = event.target.closest(".coin-bank .coin");
  startPaymentCoinDrag(event, coin, "bank");
}

function startPlacedCoinDrag(event) {
  const coin = event.target.closest(".placed-coins .coin");
  startPaymentCoinDrag(event, coin, "placed");
}

function moveCoinDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  moveGhost(event.clientX, event.clientY);
}

function endCoinDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();

  const didDrop = pointIsInside(dom.dropZone, event.clientX, event.clientY);
  const movedDistance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);

  if (dragState.source === "bank" && didDrop) {
    addCoinToPayment(dragState.value);
    resetCoinTap();
  } else if (dragState.source === "bank" && movedDistance <= TAP_DISTANCE) {
    handleCoinTap("add", dragState.value);
  } else if (dragState.source === "placed" && !didDrop && movedDistance > TAP_DISTANCE) {
    removeCoinFromPayment(dragState.index);
    resetCoinTap();
  } else if (dragState.source === "placed" && movedDistance <= TAP_DISTANCE) {
    handleCoinTap("remove", dragState.value, dragState.index);
  } else {
    resetCoinTap();
  }

  dragState.ghost.remove();
  dragState = null;
  dom.dropZone.classList.remove("is-ready", "is-removing");
}

function handleNumberPad(event) {
  const button = event.target.closest("button");
  if (!button) return;

  ensureAudioContext();

  const number = button.dataset.number;
  const action = button.dataset.action;

  if (number !== undefined) {
    if (state.answer.length < 3) {
      state.answer = `${state.answer}${number}`.replace(/^0+(?=\d)/, "");
    }
  } else if (action === "backspace") {
    state.answer = state.answer.slice(0, -1);
  } else if (action === "clear") {
    state.answer = "";
  }

  updateAnswerView();
}

document.querySelector(".coin-bank").addEventListener("pointerdown", startBankCoinDrag);
dom.placedCoins.addEventListener("pointerdown", startPlacedCoinDrag);
document.addEventListener("pointermove", moveCoinDrag, { passive: false });
document.addEventListener("pointerup", endCoinDrag, { passive: false });
document.addEventListener("pointercancel", endCoinDrag, { passive: false });

dom.payMode.addEventListener("click", () => setMode("pay"));
dom.countMode.addEventListener("click", () => setMode("count"));
dom.rangeButtons.forEach((button) => {
  button.addEventListener("click", () => setRange(button.dataset.range));
});
dom.tapModeButtons.forEach((button) => {
  button.addEventListener("click", () => setTapMode(button.dataset.tapMode));
});
dom.checkButton.addEventListener("click", checkAnswer);
dom.newRoundButton.addEventListener("click", () => newRound(true));
dom.clearButton.addEventListener("click", clearCurrentInput);
dom.undoButton.addEventListener("click", () => {
  resetCoinTap();
  state.placed.pop();
  updatePaymentView();
});
dom.soundToggle.addEventListener("click", () => {
  state.muted = !state.muted;
  localStorage.setItem("coinGameMuted", String(state.muted));
  updateSoundButton();
});
dom.numberPad.addEventListener("click", handleNumberPad);

updateSoundButton();
updateRangeButtons();
updateTapModeButtons();
setMode("pay");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
