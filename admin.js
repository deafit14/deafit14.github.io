const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyBCF62rQgQDMgbkGFpXUcJbESbBYXeFYbuS2X--GjAzy0Xb6puQghuUSRbxRXzAFO2/exec";

window.onload = loadData;

function loadData() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML =
    "<tr><td colspan='6'>Menarik data dari satelit...</td></tr>";

  fetch(APPS_SCRIPT_URL + "?action=getAll")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = "";
      if (data.length === 0) {
        tbody.innerHTML =
          "<tr><td colspan='6'>Belum ada siswa yang login.</td></tr>";
        return;
      }

      data.forEach((player, index) => {
        const currentWinRate = (player.winRate * 100).toFixed(0);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="font-weight:bold; color:#f1c40f;">${player.name}</td>
                <td>Rp ${player.saldo.toLocaleString("id-ID")}</td>
                <td><input type="number" id="add_${player.name}" value="0" step="10000"></td>
                <td><input type="number" id="rate_${player.name}" value="${currentWinRate}" min="0" max="100" style="width:60px;"> %</td>
                <td><button class="btn-save" onclick="updatePlayer('${player.name}')">SIMPAN</button></td>
            `;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      tbody.innerHTML =
        "<tr><td colspan='6' style='color:red;'>Gagal menarik data! Cek koneksi.</td></tr>";
    });
}

function updatePlayer(name) {
  const tambahSaldo = document.getElementById(`add_${name}`).value;
  const winRate = document.getElementById(`rate_${name}`).value / 100;
  const statusMsg = document.getElementById("statusMessage");

  statusMsg.innerText = `Menyuntikkan manipulasi ke akun ${name}...`;
  statusMsg.style.color = "#ff0";

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updateAdmin",
      name: name,
      tambahSaldo: Number(tambahSaldo),
      winRate: winRate,
    }),
    redirect: "follow",
  })
    .then((response) => response.json())
    .then((data) => {
      statusMsg.innerText = `Sukses! Akun ${name} telah dimanipulasi.`;
      statusMsg.style.color = "#0f0";
      loadData();
    })
    .catch((err) => {
      statusMsg.innerText = `Gagal memanipulasi ${name}!`;
      statusMsg.style.color = "red";
    });
}
