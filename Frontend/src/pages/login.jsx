import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loginUser } from "../authSlice";

const loginSchema = z.object({
  email: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">

          {/* Title */}
          <h2 className="card-title justify-center text-3xl font-bold">
            DSA ARENA
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Email */}
            <div className="form-control mt-4">
              <label className="label mb-1">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered ${
                  errors.email && "input-error"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-error text-sm mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-control mt-4">
              <label className="label mb-1">
                <span className="label-text">Password</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className={`input input-bordered ${
                  errors.password && "input-error"
                }`}
                {...register("password")}
              />

              {/* Show Password */}
              <label className="cursor-pointer label justify-start gap-2 mt-1">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  onChange={() => setShowPassword(!showPassword)}
                />
                <span className="label-text text-sm">Show Password</span>
              </label>

              {errors.password && (
                <span className="text-error text-sm mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Backend Error */}
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {error}
              </p>
            )}

            {/* Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

            {/* SIGNUP LINK */}
            <p className="text-center mt-4 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-500 font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
