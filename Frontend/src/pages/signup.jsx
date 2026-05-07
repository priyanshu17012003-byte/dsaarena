import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../authSlice";
import { useEffect, useState } from "react";

const signupSchema = z.object({
  firstName: z.string().min(3, "Name should contain at least 3 characters"),
  email: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak"),
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
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

            {/* First Name */}
            <div className="form-control mt-4">
              <label className="label mb-1">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                placeholder="John"
                className={`input input-bordered ${
                  errors.firstName && "input-error"
                }`}
                {...register("firstName")}
              />
              {errors.firstName && (
                <span className="text-error text-sm mt-1">
                  {errors.firstName.message}
                </span>
              )}
            </div>

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

              {/* Show Password Toggle */}
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

            {/* Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary w-full ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>

            {/*  LOGIN LINK */}
            <p className="text-center mt-4 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-500 font-semibold hover:underline"
              >
                Login
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;