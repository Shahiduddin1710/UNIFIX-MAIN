import "../styles/Home.css";
import Navbar from "../components/Navbar";
import homeImg from "../assets/home.png";
import servicesImg from "../assets/services.png";
import logo from "../assets/icon.png";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="tnc-page home-page">
      <Navbar />

      <section className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-hero-title">
            Campus Care<br />
            <strong>Platform</strong>
          </h1>
          <p className="home-hero-sub">
            Smart, fast, and transparent campus management at your fingertips.
          </p>
          <div className="home-hero-actions">
           <Link to="/download" className="home-btn-primary">Download App</Link>
            <Link to="/about" className="home-btn-secondary">Learn More</Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-blob" />
          <div className="home-hero-pill" />
          <img src={homeImg} alt="UniFiX App" className="home-hero-img" />
        </div>
      </section>

      <section className="home-services">
        <h2 className="home-services-title">Our Services</h2>
        <div className="home-services-accent" />
        <img src={servicesImg} alt="Our Services" className="home-services-img" />
      </section>

     <footer className="home-footer">
        <div className="home-footer-top">
          <Link to="/" className="home-footer-logo">
            <img src={logo} alt="UniFiX" className="home-footer-logo-img" />
            <span className="home-footer-brand">Uni<span>FiX</span></span>
          </Link>
          <p className="home-footer-tagline">Campus care platform by VCET, Vasai.</p>

          <div className="home-footer-links">
            <div className="home-footer-col">
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
           <div className="home-footer-col">
  <Link to="/terms">Terms & Conditions</Link>
  <Link to="/grievance">Grievance Redressal</Link>
  <Link to="/copyright">Copyright Policy</Link>
</div>
          </div>
        </div>

     <div className="home-footer-bottom">
          <span> &copy; 2026 UniFiX. All rights reserved.</span>
          <div className="home-footer-socials">
            {/* <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a> */}
            {/* <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
              </svg>
            </a> */}
            <a href="https://x.com/unifix365" target="_blank" rel="noreferrer" aria-label="X">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}