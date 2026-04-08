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
const toastContainer = document.getElementById("toast-container");

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
