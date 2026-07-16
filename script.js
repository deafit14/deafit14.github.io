const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyBCF62rQgQDMgbkGFpXUcJbESbBYXeFYbuS2X--GjAzy0Xb6puQghuUSRbxRXzAFO2/exec";

function masukGame() {
  const nama = document.getElementById("playerName").value;
  if (nama.trim() === "") {
    alert("Nama harus diisi!");
    return;
  }

  // Ubah tombol jadi loading
  const btn = document.querySelector(".btn-main");
  btn.innerText = "Mendaftarkan ke Server...";
  btn.disabled = true;

  // Daftarkan nama ke Database Spreadsheet
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "register", name: nama }),
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("playerName", nama);
      window.location.href = "simulasi.html";
    })
    .catch((err) => {
      alert("Gagal koneksi ke server. Coba lagi.");
      btn.innerText = "MASUK";
      btn.disabled = false;
    });
}

function keAdmin() {
  const pass = prompt("Masukkan sandi Admin:");
  if (pass === "admin123") {
    window.location.href = "admin.html";
  } else {
    alert("Akses ditolak!");
  }
}
