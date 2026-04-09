import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../services/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    display: flex; min-height: 100vh;
    font-family: 'DM Sans', sans-serif; background: #fff;
  }

  .login-left {
    flex: 0 0 52%; background: #0f172a;
    position: relative; overflow: hidden;
    display: flex; align-items: stretch;
  }

  .login-left::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(22,163,74,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(22,163,74,0.06) 0%, transparent 50%);
    pointer-events: none;
  }

  .login-left-grid {
    position: absolute; inset: 0; opacity: 0.03;
    background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .login-left-inner {
    padding: 44px 52px; display: flex; flex-direction: column;
    justify-content: space-between; position: relative; z-index: 1; width: 100%;
  }

  .login-brand { display: flex; align-items: center; gap: 13px; }

.login-brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: transparent; 
  overflow: hidden;
}

  .login-brand-mark span {
    font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -1px;
  }

  .login-brand-name { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
  .login-brand-sub { font-size: 10px; font-weight: 700; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }

  .login-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding-top: 36px; }

  .login-hero-tag {
    font-size: 10px; font-weight: 700; color: #4ade80;
    letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 22px;
    display: flex; align-items: center; gap: 8px;
  }

  .login-hero-tag::before {
    content: ''; width: 20px; height: 2px; background: #4ade80; border-radius: 1px;
  }

  .login-hero-title {
    font-size: 50px; font-weight: 800; color: #fff;
    line-height: 1.08; letter-spacing: -1.5px; margin-bottom: 22px;
  }

  .login-hero-title span { color: #4ade80; }

  .login-hero-desc {
    font-size: 15px; color: rgba(255,255,255,0.45);
    line-height: 1.75; max-width: 340px;
  }

  .login-stats {
    display: flex; gap: 36px;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-top: 30px;
  }

  .login-stat-num { font-size: 22px; font-weight: 800; color: #4ade80; line-height: 1; }
  .login-stat-label { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; margin-top: 5px; }

  .login-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px 32px; background: #f8fafc;
  }

  .login-card {
    width: 100%; max-width: 392px; background: #fff;
    border-radius: 20px; padding: 40px 36px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
    border: 1px solid #f1f5f9;
  }

  .login-card-title { font-size: 25px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 5px; }
  .login-card-sub { font-size: 14px; color: #94a3b8; font-weight: 400; margin-bottom: 30px; }

  .login-form { display: flex; flex-direction: column; gap: 18px; }

  .login-field { display: flex; flex-direction: column; gap: 6px; }
  .login-label { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: 0.2px; }

  .login-input-wrap { position: relative; display: flex; align-items: center; }

  .login-input-icon {
    position: absolute; left: 13px; display: flex; align-items: center;
    color: #94a3b8; pointer-events: none; z-index: 1;
  }

  .login-input {
    width: 100%; padding: 12px 16px 12px 40px;
    border-radius: 10px; border: 1.5px solid #e2e8f0;
    font-size: 14px; color: #0f172a; background: #f8fafc;
    outline: none; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }

  .login-input:focus { border-color: #16a34a; background: #fff; }
  .login-input::placeholder { color: #cbd5e1; }

  .login-eye-btn {
    position: absolute; right: 12px; background: none; border: none;
    cursor: pointer; padding: 4px; display: flex; align-items: center;
    color: #94a3b8; transition: color 0.15s;
  }

  .login-eye-btn:hover { color: #475569; }

  .login-error {
    display: flex; align-items: center; gap: 9px;
    background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 10px; padding: 10px 14px;
    font-size: 13px; font-weight: 500;
  }

  .login-submit {
    width: 100%; background: #16a34a; color: #fff; border: none;
    border-radius: 11px; padding: 14px; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, transform 0.1s;
    margin-top: 2px;
  }

  .login-submit:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
  .login-submit:disabled { opacity: 0.7; cursor: not-allowed; }

  .login-footer {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-top: 26px;
    font-size: 12px; color: #cbd5e1; font-weight: 500;
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }

  @media (max-width: 768px) {
    .login-left { display: none; }
    .login-right { padding: 24px 20px; }
    .login-card { padding: 32px 24px; }
  }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim())
      return setError("Email and password are required.");
    setLoading(true);
    try {
      const res = await adminAPI.login(email, password);
      localStorage.setItem("unifix_admin_token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-root">
        <div className="login-left">
          <div className="login-left-grid" />
          <div className="login-left-inner">
            <div className="login-brand">
              <div className="login-brand-mark">
                <img
                  src="/logo192.png"
                  alt="logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "11px",
                  }}
                />
              </div>
              <div>
                <div className="login-brand-name">UniFiX</div>
                <div className="login-brand-sub">Admin Portal</div>
              </div>
            </div>

            <div className="login-hero">
              <div className="login-hero-tag">Campus Management</div>
              <h1 className="login-hero-title">
                CAMPUS CARE AT YOUR
                <br />
                <span>FINGERTIPS.</span>
              </h1>
              <p className="login-hero-desc">
                Manage staff verifications, track complaints in real-time, and
                oversee campus operations from one unified dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-card-title">Sign in</div>
            <div className="login-card-sub">
              Enter your admin credentials to continue
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-field">
                <label className="login-label">Email Address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <Mail size={15} />
                  </span>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="admin@vcet.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <Lock size={15} />
                  </span>
                  <input
                    className="login-input"
                    style={{ paddingRight: 44 }}
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPass((p) => !p)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <ShieldCheck size={13} />
              Secure admin access only
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
