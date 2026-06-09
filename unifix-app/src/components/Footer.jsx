import logo from "../assets/icon.png";

const PhoneLink = ({ number }) => (
  <a
    href={"tel:" + number}
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: 500,
      textDecoration: "none",
    }}
    className="phone-link"
  >
    {number}
  </a>
);
export default function Footer() {
  return (
    <footer className="tnc-footer">
      <div className="tnc-footer-top">
        <div>
          <div className="tnc-footer-brand">
            <div className="tnc-footer-brand-icon">
              <img src={logo} alt="UniFiX Logo" />
            </div>
            <span className="tnc-footer-brand-name">Uni<span>FiX</span></span>
          </div>
          <p className="tnc-footer-tagline">
            Campus Care At Your Fingertip.
          </p>
        </div>

        <div className="tnc-footer-links-group">
          <h4>Platform</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>

        <div className="tnc-footer-links-group">
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms &amp; Conditions</a></li>
            <li><a href="/grievance">Grievance Redressal</a></li>
            <li><a href="/copyright">Copyright Policy</a></li>
          </ul>
        </div>

        <div className="tnc-footer-links-group">
          <h4>Support</h4>
          <ul>
            <li><a href="mailto:unifix.helpdesk@gmail.com">unifix.helpdesk@gmail.com</a></li>
            <li><strong>Emergency:</strong> <PhoneLink number="9874563210" /></li>
          </ul>
        </div>
      </div>

      <div className="tnc-footer-bottom">
        <span className="tnc-footer-copy">
          &copy; 2026 UniFiX. All rights reserved.
        </span>
        <span className="tnc-footer-version">UniFiX Platform v1.0</span>
      </div>
    </footer>
  );
}