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
    <div className="login-root flex min-h-screen font-['DM_Sans'] bg-white">
      {/* Left Section */}
      <div className="login-left hidden md:flex flex-[0_0_52%] bg-[#0f172a] relative overflow-hidden items-stretch">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_50%,rgba(22,163,74,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(22,163,74,0.06)_0%,transparent_50%)]" />
        <div className="login-left-grid absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="login-left-inner relative z-10 w-full p-[44px_52px] flex flex-col justify-between">
          <div className="login-brand flex items-center gap-[13px]">
            <div className="login-brand-mark w-[42px] h-[42px] rounded-[11px] bg-transparent overflow-hidden">
              <img
                src="/logo192.png"
                alt="logo"
                className="w-full h-full object-cover rounded-[11px]"
              />
            </div>
            <div>
              <div className="login-brand-name text-[19px] font-[800] text-white tracking-[-0.3px]">UniFiX</div>
              <div className="login-brand-sub text-[10px] font-[700] text-[#4ade80] tracking-[1.5px] uppercase mt-[2px]">Admin Portal</div>
            </div>
          </div>

          <div className="login-hero flex-1 flex flex-col justify-center pt-[36px]">
            <div className="login-hero-tag text-[10px] font-[700] text-[#4ade80] tracking-[2.5px] uppercase mb-[22px] flex items-center gap-[8px] before:content-[''] before:w-[20px] before:height-[2px] before:bg-[#4ade80] before:rounded-[1px]">
              Campus Management
            </div>
            <h1 className="login-hero-title text-[50px] font-[800] text-white leading-[1.08] tracking-[-1.5px] mb-[22px]">
              CAMPUS CARE AT YOUR
              <br />
              <span className="text-[#4ade80]">FINGERTIPS.</span>
            </h1>
            <p className="login-hero-desc text-[15px] text-white/45 leading-[1.75] max-w-[340px]">
              Manage staff verifications, track complaints in real-time, and
              oversee campus operations from one unified dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="login-right flex-1 flex items-center justify-center p-[40px_32px] sm:p-[24px_20px] bg-[#f8fafc]">
        <div className="login-card w-full max-w-[392px] bg-white rounded-[20px] p-[40px_36px] sm:p-[32px_24px] shadow-[0_4px_32px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)] border border-[#f1f5f9]">
          <div className="login-card-title text-[25px] font-[800] text-[#0f172a] tracking-[-0.5px] mb-[5px]">Sign in</div>
          <div className="login-card-sub text-[14px] text-[#94a3b8] font-[400] mb-[30px]">
            Enter your admin credentials to continue
          </div>

          <form className="login-form flex flex-col gap-[18px]" onSubmit={handleLogin}>
            <div className="login-field flex flex-col gap-[6px]">
              <label className="login-label text-[12px] font-[700] text-[#374151] tracking-[0.2px]">Email Address</label>
              <div className="login-input-wrap relative flex items-center">
                <span className="login-input-icon absolute left-[13px] flex items-center text-[#94a3b8] pointer-events-none z-10">
                  <Mail size={15} />
                </span>
                <input
                  className="login-input w-full p-[12px_16px_12px_40px] rounded-[10px] border-[1.5px] border-[#e2e8f0] text-[14px] text-[#0f172a] bg-[#f8fafc] outline-none transition-[border-color,background] duration-150 focus:border-[#16a34a] focus:bg-white placeholder:text-[#cbd5e1]"
                  type="email"
                  placeholder="admin@vcet.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field flex flex-col gap-[6px]">
              <label className="login-label text-[12px] font-[700] text-[#374151] tracking-[0.2px]">Password</label>
              <div className="login-input-wrap relative flex items-center">
                <span className="login-input-icon absolute left-[13px] flex items-center text-[#94a3b8] pointer-events-none z-10">
                  <Lock size={15} />
                </span>
                <input
                  className="login-input w-full p-[12px_44px_12px_40px] rounded-[10px] border-[1.5px] border-[#e2e8f0] text-[14px] text-[#0f172a] bg-[#f8fafc] outline-none transition-[border-color,background] duration-150 focus:border-[#16a34a] focus:bg-white placeholder:text-[#cbd5e1]"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn absolute right-[12px] bg-none border-none cursor-pointer p-[4px] flex items-center text-[#94a3b8] transition-colors duration-150 hover:text-[#475569]"
                  onClick={() => setShowPass((p) => !p)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error flex items-center gap-[9px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-[10px] p-[10px_14px] text-[13px] font-[500]">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="login-submit w-full bg-[#16a34a] text-white border-none rounded-[11px] p-[14px] text-[15px] font-[700] cursor-pointer flex items-center justify-center gap-[8px] transition-[background,transform] duration-150 hover:not-disabled:bg-[#15803d] hover:not-disabled:-translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed mt-[2px]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer flex items-center justify-center gap-[8px] mt-[26px] text-[12px] text-[#cbd5e1] font-[500]">
            <ShieldCheck size={13} />
            Secure admin access only
          </div>
        </div>
      </div>
    </div>
  );
}