import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";


const statusStyles = {
  accepted:              { color: "#22c55e", bg: "#052e16", label: "Accepted" },
  wrong:                 { color: "#ef4444", bg: "#2d0a0a", label: "Wrong Answer" },
  "wrong answer":        { color: "#ef4444", bg: "#2d0a0a", label: "Wrong Answer" },
  "time limit exceeded": { color: "#f97316", bg: "#2c1205", label: "TLE" },
  "runtime error":       { color: "#a855f7", bg: "#1e0a2e", label: "Runtime Error" },
  error:                 { color: "#a855f7", bg: "#1e0a2e", label: "Runtime Error" },
  pending:               { color: "#facc15", bg: "#2d2305", label: "Pending" },
};

const getStatusStyle = (status = "") => {
  return (
    statusStyles[status.toLowerCase()] || {
      color: "#94a3b8",
      bg: "#1e293b",
      label: status,
    }
  );
};


const CodeModal = ({ code, language, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <span style={modalStyles.title}>Submitted Code</span>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={modalStyles.langBadge}>{language}</span>
            <button style={modalStyles.copyBtn} onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button style={modalStyles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <pre style={modalStyles.codeBlock}>{code || "// No code available"}</pre>
      </div>
    </div>
  );
};


const SubmissionHistory = ({ problemId, submissions = [], setSubmissions }) => {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selectedCode, setSelectedCode] = useState(null);

  
  useEffect(() => {
    if (!problemId) {
      setError("No problem ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    axiosClient
      .get(`/problem/submittedProblem/${problemId}`)
      .then(({ data }) => {
        setSubmissions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("SubmissionHistory fetch error:", err);
        setError("Failed to load submissions. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [problemId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

 
  if (loading) {
    return (
      <div style={panelStyles.center}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={panelStyles.spinner} />
        <p style={{ color: "#64748b", fontSize: "12px", marginTop: "12px", fontFamily: "monospace" }}>
          Loading submissions...
        </p>
      </div>
    );
  }

 
  if (error) {
    return (
      <div style={panelStyles.center}>
        <p style={{ fontSize: "24px" }}>⚠️</p>
        <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px", fontFamily: "monospace" }}>
          {error}
        </p>
      </div>
    );
  }

 
  if (submissions.length === 0) {
    return (
      <div style={panelStyles.center}>
        <p style={{ fontSize: "28px" }}>📭</p>
        <p style={{ color: "#475569", fontSize: "12px", marginTop: "8px", fontFamily: "monospace" }}>
          No submissions yet.
        </p>
        <p style={{ color: "#334155", fontSize: "11px", marginTop: "4px" }}>
          Submit your code to see results here.
        </p>
      </div>
    );
  }

 
  return (
    <div style={{ width: "100%", fontFamily: "sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        .sub-row:hover td { background: #0f172a !important; }
        .view-btn:hover   { background: #1d4ed8 !important; color: #fff !important; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .sub-row { animation: fadeIn 0.25s ease both; }
      `}</style>

      {/* Count badge */}
      <div style={panelStyles.countRow}>
        <span style={panelStyles.countBadge}>
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={panelStyles.tableWrapper}>
        <table style={panelStyles.table}>
          <thead>
            <tr>
              {["#", "Status", "Runtime", "Memory", "Submitted At", "Action"].map(
                (h) => (
                  <th key={h} style={panelStyles.th}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, index) => {
              const s = getStatusStyle(sub.status);
              return (
                <tr
                  key={sub._id || index}
                  className="sub-row"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <td style={panelStyles.td}>
                    <span style={panelStyles.indexNum}>{index + 1}</span>
                  </td>

                  <td style={panelStyles.td}>
                    <span
                      style={{
                        ...panelStyles.statusBadge,
                        color: s.color,
                        background: s.bg,
                      }}
                    >
                      {s.label}
                    </span>
                  </td>

                  <td style={panelStyles.td}>
                    <span style={panelStyles.mono}>
                      {sub.runtime != null ? `${sub.runtime} ms` : "—"}
                    </span>
                  </td>

                  <td style={panelStyles.td}>
                    <span style={panelStyles.mono}>
                      {sub.memory != null ? `${sub.memory} KB` : "—"}
                    </span>
                  </td>

                  <td style={panelStyles.td}>
                    <span style={panelStyles.date}>{formatDate(sub.createdAt)}</span>
                  </td>

                  <td style={panelStyles.td}>
                    <button
                      className="view-btn"
                      style={panelStyles.viewBtn}
                      onClick={() =>
                        setSelectedCode({
                          code: sub.code,
                          language: sub.language,
                        })
                      }
                    >
                      {"</>"} View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedCode && (
        <CodeModal
          code={selectedCode.code}
          language={selectedCode.language}
          onClose={() => setSelectedCode(null)}
        />
      )}
    </div>
  );
};


const panelStyles = {
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 16px",
    textAlign: "center",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "2px solid #1e293b",
    borderTop: "2px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  countRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    paddingTop: "2px",
  },
  countBadge: {
    background: "#1e293b",
    color: "#64748b",
    fontSize: "11px",
    padding: "3px 10px",
    borderRadius: "20px",
    fontWeight: 600,
    fontFamily: "monospace",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0d1117",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    borderBottom: "1px solid #1e293b",
    background: "#0d1117",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    verticalAlign: "middle",
    borderBottom: "1px solid #0f172a",
  },
  indexNum: {
    color: "#334155",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    fontWeight: 600,
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: "5px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.2px",
    whiteSpace: "nowrap",
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    color: "#94a3b8",
  },
  date: {
    fontSize: "11px",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "nowrap",
  },
  viewBtn: {
    background: "#0f172a",
    color: "#3b82f6",
    border: "1px solid #1e3a5f",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "nowrap",
  },
};


const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    background: "#0d1117",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "760px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #1e293b",
    flexShrink: 0,
  },
  title: {
    color: "#f1f5f9",
    fontWeight: 700,
    fontSize: "14px",
  },
  langBadge: {
    background: "#1e293b",
    color: "#94a3b8",
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "4px",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  copyBtn: {
    background: "#1e3a5f",
    color: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  closeBtn: {
    background: "transparent",
    color: "#64748b",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    lineHeight: 1,
    padding: "2px 6px",
  },
  codeBlock: {
    padding: "18px",
    overflowY: "auto",
    color: "#e2e8f0",
    fontSize: "13px",
    lineHeight: "1.7",
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
  },
};

export default SubmissionHistory;