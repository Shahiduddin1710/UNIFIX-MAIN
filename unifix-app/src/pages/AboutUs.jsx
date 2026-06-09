import "../styles/AboutUs.css";
import aboutImg from "../assets/about.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const teamMembers = [
  { name: "Shahiduddin Shaikh", role: "Founder & Developer" },
  { name: "Om Narkar", role: "Developer" },
  { name: "Viraj Sawant", role: "Testing" },
  { name: "Khushi Pandey", role: "Designing" },

];

export default function AboutUs() {
  return (
    <div className="tnc-page about-page">
     
<Navbar active="about" />


      <section className="about-hero">
        <div className="about-hero-text">
          <h1 className="about-hero-title">
            VCET's Trusted<br />
            <strong>Campus Care Platform</strong>
          </h1>

          <div className="about-hero-block">
            <p className="about-hero-lead">We are not just a platform, we are a choice</p>
            <p className="about-hero-body">
              Trusted by the VCET community, UniFiX streamlines complaint
              management, lost &amp; found reporting, and anti-ragging support
              through one unified platform. With transparency, accountability,
              and real-time tracking, we make campus problem-solving faster and
              easier.
            </p>
          </div>

          <div className="about-hero-block">
            <p className="about-hero-lead">What makes us different?</p>
            <p className="about-hero-body">
              UniFiX eliminates the hassle of manual reporting and endless
              follow-ups. Every request is tracked, monitored, and routed to the
              right people instantly. When you think campus support,{" "}
              <strong>think UniFiX.</strong>
            </p>
          </div>
        </div>

       
       <div className="about-hero-visual">
  <div className="about-blob-bg" />

  <div className="about-pill" />
  <img src={aboutImg} alt="UniFiX in action" className="about-hero-img" />
</div>
      </section>

    
      <section className="about-champions">
        <div className="about-champions-left">
          <h2 className="about-champions-title">The Story Behind UniFiX</h2>
          <div className="about-champions-accent" />
          <p className="about-champions-body">
            Since its development in 2026, UniFiX has been built with a vision
            to transform campus management through technology. What started as
            an initiative to simplify complaint reporting has evolved into a
            comprehensive platform that connects students, staff, and
            administration through a single digital ecosystem.
          </p>
          <p className="about-champions-body">
            Driven by innovation, dedication, and a commitment to improving
            campus life, UniFiX continues to enhance transparency, efficiency,
            and accessibility across essential college services.
          </p>
        </div>

        <div className="about-team-grid">
          {teamMembers.map((member) => (
            <div key={member.name} className="about-team-card">
              <div className="about-team-avatar">
                {member.name.charAt(0)}
              </div>
              <p className="about-team-name">{member.name}</p>
              <p className="about-team-role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    
     <Footer />
    </div>
  );
}