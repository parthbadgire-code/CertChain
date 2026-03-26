import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = "0xe463B6d0d09D1677BB14abCb86D1A8B53Eb5FDe2";

const ABI = [
  "function issueCertificate(string certId, string studentName, string courseName, string issuerName) public",
  "function verifyCertificate(string certId) public view returns (bool exists, bool isValid, string studentName, string courseName, string issuerName, uint256 issueDate)",
  "function revokeCertificate(string certId) public",
  "function addIssuer(address issuer) public",
  "function removeIssuer(address issuer) public",
  "function isAuthorized(address addr) public view returns (bool)",
  "function owner() public view returns (address)",
  "event CertificateIssued(string certId, string studentName, string courseName)",
];

const TABS = [
  { id: "verify", label: "Verify", icon: "🔍" },
  { id: "issue", label: "Issue", icon: "📜" },
  { id: "revoke", label: "Revoke", icon: "🚫" },
  { id: "records", label: "Records", icon: "📋" },
];

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState("verify");
  const [status, setStatus] = useState(null); // { type: 'loading'|'success'|'error', text: string }
  const [particles, setParticles] = useState([]);

  // Issue form
  const [certId, setCertId] = useState(() => {
    const num = String(Math.floor(Math.random() * 9000) + 1000);
    return `CERT-2026-${num}`;
  });
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issuerName, setIssuerName] = useState("");

  // Verify form
  const [verifyCertId, setVerifyCertId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // Revoke form
  const [revokeCertId, setRevokeCertId] = useState("");

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [newIssuer, setNewIssuer] = useState("");
  const [removeIssuerAddr, setRemoveIssuerAddr] = useState("");
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Generate floating particles
  useEffect(() => {
    const pts = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
    }));
    setParticles(pts);
  }, []);

  const OWNER = "0xB318C8b0E65763c756Ae24258990935BE35e77aa";

  useEffect(() => {
    if (wallet) checkRoles(wallet);
  }, [wallet]);

  async function checkRoles(address) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const auth = await contract.isAuthorized(address);
      setIsAuthorized(auth);
      setIsOwner(address.toLowerCase() === OWNER.toLowerCase());
    } catch (e) { console.error(e); }
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(await signer.getAddress());
      setStatus({ type: "success", text: "Wallet connected successfully" });
    } catch (e) {
      setStatus({ type: "error", text: "Failed to connect wallet" });
    }
  }

  function getContract(withSigner = false) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      return provider.getSigner().then((signer) => new ethers.Contract(CONTRACT_ADDRESS, ABI, signer));
    }
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }

  async function handleIssue() {
    try {
      setStatus({ type: "loading", text: "Issuing certificate… confirm in MetaMask" });
      const contract = await getContract(true);
      const tx = await contract.issueCertificate(certId, studentName, courseName, issuerName);
      await tx.wait();
      setStatus({ type: "success", text: `✅ Certificate issued! ID: ${certId} — <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" rel="noreferrer" style="color:#60a5fa;font-weight:600">View on Etherscan ↗</a>` });
      setCertId(""); setStudentName(""); setCourseName(""); setIssuerName("");
    } catch (e) {
      setStatus({ type: "error", text: e.reason || e.message });
    }
  }


  async function handleVerify() {
    try {
      setStatus({ type: "loading", text: "Verifying certificate on-chain…" });
      setVerifyResult(null);
      const contract = await getContract(false);
      const result = await contract.verifyCertificate(verifyCertId);
      setStatus(null);
      if (!result.exists) {
        setVerifyResult({ found: false });
        return;
      }
      setVerifyResult({
        found: true,
        isValid: result.isValid,
        studentName: result.studentName,
        courseName: result.courseName,
        issuerName: result.issuerName,
        issueDate: new Date(Number(result.issueDate) * 1000).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        }),
      });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function handleRevoke() {
    try {
      setStatus({ type: "loading", text: "Revoking certificate… confirm in MetaMask" });
      const contract = await getContract(true);
      const tx = await contract.revokeCertificate(revokeCertId);
      await tx.wait();
      setStatus({ type: "success", text: `Certificate ${revokeCertId} has been revoked` });
      setRevokeCertId("");
    } catch (e) {
      setStatus({ type: "error", text: e.reason || e.message });
    }
  }
  async function handleAddIssuer() {
    try {
      setStatus("Adding issuer... please confirm in MetaMask");
      const contract = await getContract(true);
      const tx = await contract.addIssuer(newIssuer);
      await tx.wait();
      setStatus(`✅ Issuer ${newIssuer.slice(0, 6)}...${newIssuer.slice(-4)} added!`);
      setNewIssuer("");
    } catch (e) {
      setStatus("❌ Error: " + (e.reason || e.message));
    }
  }

  async function handleRemoveIssuer() {
    try {
      setStatus("Removing issuer... please confirm in MetaMask");
      const contract = await getContract(true);
      const tx = await contract.removeIssuer(removeIssuerAddr);
      await tx.wait();
      setStatus(`✅ Issuer removed successfully.`);
      setRemoveIssuerAddr("");
    } catch (e) {
      setStatus("❌ Error: " + (e.reason || e.message));
    }
  }
  async function fetchAllCertificates() {
    try {
      setRecordsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const filter = contract.filters.CertificateIssued();
      const events = await contract.queryFilter(filter);
      const certs = events.map(e => ({
        certId: e.args[0],
        studentName: e.args[1],
        courseName: e.args[2],
      }));
      setRecords(certs);
    } catch (e) {
      console.error(e);
    } finally {
      setRecordsLoading(false);
    }
  }

  function switchTab(t) {
    setTab(t);
    setStatus(null);
    setVerifyResult(null);
    if (t === "records") fetchAllCertificates();
  }

  return (
    <div className="app-root">
      {/* Animated background */}
      <div className="bg-gradient" />
      <div className="bg-grid" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Glowing orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Main card */}
      <div className="card-wrapper">
        <div className="card">
          {/* Header */}
          <div className="card-header">
            <div className="logo-ring">
              <span className="logo-icon">⛓️</span>
            </div>
            <h1 className="app-title">CertChain</h1>
            <p className="app-subtitle">Tamper-proof certificates on Ethereum</p>
            <div className="header-divider" />
          </div>

          {/* Wallet */}
          <div className="wallet-section">
            {!wallet ? (
              <button className="btn btn-connect" onClick={connectWallet}>
                <span className="btn-icon">🦊</span>
                Connect MetaMask
              </button>
            ) : (
              <div className="wallet-badge">
                <span className="wallet-dot" />
                <span className="wallet-label">Connected</span>
                <span className="wallet-address">
                  {wallet.slice(0, 6)}…{wallet.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? "tab-active" : ""}`}
                onClick={() => switchTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
            {isOwner && (
              <button
                className={`tab-btn ${tab === "admin" ? "tab-active" : ""}`}
                onClick={() => switchTab("admin")}
              >
                <span className="tab-icon">👑</span>
                Admin
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {/* Verify */}
            {tab === "verify" && (
              <div className="form-group">
                <label className="field-label">Certificate ID</label>
                <input
                  className="field-input"
                  placeholder="e.g. CERT-2024-001"
                  value={verifyCertId}
                  onChange={(e) => setVerifyCertId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <button className="btn btn-blue" onClick={handleVerify}>
                  <span>🔍</span> Verify Certificate
                </button>

                {verifyResult && (
                  <div className={`result-card ${verifyResult.found && verifyResult.isValid ? "result-success" : "result-error"}`}>
                    {!verifyResult.found && (
                      <div className="result-status result-status-error">
                        <span className="result-icon">✗</span>
                        <div>
                          <p className="result-title">Not Found</p>
                          <p className="result-desc">No certificate with this ID exists on-chain</p>
                        </div>
                      </div>
                    )}
                    {verifyResult.found && !verifyResult.isValid && (
                      <div className="result-status result-status-error">
                        <span className="result-icon">⚠</span>
                        <div>
                          <p className="result-title">Revoked</p>
                          <p className="result-desc">This certificate has been invalidated</p>
                        </div>
                      </div>
                    )}
                    {verifyResult.found && verifyResult.isValid && (
                      <>
                        <div className="result-status result-status-success">
                          <span className="result-icon">✓</span>
                          <div>
                            <p className="result-title">Valid Certificate</p>
                            <p className="result-desc">Verified on Ethereum blockchain</p>
                          </div>
                        </div>
                        <div className="result-fields">
                          {[
                            ["Student", verifyResult.studentName, "👤"],
                            ["Course", verifyResult.courseName, "📚"],
                            ["Issuer", verifyResult.issuerName, "🏛️"],
                            ["Issued On", verifyResult.issueDate, "📅"],
                          ].map(([k, v, icon]) => (
                            <div key={k} className="result-field">
                              <span className="result-field-icon">{icon}</span>
                              <span className="result-field-key">{k}</span>
                              <span className="result-field-val">{v}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Issue */}
            {tab === "issue" && wallet?.toLowerCase() !== OWNER.toLowerCase() && (
              <p className="owner-warning">⚠️ Only the authorized issuer can issue certificates.</p>
            )}
            {tab === "issue" && (
              <div className="form-group">
                <label className="field-label">Certificate ID</label>
                <input className="field-input" placeholder="e.g. CERT-2024-001" value={certId} onChange={(e) => setCertId(e.target.value)} />
                <label className="field-label">Student Name</label>
                <input className="field-input" placeholder="Full name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                <label className="field-label">Course Name</label>
                <input className="field-input" placeholder="e.g. Blockchain Development" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                <label className="field-label">Issuer Name</label>
                <input className="field-input" placeholder="e.g. ABC University" value={issuerName} onChange={(e) => setIssuerName(e.target.value)} />
                <button className="btn btn-green" onClick={handleIssue}>
                  <span>📜</span> Issue Certificate
                </button>
              </div>
            )}

            {/* Revoke */}
            {tab === "revoke" && wallet?.toLowerCase() !== OWNER.toLowerCase() && (
              <p className="owner-warning">⚠️ Only the authorized issuer can revoke certificates.</p>
            )}
            {tab === "revoke" && (
              <div className="form-group">
                <div className="revoke-warning">
                  <span>⚠️</span>
                  <p>This action is irreversible. The certificate will be permanently invalidated on-chain.</p>
                </div>
                <label className="field-label">Certificate ID</label>
                <input
                  className="field-input"
                  placeholder="Enter ID to revoke"
                  value={revokeCertId}
                  onChange={(e) => setRevokeCertId(e.target.value)}
                />
                <button className="btn btn-red" onClick={handleRevoke}>
                  <span>🚫</span> Revoke Certificate
                </button>
              </div>
            )}
          </div>

          {/* Admin */}
          {tab === "admin" && !isOwner && (
            <p className="owner-warning">⚠️ Only the contract owner can manage issuers.</p>
          )}
          {tab === "admin" && isOwner && (
            <div className="form-group">
              <label className="field-label">Add Authorized Issuer</label>
              <input
                className="field-input"
                placeholder="Wallet address (0x...)"
                value={newIssuer}
                onChange={(e) => setNewIssuer(e.target.value)}
              />
              <button className="btn btn-green" onClick={handleAddIssuer}>
                <span>✅</span> Add Issuer
              </button>
              <div style={{ margin: "16px 0", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
              <label className="field-label">Remove Issuer</label>
              <input
                className="field-input"
                placeholder="Wallet address (0x...)"
                value={removeIssuerAddr}
                onChange={(e) => setRemoveIssuerAddr(e.target.value)}
              />
              <button className="btn btn-red" onClick={handleRemoveIssuer}>
                <span>🚫</span> Remove Issuer
              </button>
            </div>
          )}
          {/* Records */}
          {tab === "records" && (
            <div className="form-group">
              {recordsLoading && (
                <p style={{ textAlign: "center", color: "#888", fontSize: "13px" }}>
                  Loading certificates from blockchain...
                </p>
              )}
              {!recordsLoading && records.length === 0 && (
                <p style={{ textAlign: "center", color: "#888", fontSize: "13px" }}>
                  No certificates issued yet.
                </p>
              )}
              {!recordsLoading && records.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Cert ID", "Student"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: "500" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr
                        key={i}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setVerifyCertId(r.certId);
                          switchTab("verify");
                        }}
                      >
                        <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#60a5fa" }}>{r.certId}</td>
                        <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{r.studentName}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Status toast */}
          {status && (
            <div className={`status-toast status-${status.type}`}>
              <span className="status-icon">
                {status.type === "loading" && <span className="spinner" />}
                {status.type === "success" && "✓"}
                {status.type === "error" && "✗"}
              </span>
              <span dangerouslySetInnerHTML={{ __html: status.text }} />
            </div>
          )}

          {/* Card Footer */}
          <div className="card-footer">
            <span className="footer-dot" />
            <span>Ethereum Mainnet</span>
            <span className="footer-sep">·</span>
            <span>Solidity Smart Contract</span>
            <span className="footer-sep">·</span>
            <span>EVM Compatible</span>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="page-footer">
        <div className="page-footer-inner">
          <div className="page-footer-brand">
            <span className="page-footer-logo">⛓️</span>
            <span className="page-footer-name">CertChain</span>
          </div>
          <div className="page-footer-divider" />
          <p className="page-footer-credit">
            Crafted with <span className="page-footer-heart">♥</span> by{" "}
            <span className="page-footer-author">Parth Badgire</span>
          </p>
          <p className="page-footer-copy">© CertChain 2026 · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
