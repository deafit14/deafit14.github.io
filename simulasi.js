const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyBCF62rQgQDMgbkGFpXUcJbESbBYXeFYbuS2X--GjAzy0Xb6puQghuUSRbxRXzAFO2/exec";

let balance = 0; // Akan ditarik dari database
let winProbability = 0; // Akan ditarik dari database
const costPerSpin = 10000;
const teaseProbability = 0.4;
const symbols = ["💎", "👑", "💍", "⏳", "🍷", "🟢", "🔴", "🔵", "🟡"];

const playerName = localStorage.getItem("playerName");
if (!playerName) window.location.href = "index.html"; // Tendang ke login jika belum ada nama

document.getElementById("welcomePlayer").innerText = `⚡ Hai ${playerName} ⚡`;
const gridEl = document.getElementById("grid");
const spinBtn = document.getElementById("spinBtn");
const messageEl = document.getElementById("message");

// Render grid awal
for (let i = 0; i < 30; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.innerText = "❓";
  gridEl.appendChild(cell);
}

// Menarik data awal saat halaman dimuat
window.onload = pullDataFromServer;

function updateStats() {
  document.getElementById("balance").innerText =
    balance.toLocaleString("id-ID");
}

async function pullDataFromServer() {
  messageEl.innerHTML = "Menyinkronkan data dengan server pusat...";
  spinBtn.disabled = true;
  try {
    const response = await fetch(
      APPS_SCRIPT_URL + "?action=getPlayer&name=" + playerName,
    );
    const data = await response.json();

    if (data.error) {
      messageEl.innerHTML =
        "<span style='color:red;'>Akun tidak ditemukan! Login ulang.</span>";
      return;
    }

    balance = Number(data.saldo);
    winProbability = Number(data.winRate);
    updateStats();
    messageEl.innerHTML = "Sistem siap. Silakan Spin!";
    spinBtn.disabled = false;
  } catch (error) {
    messageEl.innerHTML =
      "<span style='color:red;'>Gagal menyinkronkan data.</span>";
  }
}

async function spin() {
  // 1. Tarik probabilitas dan saldo paling update dari server sebelum putar
  spinBtn.disabled = true;
  messageEl.innerHTML = "Mengecek algoritma bandar...";
  await pullDataFromServer();

  if (balance < costPerSpin) {
    messageEl.innerHTML =
      "<span style='color:#e74c3c'>Saldo Habis! Matematika membuktikan Anda rugi. (Lapor Admin untuk tambah saldo)</span>";
    return; // Tombol tetap disabled
  }

  // 2. Potong saldo
  balance -= costPerSpin;
  updateStats();

  document.getElementById("multiplier-display").innerText = "Pengali: x0";
  document.getElementById("multiplier-display").classList.remove("flash");
  messageEl.innerHTML = "Simbol berjatuhan...";
  gridEl.innerHTML = "";

  // 3. Tentukan menang kalah sesuai probabilitas server
  const isWin = Math.random() < winProbability;
  const isTease = !isWin && Math.random() < teaseProbability;
  const { finalSymbols, winningSymbol } = generateSymbols(isWin);

  const cells = [];
  for (let i = 0; i < 30; i++) {
    const cell = document.createElement("div");
    cell.className = "cell fall";
    const delay = (i % 6) * 0.08 + Math.floor(i / 6) * 0.05;
    cell.style.animationDelay = `${delay}s`;
    cell.innerText = finalSymbols[i];
    cell.dataset.symbol = finalSymbols[i];
    gridEl.appendChild(cell);
    cells.push(cell);
  }

  setTimeout(() => {
    evaluateResult(isWin, isTease, cells, winningSymbol);
  }, 1200);
}

// Fungsi generateSymbols sama persis seperti sebelumnya
function generateSymbols(isWin) {
  let finalSymbols = [];
  let symbolCounts = {};
  let winningSymbol = null;
  if (isWin)
    winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 30; i++) {
    let sym = symbols[Math.floor(Math.random() * symbols.length)];
    if (!isWin) {
      while ((symbolCounts[sym] || 0) >= 7)
        sym = symbols[Math.floor(Math.random() * symbols.length)];
    }
    symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
    finalSymbols.push(sym);
  }
  if (isWin) {
    let currentCount = symbolCounts[winningSymbol] || 0;
    let i = 0;
    while (currentCount < 9 && i < 30) {
      if (finalSymbols[i] !== winningSymbol) {
        finalSymbols[i] = winningSymbol;
        currentCount++;
      }
      i++;
    }
  }
  return { finalSymbols, winningSymbol };
}

function evaluateResult(isWin, isTease, cells, winningSymbol) {
  if (isWin) {
    messageEl.innerHTML =
      "<span style='color:#f1c40f'>Kombinasi Pecah! Menghitung kemenangan...</span>";
    cells.forEach((cell) => {
      if (cell.dataset.symbol === winningSymbol) cell.classList.add("burst");
    });

    setTimeout(() => {
      const winAmount = 75000 + Math.floor(Math.random() * 50000);
      balance += winAmount;
      showFloatingText(`+ Rp ${winAmount.toLocaleString("id-ID")}`);
      updateStats();
      messageEl.innerHTML = `Anda menang <span style='color:#2ecc71'>Rp ${winAmount.toLocaleString("id-ID")}</span>!`;
      pushDataToServer(); // Lapor saldo baru ke database
    }, 700);
  } else if (isTease) {
    const randomIndex = Math.floor(Math.random() * 30);
    cells[randomIndex].innerHTML = "⚡<br>x500";
    cells[randomIndex].classList.add("petir");
    document.getElementById("multiplier-display").innerText = "Pengali: x500";
    document.getElementById("multiplier-display").classList.add("flash");
    messageEl.innerHTML =
      "Petir x500 turun, tapi sengaja tidak ada simbol yang dipecah.";
    pushDataToServer(); // Lapor saldo baru (terpotong) ke database
  } else {
    messageEl.innerHTML = "Zonk! Tidak ada yang pecah. Saldo terpotong.";
    pushDataToServer(); // Lapor saldo baru (terpotong) ke database
  }
}

// Fungsi untuk mengirim saldo terakhir ke server setelah Spin selesai
function pushDataToServer() {
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateGame",
      name: playerName,
      saldo: balance,
    }),
  })
    .then((response) => {
      spinBtn.disabled = false;
    })
    .catch((err) => {
      spinBtn.disabled = false;
    });
}

function showFloatingText(text) {
  const gameArea = document.getElementById("game-area");
  const floatEl = document.createElement("div");
  floatEl.className = "floating-text";
  floatEl.innerText = text;
  gameArea.appendChild(floatEl);
  setTimeout(() => {
    floatEl.remove();
  }, 2000);
}
