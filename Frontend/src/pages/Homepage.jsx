import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { logoutUser } from "../authSlice";

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get("/problem/getAllProblem");
        setProblems(data);
      } catch (error) {
        console.error("Error fetching problems:", error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get(
          "/problem/problemSolvedByUser"
        );
        setSolvedProblems(data);
      } catch (error) {
        console.error("Error fetching solved problems:", error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  
  const filteredProblems = problems.filter((problem) => {
    const isSolved = solvedProblems.some(
      (sp) => sp._id === problem._id
    );

    const difficultyMatch =
      filters.difficulty === "all" ||
      problem.difficulty?.toLowerCase() === filters.difficulty;

    const tagMatch =
      filters.tag === "all" ||
      (Array.isArray(problem.tags) &&
        problem.tags.includes(filters.tag));

    const statusMatch =
      filters.status === "all" ||
      (filters.status === "solved" && isSolved) ||
      (filters.status === "unsolved" && !isSolved);

    return difficultyMatch && tagMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost text-xl">
            DSA ARENA
          </NavLink>
        </div>

        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost">
              {user?.firstName}
            </div>
            <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
              {user?.role=='admin'&& (<li><NavLink to="/admin">Admin</NavLink></li>)}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="container mx-auto p-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Status */}
          <select
            className="select select-bordered"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>

          {/* Difficulty */}
          <select
            className="select select-bordered"
            value={filters.difficulty}
            onChange={(e) =>
              setFilters({ ...filters, difficulty: e.target.value })
            }
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Tags */}
          <select
            className="select select-bordered"
            value={filters.tag}
            onChange={(e) =>
              setFilters({ ...filters, tag: e.target.value })
            }
          >
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedlist">LinkedList</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
          </select>
        </div>

        {/* Problems */}
        <div className="grid gap-4">
          {filteredProblems.map((problem) => {
            const isSolved = solvedProblems.some(
              (sp) => sp._id === problem._id
            );

            return (
              <NavLink
                to={`/problem/${problem._id}`}
                key={problem._id}
              >
                <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition cursor-pointer">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <h2 className="card-title">
                        {problem.title}
                      </h2>

                      {isSolved && (
                        <div className="badge badge-success gap-2">
                          ✔ Solved
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {/* Difficulty */}
                      <div
                        className={`badge ${getDifficultyBadgeColor(
                          problem.difficulty
                        )}`}
                      >
                        {problem.difficulty}
                      </div>

                      {/* Tags */}
                      {Array.isArray(problem.tags) &&
                        problem.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="badge badge-info"
                          >
                            {tag}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

//  FIXED FUNCTION
const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
    default:
      return "badge-neutral";
  }
};

export default Homepage;



