import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axiosClient from "../utils/axiosClient";

const difficultyClass = (d) => {
  switch (d?.toLowerCase()) {
    case "easy":   return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "medium": return "text-amber-400  bg-amber-400/10  border-amber-400/20";
    case "hard":   return "text-rose-400   bg-rose-400/10   border-rose-400/20";
    default:       return "text-zinc-400   bg-zinc-400/10   border-zinc-400/20";
  }
};

const AdminDelete = () => {
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(false);  
  const [error,    setError]    = useState(null);    
  const [deleting, setDeleting] = useState(null);    

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosClient.get("/problem/getAllProblem"); 
      setProblems(data);
    } catch (err) {
      setError("Failed to fetch problems. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) return;

    try {
      setDeleting(id);
      await axiosClient.delete(`/problem/delete/${id}`);
      setProblems((prev) => prev.filter((p) => p._id !== id)); 
    } catch (err) {
      setError("Failed to delete problem. Please try again.");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-indigo-500" />
          <p className="text-zinc-600 text-xs font-mono">Loading problems…</p>
        </div>
      </div>
    );
  }

 
  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#0d1117]/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
          DSA<span className="text-indigo-400">ARENA</span>
          <span className="ml-3 text-xs font-mono font-normal text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">
            Admin Panel
          </span>
        </span>
        <NavLink
          to="/"
          className="btn btn-xs bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white font-mono"
        >
          ← Back to Problems
        </NavLink>
      </nav>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
              Manage Problems
            </h1>
            <p className="text-zinc-500 text-sm font-mono">
              {problems.length} problem{problems.length !== 1 ? "s" : ""} in database
            </p>
          </div>
          <button
            onClick={fetchProblems}
            className="btn btn-sm bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 mb-6 text-sm font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400">✕</button>
          </div>
        )}

        {/* Empty state */}
        {problems.length === 0 && !error && (
          <div className="text-center py-20 text-zinc-700 border border-zinc-800 rounded-xl">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-mono text-sm">No problems found in the database.</p>
          </div>
        )}

        {/* Problems table */}
        {problems.length > 0 && (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-900/60 border-b border-zinc-800">
              <span className="col-span-1 text-xs font-mono text-zinc-600">#</span>
              <span className="col-span-5 text-xs font-mono text-zinc-600 uppercase tracking-wider">Title</span>
              <span className="col-span-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">Difficulty</span>
              <span className="col-span-2 text-xs font-mono text-zinc-600 uppercase tracking-wider">Tags</span>
              <span className="col-span-2 text-xs font-mono text-zinc-600 uppercase tracking-wider text-right">Action</span>
            </div>

            {/* Rows */}
            {problems.map((problem, i) => (
              <div
                key={problem._id}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-zinc-800/60 last:border-0 items-center hover:bg-zinc-900/30 transition-colors"
              >
                {/* Index */}
                <span className="col-span-1 text-zinc-600 font-mono text-sm">{i + 1}</span>

                {/* Title */}
                <div className="col-span-5">
                  <NavLink
                    to={`/problem/${problem._id}`}
                    className="text-white text-sm font-medium hover:text-indigo-300 transition-colors"
                  >
                    {problem.title}
                  </NavLink>
                </div>

                {/* Difficulty */}
                <div className="col-span-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${difficultyClass(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>

                {/* Tags */}
                <div className="col-span-2 flex flex-wrap gap-1">
                  {(Array.isArray(problem.tags) ? problem.tags : [problem.tags])
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((t) => (
                      <span key={t} className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono border border-zinc-700">
                        {t}
                      </span>
                    ))}
                </div>

                {/* Delete button */}
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => handleDelete(problem._id)}
                    disabled={deleting === problem._id}
                    className="btn btn-xs bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400 hover:text-rose-300 font-mono gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {deleting === problem._id ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {problems.length > 0 && (
          <p className="text-center text-zinc-700 text-xs font-mono mt-4">
            {problems.length} problem{problems.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminDelete;