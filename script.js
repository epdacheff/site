
/* ===== TALLY ===== */
const TALLY_FORM_URL = "https://tally.so/r/Yj4Eb0";

const $ = (id) => document.getElementById(id);
const intro = $("intro"), goBtn = $("goBtn"), site = $("site");
const form = $("noteForm"), input = $("noteInput"), count = $("count");
const statusEl = $("status"), confirmBox = $("confirm"), frame = $("tallyFrame");
const backBtn = $("backBtn"), m1 = $("m1"), m2 = $("m2");

/* ===== 90 BPM 8-BIT BOOM BAP ===== */
let audioContext = null;
let master = null;
let beatTimer = null;
let nextStepTime = 0;
let currentStep = 0;
let beatStarted = false;

const BPM = 90;
const STEP = 60 / BPM / 4;

function makeNoise() {
  const length = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function volume(value, time, duration, destination = master) {
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(value, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  gain.connect(destination);
  return gain;
}

function kick(time) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(125, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.13);

  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc.connect(gain);
  gain.connect(master);

  osc.start(time);
  osc.stop(time + 0.23);
}

function snare(time, soft = false) {
  const noise = audioContext.createBufferSource();
  noise.buffer = makeNoise();

  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1100;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(soft ? 0.13 : 0.42, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start(time);
  noise.stop(time + 0.13);

  const body = audioContext.createOscillator();
  const bodyGain = audioContext.createGain();

  body.type = "triangle";
  body.frequency.setValueAtTime(180, time);
  bodyGain.gain.setValueAtTime(soft ? 0.08 : 0.2, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  body.connect(bodyGain);
  bodyGain.connect(master);
  body.start(time);
  body.stop(time + 0.09);
}

function hat(time, open = false) {
  const noise = audioContext.createBufferSource();
  noise.buffer = makeNoise();

  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7500;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    time + (open ? 0.16 : 0.045)
  );

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  noise.start(time);
  noise.stop(time + (open ? 0.17 : 0.05));
}

function note(freq, time, duration, wave = "square", loudness = 0.12) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(loudness, time);
  gain.gain.setValueAtTime(loudness, time + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(master);

  osc.start(time);
  osc.stop(time + duration + 0.01);
}

function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/* Bir ölçülük davul düzeni */
const kicks = [0, 7, 10];
const snares = [4, 12];
const ghostSnares = [15];
const hats = [0, 2, 4, 6, 8, 10, 12, 14];

const bassPattern = {
  0: 36, 3: 36, 6: 43, 8: 31,
  11: 36, 14: 38
};

const melodyPattern = {
  2: 72, 5: 79, 9: 75, 11: 72,
  14: 67
};

function scheduleStep(step, time) {
  if (kicks.includes(step)) kick(time);

  if (snares.includes(step)) snare(time);
  if (ghostSnares.includes(step)) snare(time, true);

  if (hats.includes(step)) {
    hat(time, step === 14);
  }

  if (bassPattern[step]) {
    note(midi(bassPattern[step]), time, 0.19, "square", 0.16);
  }

  if (melodyPattern[step]) {
    note(midi(melodyPattern[step]), time, 0.11, "square", 0.055);
  }
}

function scheduler() {
  while (nextStepTime < audioContext.currentTime + 0.12) {
    const swing = currentStep % 2 === 1 ? 0.012 : 0;

    scheduleStep(currentStep, nextStepTime + swing);

    nextStepTime += STEP;
    currentStep = (currentStep + 1) % 16;
  }
}

function startBeat() {
  if (beatStarted) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();

    master = audioContext.createGain();
    master.gain.value = 0.55;
    master.connect(audioContext.destination);

    audioContext.resume().then(() => {
      nextStepTime = audioContext.currentTime + 0.05;
      beatTimer = setInterval(scheduler, 25);
      beatStarted = true;
    });
  } catch (error) {
    console.log("Beat başlatılamadı:", error);
  }
}

/* ===== AÇILIŞ -> ANA SAYFA ===== */
goBtn.addEventListener("click", () => {
  startBeat();

  intro.classList.add("gone");
  document.body.classList.remove("lock");
  window.scrollTo(0, 0);
  site.classList.add("in");

  setTimeout(() => {
    intro.style.display = "none";
  }, 800);
});

/* ===== NOT DUVARI ===== */
let waiting = false;
let timers = [];

function say(text) {
  statusEl.textContent = text || "";
}

function closeConfirm() {
  confirmBox.hidden = true;
  frame.removeAttribute("src");
  waiting = false;
}

function resetDone() {
  timers.forEach(clearTimeout);
  timers = [];

  [m1, m2].forEach((p) => {
    p.classList.remove("on");
    p.textContent = "";
  });
}

function buildTallyUrl(note) {
  const m = TALLY_FORM_URL.match(/tally\.so\/(?:r|embed)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;

  return "https://tally.so/embed/" + m[1] +
    "?hideTitle=1&transparentBackground=1&not=" + encodeURIComponent(note);
}

input.addEventListener("input", () => {
  count.textContent = input.value.length + "/500";

  if (waiting) {
    closeConfirm();
    say("Notu değiştirdin. Tekrar SPREYİ AL ELİNE'ye bas.");
  }
});

backBtn.addEventListener("click", () => {
  closeConfirm();
  input.focus();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  say("");
  resetDone();

  const note = input.value.trim();

  if (!note) {
    say("Duvar boş. Önce bir şey yaz.");
    input.focus();
    return;
  }

  if (!TALLY_FORM_URL || TALLY_FORM_URL.indexOf("BURAYA") !== -1) {
    say("Tally bağlantısı henüz eklenmemiş. Not şu an gönderilemez.");
    return;
  }

  const url = buildTallyUrl(note);

  if (!url) {
    say("Tally bağlantısı hatalı görünüyor. https://tally.so/r/... şeklinde olmalı.");
    return;
  }

  frame.src = url;
  confirmBox.hidden = false;
  waiting = true;
  confirmBox.scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ===== TALLY GÖNDERİM DOĞRULAMASI ===== */
window.addEventListener("message", (e) => {
  if (!waiting) return;
  if (e.origin !== "https://tally.so") return;
  if (e.source !== frame.contentWindow) return;

  let d = e.data;

  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch (err) {
      d = {
        event: d.indexOf("Tally.FormSubmitted") > -1
          ? "Tally.FormSubmitted"
          : ""
      };
    }
  }

  if (d && d.event === "Tally.FormSubmitted") {
    onSubmitted();
  }
});

function onSubmitted() {
  closeConfirm();
  input.value = "";
  count.textContent = "0/500";
  say("");

  m1.textContent = "ARTIK YAZDIĞIN ŞEY BU DUVARA AİT.";
  m1.classList.add("on");
  m1.scrollIntoView({ behavior: "smooth", block: "center" });

  timers.push(setTimeout(() => {
    m2.textContent = "BİR ARA ÜŞENMEZSEM SİTEYE GİRİP OKURUM.";
    m2.classList.add("on");
  }, 2000));
}
