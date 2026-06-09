import "../styles/TermsAndConditions.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Para = ({ children }) => <p className="tnc-para">{children}</p>;
const SubHeading = ({ children }) => <h4 className="tnc-sub-heading">{children}</h4>;
const PartHeading = ({ children }) => <h2 className="tnc-part-heading">{children}</h2>;
const UL = ({ children }) => <ul className="tnc-list">{children}</ul>;

export default function GrievanceRedressal() {
  return (
    <div className="tnc-page">
      <Navbar />

      <div className="tnc-container">
        <h1 className="tnc-main-title">GRIEVANCE REDRESSAL MECHANISM</h1>
        <p className="tnc-main-subtitle">
          In accordance with applicable provisions of the Information Technology Act, 2000 and related rules, where applicable
        </p>

        <PartHeading>1. Overview</PartHeading>
        <Para>
          UniFiX is committed to addressing all grievances and complaints in a timely,
          fair, and transparent manner. This page outlines the process for raising
          concerns related to the UniFiX Platform and its Services.
        </Para>

        <PartHeading>2. Who Can File a Grievance?</PartHeading>
        <Para>
          Any user of the UniFiX Platform, including Students, Teachers, Staff Members,
          or any other individual affected by the Services, may file a grievance.
        </Para>

        <PartHeading>3. Types of Grievances Covered</PartHeading>
        <UL>
          <li>Technical issues with the UniFiX App or Website</li>
          <li>Data privacy and security concerns</li>
          <li>Misuse of personal information</li>
          <li>Inappropriate conduct by staff members</li>
          <li>Unresolved complaints or delays</li>
          <li>Anti-ragging report mishandling</li>
          <li>Lost &amp; Found disputes</li>
          <li>Any other violation of UniFiX Terms and Conditions or Privacy Policy</li>
        </UL>

        <PartHeading>4. Grievance Redressal Process</PartHeading>
        <UL>
          <li>
            <strong>Step 1:</strong> Submit your grievance in writing via email to the
            Grievance Officer
          </li>
          <li>
            <strong>Step 2:</strong> Acknowledgment within 24 hours of receipt
          </li>
          <li>
            <strong>Step 3:</strong> Initial review and investigation within 7 days
          </li>
          <li>
            <strong>Step 4:</strong> Resolution or final response within 15 days
          </li>
          <li>
            <strong>Step 5:</strong> Appeal to College Administration if unsatisfied
            with the resolution
          </li>
        </UL>

        <PartHeading>5. Grievance Officer Details</PartHeading>
        <Para>
          <strong>Name:</strong> Shahiduddin
        </Para>
        <Para>
          <strong>Designation:</strong> Grievance Officer &amp; Platform Administrator,
          UniFiX
        </Para>
        <Para>
          <strong>Email:</strong>{" "}
          <a href="mailto:unifix.helpdesk@gmail.com">
            unifix.helpdesk@gmail.com
          </a>
        </Para>
       
        <Para>
          <strong>Response Time:</strong> Acknowledgment within 24 hours and
          resolution within 15 days
        </Para>

        <PartHeading>6. How to File a Grievance</PartHeading>
        <Para>You can file a grievance by:</Para>

        <UL>
          <li>
            Sending an email to{" "}
            <a href="mailto:unifix.helpdesk@gmail.com">
              unifix.helpdesk@gmail.com
            </a>{" "}
            with the subject line "Grievance: [Brief Description]"
          </li>
          <li>Using the contact form available on our Contact Us page</li>
          <li>Writing a physical letter to the address mentioned above</li>
        </UL>

        <SubHeading>Please include:</SubHeading>

        <UL>
          <li>Your full name and role (Student/Teacher/Staff)</li>
          <li>Your registered email address or phone number</li>
          <li>A clear description of the issue</li>
          <li>Any supporting documents or screenshots</li>
          <li>Your preferred resolution (if any)</li>
        </UL>

        <PartHeading>7. Escalation Matrix</PartHeading>
        <UL>
          <li>
            <strong>Level 1 - Grievance Officer:</strong>{" "}
            unifix.helpdesk@gmail.com (Response within 15 days)
          </li>
          <li>
            <strong>Level 2 - College Administration:</strong> Through official
            college channels (Response within 10 days after escalation)
          </li>
          <li>
            <strong>Level 3 - University / Statutory Authority:</strong> As
            permitted under applicable laws and regulations
          </li>
        </UL>

        <PartHeading>8. Important Notes</PartHeading>
        <UL>
          <li>All grievances are treated confidentially</li>
          <li>
            False or malicious complaints may result in disciplinary action
          </li>
          <li>
            Anonymous grievances will be reviewed but may have limited resolution
            options
          </li>
          <li>
            For emergency situations, users should immediately contact College
            Security, local emergency services, or the relevant authorities
          </li>
        </UL>

       
      </div>

      <Footer />
    </div>
  );
}