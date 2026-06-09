import { useState } from "react";
import logo from "../assets/icon.png";
import "../styles/Navbar.css";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="tnc-navbar">
      <Link to="/" className="tnc-navbar-logo">
        <div className="tnc-navbar-logo-icon">
          <img src={logo} alt="UniFiX Logo" />
        </div>
        <span className="tnc-navbar-brand">
          Uni<span>FiX</span>
        </span>
      </Link>

      <button 
        className={`tnc-hamburger ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul className={`tnc-navbar-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <li>
          <Link to="/" className={isActive("/") ? "active" : ""} onClick={closeMenu}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/about" className={isActive("/about") ? "active" : ""} onClick={closeMenu}>
            About Us
          </Link>
        </li>
        <li>
          <Link to="/privacy" className={isActive("/privacy") ? "active" : ""} onClick={closeMenu}>
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link to="/terms" className={isActive("/terms") ? "active" : ""} onClick={closeMenu}>
            Terms
          </Link>
        </li>
        <li>
          <Link to="/contact" className={isActive("/contact") ? "active" : ""} onClick={closeMenu}>
            Contact Us
          </Link>
        </li>
        <li>
          <a
            href="https://expo.dev/accounts/unifix-official/projects/unifix/builds/9cd6afe0-5162-4322-ac34-81bfc7db8174"
            className="tnc-navbar-btn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
          >
            Download App
          </a>
        </li>
      </ul>
    </nav>
  );
}