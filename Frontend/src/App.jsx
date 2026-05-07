import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Homepage from "./pages/HomePage";
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import CodeEditor from './pages/CodeEditor';
import Admin from "./pages/Admin";
import AdminPanel from "./components/AdminPanel";
import AdminDelete from "./components/AdminDelete";
import AdminUpdate from "./components/AdminUpdate";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"       element={isAuthenticated ? <Homepage />        : <Navigate to="/signup" />} />
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />

      {/* Admin routes */}
      <Route path="/admin"            element={isAuthenticated && user?.role === 'admin' ? <Admin />       : <Navigate to="/" />} />
      <Route path="/admin/create"     element={isAuthenticated && user?.role === 'admin' ? <AdminPanel />  : <Navigate to="/" />} />
      <Route path="/admin/delete"     element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/admin/update/:id" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate /> : <Navigate to="/" />} />

      {/* Problem page — protected */}
      <Route path="/problem/:problemId" element={isAuthenticated ? <CodeEditor /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;