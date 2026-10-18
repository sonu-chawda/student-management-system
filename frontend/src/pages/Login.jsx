
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";
import Icon from "../components/Icons";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { token, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isRegister = mode === "register";

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  function switchMode(next) {
    setMode(next);
    setMessage("");
    setPassword("");
    setConfirm("");
  }

  // LOGIN (same request as before: form-encoded username + password, token returned as text)
  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const receivedToken = await api.login(username.trim(), password);

      if (!receivedToken) {
        throw new Error("The server did not return a login token.");
      }

      login(receivedToken);
      setPassword("");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // REGISTER (new accounts always get the USER role)
  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.register(username.trim(), password);
      toast.success("Account created. You can log in now.");
      switchMode("login");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-aside">
        <div className="brand brand-light">
          <span className="brand-mark">
            <Icon name="cap" size={20} />
          </span>
          <span className="brand-name">Student Management</span>
        </div>

        <div className="auth-pitch">
          <h1>Every student, one clear record.</h1>
          <p>
            Add students, track their course and CGPA, and see enrolment trends on the dashboard.
            Admins can remove records; staff can add and edit.
          </p>
        </div>

        <p className="auth-foot">Spring Boot · MySQL · JWT · React</p>
      </section>

      <section className="auth-main">
        <form className="auth-card" onSubmit={isRegister ? handleRegister : handleLogin}>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">
            {isRegister ? "Pick a username and password to get started." : "Log in to manage your students."}
          </p>

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={isRegister ? 3 : undefined}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-with-action">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 6 : undefined}
                required
              />
              <button type="button" className="link-btn" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {isRegister && <p className="field-hint">At least 6 characters.</p>}
          </div>

          {isRegister && (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {message && (
            <p className="alert alert-error" role="alert">
              {message}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? isRegister ? "Creating account…" : "Logging in…"
              : isRegister ? "Create account" : "Log in"}
          </button>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New here?"}{" "}
            <button type="button" className="link-btn" onClick={() => switchMode(isRegister ? "login" : "register")}>
              {isRegister ? "Log in" : "Create an account"}
            </button>
          </p>

          
        </form>
      </section>
    </div>
  );
}
