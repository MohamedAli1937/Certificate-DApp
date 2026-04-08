let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;
const activityLog = [];

const connectBtn = document.getElementById("connect-wallet-btn");
const walletText = connectBtn.querySelector(".wallet-text");
const tabAdmin = document.getElementById("tab-admin");
const tabVerify = document.getElementById("tab-verify");
const adminPanel = document.getElementById("admin-panel");
const verifyPanel = document.getElementById("verify-panel");
const issueForm = document.getElementById("issue-form");
const revokeForm = document.getElementById("revoke-form");
const verifyForm = document.getElementById("verify-form");
const issueBtn = document.getElementById("issue-btn");
const revokeBtn = document.getElementById("revoke-btn");
const verifyBtn = document.getElementById("verify-btn");
const statTotal = document.getElementById("stat-total");
const statNetwork = document.getElementById("stat-network");
const statContract = document.getElementById("stat-contract");
const verifyResult = document.getElementById("verify-result");
const pdfActions = document.getElementById("pdf-actions");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const downloadResultQrBtn = document.getElementById("download-result-qr-btn");
const scanQrBtn = document.getElementById("scan-qr-btn");
const stopScanBtn = document.getElementById("stop-scan-btn");
const qrScannerContainer = document.getElementById("qr-scanner-container");
const qrModal = document.getElementById("qr-modal");
const qrModalClose = document.getElementById("qr-modal-close");
const qrDownloadBtn = document.getElementById("qr-download-btn");
const toastContainer = document.getElementById("toast-container");
let html5QrScanner = null;

tabAdmin.addEventListener("click", () => switchTab("admin"));
tabVerify.addEventListener("click", () => switchTab("verify"));

function switchTab(tab) {
  tabAdmin.classList.toggle("active", tab === "admin");
  tabVerify.classList.toggle("active", tab === "verify");
  adminPanel.classList.toggle("active", tab === "admin");
  verifyPanel.classList.toggle("active", tab === "verify");
}

connectBtn.addEventListener("click", connectWallet);

async function connectWallet() {
  if (currentAccount) {
    disconnectWallet();
    return;
  }
  if (!window.ethereum) {
    showToast("error", "MetaMask not installed.");
    return;
  }
  try {
    showToast("info", "Connecting to MetaMask...");
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    currentAccount = accounts[0];
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const short = currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);
    walletText.textContent = short;
    connectBtn.classList.add("connected");
    showToast("success", "Wallet connected: " + short);
    await refreshStats();
  } catch (err) {
    console.error(err);
    showToast("error", "Connection failed. " + (err.message || ""));
  }
}

function disconnectWallet() {
  provider = signer = contract = currentAccount = null;
  walletText.textContent = "Connect Wallet";
  connectBtn.classList.remove("connected");
  statTotal.textContent = statNetwork.textContent = statContract.textContent = "\u2014";
  showToast("info", "Wallet disconnected.");
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", (a) =>
    a.length === 0 ? disconnectWallet() : connectWallet()
  );
  window.ethereum.on("chainChanged", () => window.location.reload());
}

async function refreshStats() {
  if (!contract) return;
  try {
    statTotal.textContent = (await contract.totalCertificates()).toString();
    const net = await provider.getNetwork();
    statNetwork.textContent = "Chain " + net.chainId;
    const addr = await contract.getAddress();
    statContract.textContent = addr.slice(0, 6) + "..." + addr.slice(-4);
  } catch (e) {
    console.error(e);
  }
}

issueForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!contract) {
    showToast("error", "Connect wallet first.");
    return;
  }
  const sid = document.getElementById("student-id").value.trim();
  const sname = document.getElementById("student-name").value.trim();
  const cname = document.getElementById("course-name").value.trim();
  const grade = document.getElementById("grade").value.trim();
  if (!sid || !sname || !cname || !grade) {
    showToast("error", "All fields required.");
    return;
  }
  setLoading(issueBtn, true);
  try {
    showToast("info", "Sending transaction...");
    const tx = await contract.issueCertificate(sid, sname, cname, grade);
    showToast("info", "Waiting for confirmation...");
    await tx.wait();
    showToast("success", "Certificate issued for " + sname);
    addActivity("issued", sid, sname);
    showQrModal(sid);
    issueForm.reset();
    await refreshStats();
  } catch (err) {
    showToast("error", extractReason(err) || "Issue failed.");
  } finally {
    setLoading(issueBtn, false);
  }
});

revokeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!contract) {
    showToast("error", "Connect wallet first.");
    return;
  }
  const sid = document.getElementById("revoke-student-id").value.trim();
  if (!sid) {
    showToast("error", "Student ID required.");
    return;
  }
  setLoading(revokeBtn, true);
  try {
    showToast("info", "Sending revocation...");
    const tx = await contract.revokeCertificate(sid);
    await tx.wait();
    showToast("success", "Certificate revoked for " + sid);
    addActivity("revoked", sid, "");
    revokeForm.reset();
  } catch (err) {
    showToast("error", extractReason(err) || "Revoke failed.");
  } finally {
    setLoading(revokeBtn, false);
  }
});

verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  let rc = contract;
  if (!rc) {
    try {
      const rp = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      rc = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rp);
    } catch {
      showToast("error", "Cannot connect to blockchain.");
      return;
    }
  }
  const sid = document.getElementById("verify-student-id").value.trim();
  if (!sid) {
    showToast("error", "Enter a Student ID.");
    return;
  }
  setLoading(verifyBtn, true);
  verifyResult.classList.add("hidden");
  try {
    const [name, course, grade, date, revoked] = await rc.verifyCertificate(sid);
    const hash = await rc.getCertificateHash(sid);
    document.getElementById("result-student-id").textContent = sid;
    document.getElementById("result-student-name").textContent = name;
    document.getElementById("result-course").textContent = course;
    document.getElementById("result-grade").textContent = grade;
    const d = new Date(Number(date) * 1000);
    document.getElementById("result-date").textContent = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("result-hash").textContent = hash;
    const bar = document.getElementById("result-status-bar");
    const badge = document.getElementById("result-badge");
    bar.className = "result-status-bar " + (revoked ? "revoked" : "valid");
    badge.className = "badge " + (revoked ? "revoked" : "valid");
    badge.textContent = revoked ? "\u274c Revoked" : "\u2705 Valid";
    verifyResult.classList.remove("hidden");
    pdfActions.classList.toggle("hidden", revoked);
    if (!revoked) {
      const resultQr = document.getElementById("result-qr-code");
      resultQr.innerHTML = "";
      new QRCode(resultQr, {
        text: sid,
        width: 120,
        height: 120,
        colorDark: "#0a0e1a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }
    showToast("success", "Certificate found!");
  } catch (err) {
    document.getElementById("result-student-id").textContent = sid;
    document.getElementById("result-student-name").textContent = "—";
    document.getElementById("result-course").textContent = "—";
    document.getElementById("result-grade").textContent = "—";
    document.getElementById("result-date").textContent = "—";
    document.getElementById("result-hash").textContent = "—";
    const bar = document.getElementById("result-status-bar");
    const badge = document.getElementById("result-badge");
    bar.className = "result-status-bar not-found";
    badge.className = "badge not-found";
    badge.textContent = "Certificate Not Verified";
    verifyResult.classList.remove("hidden");
    pdfActions.classList.add("hidden");
  } finally {
    setLoading(verifyBtn, false);
  }
});

function addActivity(type, sid, name) {
  activityLog.unshift({ type, sid, name, time: new Date() });
  const feed = document.getElementById("activity-feed");
  feed.innerHTML = "";
  activityLog.slice(0, 10).forEach((item) => {
    const el = document.createElement("div");
    el.className = "activity-item";
    const label =
      item.type === "issued"
        ? "Issued to <strong>" + item.name + "</strong> (" + item.sid + ")"
        : "Revoked <strong>" + item.sid + "</strong>";
    const t = item.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    el.innerHTML =
      '<span class="activity-dot ' +
      item.type +
      '"></span>' +
      '<span class="activity-text">' +
      label +
      "</span>" +
      '<span class="activity-time">' +
      t +
      "</span>";
    feed.appendChild(el);
  });
}

function showToast(type, msg) {
  const icons = {
    success:
      '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:
      '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.innerHTML = icons[type] + '<span class="toast-message">' + msg + "</span>";
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove());
  }, 4000);
}

function setLoading(btn, on) {
  btn.classList.toggle("loading", on);
  btn.disabled = on;
}

function extractReason(err) {
  if (err?.reason) return err.reason;
  if (err?.data?.message) return err.data.message;
  if (err?.error?.message) return err.error.message;
  const m = err?.message || "";
  const r = m.match(/reason="([^"]+)"/) || m.match(/reverted with reason string '([^']+)'/);
  return r ? r[1] : null;
}

downloadPdfBtn.addEventListener("click", generateCertificatePDF);

function generateCertificatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  const studentName = document.getElementById("result-student-name").textContent;
  const studentId = document.getElementById("result-student-id").textContent;
  const course = document.getElementById("result-course").textContent;
  const grade = document.getElementById("result-grade").textContent;
  const issueDate = document.getElementById("result-date").textContent;
  const hash = document.getElementById("result-hash").textContent;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, w, h, "F");

  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, w - 26, h - 26);

  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.3);
  doc.line(20, 55, w - 20, 55);
  doc.line(20, h - 55, w - 20, h - 55);

  const cx = w / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(102, 126, 234);
  doc.text("CERTCHAIN", cx, 30, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(241, 245, 249);
  doc.text("Certificate of Completion", cx, 45, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("This certificate is proudly presented to", cx, 70, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(102, 126, 234);
  doc.text(studentName, cx, 88, { align: "center" });

  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.4);
  const nameW = doc.getTextWidth(studentName);
  doc.line(cx - nameW / 2 - 5, 92, cx + nameW / 2 + 5, 92);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text("for successfully completing the course", cx, 105, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(241, 245, 249);
  doc.text(course, cx, 118, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text("with a grade of", cx, 130, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129);
  doc.text(grade, cx, 140, { align: "center" });

  const col1 = 60;
  const col2 = w - 60;
  const bottomY = h - 42;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("STUDENT ID", col1, bottomY, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(studentId, col1, bottomY + 6, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("ISSUE DATE", cx, bottomY, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(issueDate, cx, bottomY + 6, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("STATUS", col2, bottomY, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text("VERIFIED", col2, bottomY + 6, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("On-Chain Hash: " + hash, cx, h - 18, { align: "center" });

  const filename = "CertChain_" + studentId.replace(/[^a-zA-Z0-9-]/g, "_") + ".pdf";
  doc.save(filename);
  showToast("success", "Certificate PDF downloaded!");
}

function showQrModal(studentId) {
  const display = document.getElementById("qr-code-display");
  display.innerHTML = "";
  new QRCode(display, {
    text: studentId,
    width: 200,
    height: 200,
    colorDark: "#0a0e1a",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
  document.getElementById("qr-modal-id").textContent = studentId;
  qrModal.classList.remove("hidden");
}

qrModalClose.addEventListener("click", () => {
  qrModal.classList.add("hidden");
});

qrModal.addEventListener("click", (e) => {
  if (e.target === qrModal) qrModal.classList.add("hidden");
});

function downloadQrCodeWithPadding(canvasSelector, studentIdSelector, successMessage) {
  const srcCanvas = document.querySelector(canvasSelector);

  if (!srcCanvas) {
    showToast("error", "No QR code to download.");
    return;
  }

  const padding = Math.floor(srcCanvas.width * 0.1);
  const dlCanvas = document.createElement("canvas");
  dlCanvas.width = srcCanvas.width + padding * 2;
  dlCanvas.height = srcCanvas.height + padding * 2;

  const ctx = dlCanvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dlCanvas.width, dlCanvas.height);
  ctx.drawImage(srcCanvas, padding, padding);

  const link = document.createElement("a");
  const sid = document.getElementById(studentIdSelector).textContent;

  link.download = "CertChain_QR_" + sid.replace(/[^a-zA-Z0-9-]/g, "_") + ".png";
  link.href = dlCanvas.toDataURL("image/png");
  link.click();

  showToast("success", successMessage);
}

qrDownloadBtn.addEventListener("click", () => {
  downloadQrCodeWithPadding("#qr-code-display canvas", "qr-modal-id", "QR code downloaded!");
});

downloadResultQrBtn.addEventListener("click", () => {
  downloadQrCodeWithPadding(
    "#result-qr-code canvas",
    "result-student-id",
    "Verified QR code downloaded!"
  );
});

scanQrBtn.addEventListener("click", startQrScanner);
stopScanBtn.addEventListener("click", stopQrScanner);

async function startQrScanner() {
  qrScannerContainer.classList.remove("hidden");
  scanQrBtn.classList.add("hidden");
  try {
    html5QrScanner = new Html5Qrcode("qr-reader");
    await html5QrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onQrCodeScanned,
      () => {}
    );
  } catch (err) {
    showToast("error", "Camera access denied or unavailable.");
    stopQrScanner();
  }
}

async function stopQrScanner() {
  if (html5QrScanner) {
    try {
      await html5QrScanner.stop();
    } catch {}
    html5QrScanner = null;
  }
  qrScannerContainer.classList.add("hidden");
  scanQrBtn.classList.remove("hidden");
}

async function onQrCodeScanned(decodedText) {
  await stopQrScanner();
  const cleaned = decodedText.trim();
  document.getElementById("verify-student-id").value = cleaned;
  showToast("success", "QR scanned: " + cleaned);
  verifyForm.dispatchEvent(new Event("submit", { cancelable: true }));
}
