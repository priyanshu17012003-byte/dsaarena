import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import Editor from "@monaco-editor/react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from "../components/ChatAi"; 



const LANGUAGES = [
  { label: "C++",        value: "cpp",        monacoLang: "cpp"        },
  { label: "Java",       value: "java",       monacoLang: "java"       },
  { label: "JavaScript", value: "javascript", monacoLang: "javascript" },
];

const LANG_STARTER_KEY = { cpp: "c++", java: "java", javascript: "javascript" };

const LEFT_TABS = [
  {
    id: "description", label: "Description",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: "editorial", label: "Editorial",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  // ── "solution" tab replaced with "chatai" ──
  {
    id: "chatai", label: "Chat AI",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: "testcases", label: "Test Cases",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: "submissions", label: "Submissions",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
];



const difficultyClass = (d) => {
  switch (d?.toLowerCase()) {
    case "easy":   return "badge-success";
    case "medium": return "badge-warning";
    case "hard":   return "badge-error";
    default:       return "badge-neutral";
  }
};

const verdictColor = (verdict = "") => {
  const v = verdict.toLowerCase();
  if (v.includes("accept")) return "text-success";
  if (v.includes("wrong"))  return "text-error";
  if (v.includes("time"))   return "text-warning";
  if (v.includes("error") || v.includes("compil")) return "text-error";
  return "text-base-content";
};

const submitStatusColor = (status = "") => {
  const s = status?.toLowerCase() || "";
  if (s === "accepted") return "text-success";
  if (s === "wrong" || s === "wrong answer" || s === "error" || s === "runtime error") return "text-error";
  return "text-warning";
};


const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-base-300">
      <div className="flex items-center justify-between px-3 py-1.5 bg-base-200 border-b border-base-300">
        <span className="text-xs font-mono text-base-content/50">{language}</span>
        <button onClick={handleCopy} className="text-xs font-mono text-base-content/40 hover:text-base-content flex items-center gap-1 transition-colors">
          {copied ? (
            <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-base-content/80 overflow-x-auto whitespace-pre leading-relaxed bg-base-300">
        {code}
      </pre>
    </div>
  );
};


const CodeEditor = () => {
  const { problemId } = useParams();
  const navigate      = useNavigate();
  const { user }      = useSelector((state) => state.auth);

  const [problem,    setProblem]    = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [fetching,   setFetching]   = useState(true);

  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [code,             setCode]             = useState("");
  const codePerLang = useRef({ cpp: "", java: "", javascript: "" });
  const editorRef   = useRef(null);

  const [activeLeftTab,  setActiveLeftTab]  = useState("description");
  const [activeRightTab, setActiveRightTab] = useState("output");

  const [isRunning,    setIsRunning]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult,    setRunResult]    = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [submissions, setSubmissions] = useState([]);

  const [leftWidth,     setLeftWidth]   = useState(42);
  const resizerDragging = useRef(false);
  const containerRef    = useRef(null);

  const { handleSubmit } = useForm();

  useEffect(() => {
    if (!problemId) return;
    setFetching(true);
    setFetchError(null);
    axiosClient
      .get(`/problem/problemById/${problemId}`)
      .then(({ data }) => {
        setProblem(data);
        const getStarter = (lang) =>
          data?.startCode?.find((s) => s.language?.toLowerCase() === lang)?.initialCode || "";
        codePerLang.current = {
          cpp:        getStarter("c++") || getStarter("cpp"),
          java:       getStarter("java"),
          javascript: getStarter("javascript"),
        };
        setCode(codePerLang.current.cpp);
      })
      .catch((err) => setFetchError(err.response?.data?.message || "Failed to load problem."))
      .finally(() => setFetching(false));
  }, [problemId]);

  const handleLanguageChange = (newLang) => {
    codePerLang.current[selectedLanguage] = code;
    setSelectedLanguage(newLang);
    setCode(codePerLang.current[newLang]);
  };

  const handleReset = () => {
    const starter = problem?.startCode?.find(
      (s) => s.language?.toLowerCase() === LANG_STARTER_KEY[selectedLanguage]
    )?.initialCode || "";
    codePerLang.current[selectedLanguage] = starter;
    setCode(starter);
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    setActiveRightTab("output");
    try {
      const { data } = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
      });
      setRunResult(Array.isArray(data) ? data : []);
    } catch (err) {
      setRunResult([]);
      console.error("Run error:", err.response?.data || err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setActiveRightTab("output");
    try {
      const { data } = await axiosClient.post(`/submission/submit/${problemId}`, {
        code,
        language: selectedLanguage,
      });
      setSubmitResult(data);
      setSubmissions((prev) => [data, ...prev]);
    } catch (err) {
      setSubmitResult({
        status: "error",
        errorMessage: err.response?.data || err.message,
        testCasesPassed: 0,
        testCasesTotal: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResizerMouseDown = (e) => {
    e.preventDefault();
    resizerDragging.current = true;
    document.addEventListener("mousemove", onResizerMouseMove);
    document.addEventListener("mouseup",   onResizerMouseUp);
  };
  const onResizerMouseMove = (e) => {
    if (!resizerDragging.current || !containerRef.current) return;
    const rect   = containerRef.current.getBoundingClientRect();
    const newPct = ((e.clientX - rect.left) / rect.width) * 100;
    if (newPct > 20 && newPct < 75) setLeftWidth(newPct);
  };
  const onResizerMouseUp = () => {
    resizerDragging.current = false;
    document.removeEventListener("mousemove", onResizerMouseMove);
    document.removeEventListener("mouseup",   onResizerMouseUp);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const monacoLang = LANGUAGES.find((l) => l.value === selectedLanguage)?.monacoLang || "cpp";
  const runPassed  = runResult?.filter((r) => r.status_id === 3).length ?? 0;
  const runTotal   = runResult?.length ?? 0;
  const runVerdict = runResult
    ? runPassed === runTotal
      ? "Accepted"
      : (runResult.find((r) => r.status_id !== 3)?.status?.description || "Wrong Answer")
    : null;

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 gap-4">
        <p className="text-error text-lg font-semibold">{fetchError}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Problems</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-base-300 overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="navbar bg-base-100 border-b border-base-300 min-h-0 h-12 px-4 flex-shrink-0 z-10">
        <div className="flex-1 gap-3">
          <NavLink to="/" className="btn btn-ghost btn-sm font-bold text-base">DSA ARENA</NavLink>
          {problem && (
            <span className="hidden sm:block text-xs text-base-content/40 font-mono truncate max-w-xs">
              {problem.title}
            </span>
          )}
        </div>
        <div className="flex-none">
          <span className="text-xs text-base-content/50 hidden sm:block">{user?.firstName}</span>
        </div>
      </nav>

      {/* ── Main panels ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── Left panel ── */}
        <div className="flex flex-col bg-base-100 overflow-hidden flex-shrink-0" style={{ width: `${leftWidth}%` }}>

          {/* Tab row */}
          <div className="flex flex-shrink-0 bg-base-200 border-b border-base-300 overflow-x-auto scrollbar-none">
            {LEFT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveLeftTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  activeLeftTab === t.id
                    ? t.id === "chatai"
                      ? "border-violet-500 text-violet-500 bg-violet-500/5"
                      : "border-primary text-primary bg-primary/5"
                    : "border-transparent text-base-content/50 hover:text-base-content/80 hover:bg-base-300/40"
                }`}
              >
                {t.icon}
                {t.label}
                {/* Pill badge on Chat AI tab */}
                {t.id === "chatai" && (
                  <span className="ml-0.5 px-1 py-px text-[9px] font-bold rounded bg-violet-500/20 text-violet-400 leading-none">AI</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className={`flex-1 overflow-y-auto text-sm ${activeLeftTab === "chatai" ? "p-3 flex flex-col" : "p-4"}`}>

            {/* ── DESCRIPTION ── */}
            {activeLeftTab === "description" && problem && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="text-base font-semibold text-base-content leading-tight">{problem.title}</h1>
                  <div className={`badge badge-sm mt-0.5 ${difficultyClass(problem.difficulty)}`}>{problem.difficulty}</div>
                  {(Array.isArray(problem.tags) ? problem.tags : [problem.tags]).filter(Boolean).map((tag) => (
                    <div key={tag} className="badge badge-sm badge-info">{tag}</div>
                  ))}
                </div>
                <div className="text-base-content/80 leading-relaxed whitespace-pre-wrap">{problem.description}</div>
                {problem.visibleTestCases?.map((tc, i) => (
                  <div key={i} className="space-y-1">
                    <p className="font-semibold text-base-content">Example {i + 1}</p>
                    <div className="bg-base-200 rounded-lg p-3 space-y-1.5 font-mono text-xs">
                      <div><span className="text-base-content/50">Input:&nbsp;</span><span>{tc.input}</span></div>
                      <div><span className="text-base-content/50">Output:&nbsp;</span><span>{tc.output}</span></div>
                      {tc.explanation && <div className="font-sans text-base-content/60 text-xs pt-1">{tc.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── EDITORIAL ── */}
            {activeLeftTab === "editorial" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h2 className="text-base font-bold text-base-content">Editorial</h2>
                </div>
                <div className="bg-base-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    Problem Understanding
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">{problem?.description}</p>
                </div>
                <div className="bg-base-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    Approach
                  </h3>
                  <ul className="text-xs text-base-content/60 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Analyze time and space complexity requirements</li>
                    <li>Consider which data structure fits best</li>
                    <li>Handle edge cases — empty input, single elements, duplicates</li>
                    <li>Think about space vs time tradeoffs</li>
                  </ul>
                </div>
                <div className="bg-base-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    Complexity
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-base-300 rounded-lg p-3 text-center">
                      <p className="text-xs text-base-content/40 mb-1">Time</p>
                      <p className="text-sm font-mono font-bold text-primary">O(n)</p>
                    </div>
                    <div className="bg-base-300 rounded-lg p-3 text-center">
                      <p className="text-xs text-base-content/40 mb-1">Space</p>
                      <p className="text-sm font-mono font-bold text-secondary">O(1)</p>
                    </div>
                  </div>
                </div>
                <div className="border border-warning/30 bg-warning/5 rounded-xl p-3 flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-warning shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="text-xs text-warning/80 leading-relaxed">
                    Solve the visible test cases first, then think about hidden edge cases before using Chat AI.
                  </p>
                </div>
              </div>
            )}

            {/* ── CHAT AI ── (replaces Solution tab) */}
            {activeLeftTab === "chatai" && (
              <ChatAi problem={problem}/>
            )}

            {/* ── TEST CASES ── */}
            {activeLeftTab === "testcases" && problem && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-info rounded-full" />
                  <h2 className="text-base font-bold text-base-content">Visible Test Cases</h2>
                  <span className="badge badge-sm badge-info">{problem.visibleTestCases?.length || 0}</span>
                </div>
                {problem.visibleTestCases?.map((tc, i) => (
                  <div key={i} className="collapse collapse-arrow bg-base-200 rounded-xl border border-base-300">
                    <input type="checkbox" defaultChecked={i === 0} />
                    <div className="collapse-title text-sm font-medium py-2.5 min-h-0 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-base-300 text-base-content/50 text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      Case {i + 1}
                    </div>
                    <div className="collapse-content pb-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <div className="space-y-1">
                          <p className="text-base-content/40 uppercase tracking-wider text-xs">Input</p>
                          <div className="bg-base-300 rounded-lg px-3 py-2 text-base-content/80 whitespace-pre-wrap break-all">{tc.input}</div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-base-content/40 uppercase tracking-wider text-xs">Output</p>
                          <div className="bg-base-300 rounded-lg px-3 py-2 text-success whitespace-pre-wrap break-all">{tc.output}</div>
                        </div>
                      </div>
                      {tc.explanation && (
                        <div className="bg-base-300 rounded-lg px-3 py-2">
                          <p className="text-xs text-base-content/40 uppercase tracking-wider mb-1">Explanation</p>
                          <p className="text-xs text-base-content/70">{tc.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-2 bg-base-200 rounded-xl p-3 border border-dashed border-base-300">
                  <p className="text-xs text-base-content/30 font-mono text-center">
                  Hidden test cases are used for final judging
                  </p>
                </div>
              </div>
            )}

            {/* ── SUBMISSIONS ── */}
            {activeLeftTab === "submissions" && (
              <SubmissionHistory
                problemId={problemId}
                submissions={submissions}
                setSubmissions={setSubmissions}
              />
            )}
            

          </div>
        </div>

        {/* ── Resizer ── */}
        <div
          className="w-1 cursor-col-resize bg-base-300 hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
          onMouseDown={onResizerMouseDown}
        />

        {/* ── Right panel ── */}
        <div className="flex flex-col flex-1 overflow-hidden bg-base-100">

          {/* Editor toolbar */}
          <div className="flex items-center gap-3 px-3 py-2 bg-base-200 border-b border-base-300 flex-shrink-0">
            <select
              className="select select-sm select-bordered font-mono text-xs w-36"
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>

            <button className="btn btn-xs btn-ghost text-base-content/50 gap-1" onClick={handleReset}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
              Reset
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Chat AI shortcut button in toolbar */}
              <button
                className="btn btn-xs btn-ghost text-violet-400 hover:text-violet-500 hover:bg-violet-500/10 gap-1 border border-violet-500/20"
                onClick={() => setActiveLeftTab("chatai")}
                title="Ask AI"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Ask AI
              </button>

              <button className="btn btn-sm btn-success gap-1" onClick={handleRun} disabled={isRunning || isSubmitting}>
                {isRunning
                  ? <span className="loading loading-spinner loading-xs" />
                  : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                Run
              </button>
              <button className="btn btn-sm btn-primary gap-1" onClick={handleSubmit(handleSubmitCode)} disabled={isRunning || isSubmitting}>
                {isSubmitting
                  ? <span className="loading loading-spinner loading-xs" />
                  : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onMount={(editor) => { editorRef.current = editor; }}
              onChange={(value) => {
                const val = value ?? "";
                setCode(val);
                codePerLang.current[selectedLanguage] = val;
              }}
              options={{
                fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true, minimap: { enabled: false },
                scrollBeyondLastLine: false, lineNumbers: "on", wordWrap: "on",
                tabSize: 4, automaticLayout: true, padding: { top: 12, bottom: 12 },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                suggestOnTriggerCharacters: true, quickSuggestions: true, formatOnType: true,
              }}
            />
          </div>

          {/* ── Result panel ── */}
          <div className="flex flex-col border-t border-base-300 bg-base-100 flex-shrink-0" style={{ height: "210px" }}>
            <div className="tabs tabs-bordered flex-shrink-0 bg-base-200 px-2">
              {["output", "console"].map((t) => (
                <button
                  key={t}
                  className={`tab tab-sm capitalize font-medium ${activeRightTab === t ? "tab-active" : "text-base-content/60"}`}
                  onClick={() => setActiveRightTab(t)}
                >
                  {t}
                </button>
              ))}
              {submitResult && !isSubmitting && (
                <span className={`ml-auto self-center text-xs font-semibold mr-2 ${submitStatusColor(submitResult.status)}`}>
                  {submitResult.status?.toUpperCase()} ({submitResult.testCasesPassed}/{submitResult.testCasesTotal})
                </span>
              )}
              {runVerdict && !isRunning && !submitResult && (
                <span className={`ml-auto self-center text-xs font-semibold mr-2 ${verdictColor(runVerdict)}`}>
                  {runVerdict} ({runPassed}/{runTotal})
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 text-sm">
              {activeRightTab === "output" && (
                <>
                  {(isRunning || isSubmitting) && (
                    <div className="flex items-center gap-2 text-base-content/50 text-xs">
                      <span className="loading loading-dots loading-sm" />
                      {isRunning ? "Running visible test cases…" : "Judging against all test cases…"}
                    </div>
                  )}

                  {!runResult && !submitResult && !isRunning && !isSubmitting && (
                    <p className="text-base-content/30 text-xs">Run your code to see output here.</p>
                  )}

                  {submitResult && !isSubmitting && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-base font-bold ${submitStatusColor(submitResult.status)}`}>
                          {submitResult.status?.toUpperCase()}
                        </span>
                        <span className="text-xs text-base-content/50">
                          {submitResult.testCasesPassed} / {submitResult.testCasesTotal} passed
                        </span>
                        {submitResult.runtime > 0 && (
                          <span className="text-xs text-base-content/40 font-mono">{Number(submitResult.runtime).toFixed(3)}s</span>
                        )}
                      </div>
                      {submitResult.errorMessage && (
                        <pre className="bg-base-200 rounded p-2 text-xs text-error font-mono overflow-x-auto whitespace-pre-wrap">
                          {submitResult.errorMessage}
                        </pre>
                      )}
                    </div>
                  )}

                  {runResult && !submitResult && !isRunning && (
                    <div className="space-y-3">
                      {runVerdict && <span className={`text-sm font-bold ${verdictColor(runVerdict)}`}>{runVerdict}</span>}
                      {runResult.map((tr, i) => {
                        const passed = tr.status_id === 3;
                        return (
                          <div key={i} className="bg-base-200 rounded-lg p-2.5 space-y-1.5">
                            <span className={`text-xs font-semibold ${passed ? "text-success" : "text-error"}`}>
                              {passed ? "✔ Passed" : "✘ Failed"} — Case {i + 1}
                              <span className="ml-2 font-normal text-base-content/40">{tr.status?.description}</span>
                            </span>
                            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                              <div>
                                <p className="text-base-content/40 mb-0.5">Expected</p>
                                <div className="bg-base-300 rounded px-2 py-1 truncate">{tr.expected_output ?? "—"}</div>
                              </div>
                              <div>
                                <p className="text-base-content/40 mb-0.5">Your output</p>
                                <div className={`rounded px-2 py-1 truncate ${passed ? "bg-base-300" : "bg-error/10 text-error"}`}>
                                  {tr.stdout ?? "—"}
                                </div>
                              </div>
                              <div>
                                <p className="text-base-content/40 mb-0.5">Time</p>
                                <div className="bg-base-300 rounded px-2 py-1">{tr.time ? `${tr.time}s` : "—"}</div>
                              </div>
                            </div>
                            {(tr.stderr || tr.compile_output) && (
                              <pre className="text-xs text-error font-mono bg-base-300 rounded p-2 overflow-x-auto whitespace-pre-wrap mt-1">
                                {tr.stderr || tr.compile_output}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeRightTab === "console" && (
                <pre className="text-xs font-mono text-base-content/70 whitespace-pre-wrap">
                  {runResult?.map((r) => r.stdout).filter(Boolean).join("\n") ||
                   submitResult?.errorMessage ||
                   <span className="text-base-content/30">No console output.</span>}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;