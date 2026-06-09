import "../styles/TermsAndConditions.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Para = ({ children }) => <p className="tnc-para">{children}</p>;
const SectionHeading = ({ children }) => <h3 className="tnc-section-heading">{children}</h3>;
const SubHeading = ({ children }) => <h4 className="tnc-sub-heading">{children}</h4>;
const PartHeading = ({ children }) => <h2 className="tnc-part-heading">{children}</h2>;
const UL = ({ children }) => <ul className="tnc-list">{children}</ul>;
const Divider = () => <hr className="tnc-divider" />;
const PhoneLink = ({ number }) => (
  <a
    href={`tel:${number}`}
    style={{ fontWeight: 500, textDecoration: 'none', color: '#16a34a' }}
    className="phone-link"
  >
    {number}
  </a>
);
export default function TermsAndConditions() {
  return (
    <div className="tnc-page">
  <Navbar active="terms" />

   

      <div className="tnc-container">
      
        <h1 className="tnc-main-title">TERMS AND CONDITIONS FOR UNIFIX PLATFORM</h1>
        <p className="tnc-main-subtitle">
          Operated by UniFiX ("VCET", "College", "We", "Us", "Our")
        </p>


        <Para>
          By accessing, downloading, or using the UniFiX Platform, you agree to be bound by these Terms and Conditions.
          If you do not agree, you must immediately discontinue use of the Platform. These Terms supersede all prior
          agreements between you and UniFiX.
        </Para>

        <PartHeading>A. GENERAL TERMS</PartHeading>

        <SectionHeading>I. DEFINITIONS</SectionHeading>
        <Para>In these Terms, unless the context otherwise requires:</Para>
        <UL>
          <li><strong>"Platform"</strong> means the UniFiX mobile application and website.</li>
          <li><strong>"Services"</strong> means complaint management, lost and found, anti-ragging reporting, and related campus services.</li>
          <li><strong>"User" / "You" / "Your"</strong> means any student, teacher, or staff member using the Platform.</li>
          <li><strong>"Complaint"</strong> means any maintenance issue reported through the Platform.</li>
          <li><strong>"Admin"</strong> means authorized college personnel managing the Platform.</li>
          <li><strong>"Staff"</strong> means maintenance staff assigned to resolve complaints.</li>
          <li><strong>"College"</strong> means Vidyavardhini's College of Engineering and Technology, Vasai.</li>
          <li><strong>"HOD"</strong> means Head of Department for anti-ragging escalations.</li>
          <li><strong>"Account"</strong> means your registered account on the Platform.</li>
        </UL>

        <SectionHeading>II. ACCEPTANCE OF TERMS</SectionHeading>
        <Para>
          By accessing, downloading, or using the UniFiX Platform, you agree to be bound by these Terms and
          Conditions. If you do not agree, you must immediately discontinue use of the Platform.
        </Para>
        <Para>These Terms supersede all prior agreements between you and UniFiX.</Para>

        <SectionHeading>III. ELIGIBILITY AND ACCOUNT REGISTRATION</SectionHeading>

        <SubHeading>3.1 Age Requirement</SubHeading>
        <Para>You must be at least 16 years of age to register for this Service.</Para>

        <SubHeading>3.2 Account Information</SubHeading>
        <Para>
          You agree to provide accurate, complete, and current information. Students and teachers must register
          using their official <strong>@vcet.edu.in</strong> email address.
        </Para>

        <SubHeading>3.3 Account Security</SubHeading>
        <Para>
          You are solely responsible for maintaining the confidentiality of your login credentials and for all
          activities under your Account.
        </Para>

        <SubHeading>3.4 Account Termination</SubHeading>
        <Para>We reserve the right to suspend or terminate your Account for any of the following reasons:</Para>
        <UL>
          <li>Violation of these Terms</li>
          <li>Submission of fraudulent complaints</li>
          <li>Harassment of staff or other users</li>
          <li>Extended account inactivity of 12 months or more</li>
        </UL>

        <SectionHeading>IV. YOUR REPRESENTATIONS AND WARRANTIES</SectionHeading>
        <Para>You represent, warrant, and undertake that:</Para>
        <UL>
          <li>You are at least 16 years of age</li>
          <li>You are not restricted by any legal authority from using the Platform</li>
          <li>You will use the Services only for permitted purposes</li>
          <li>All information you provide is true, accurate, and complete</li>
          <li>You will not create multiple accounts for fraudulent purposes</li>
        </UL>

        <SectionHeading>V. YOUR CONDUCT</SectionHeading>
        <Para>You agree NOT to do any of the following:</Para>
        <UL>
          <li>Submit false, misleading, or frivolous complaints</li>
          <li>Use abusive, threatening, or inappropriate language</li>
          <li>Upload offensive, illegal, or harmful images</li>
          <li>Attempt to access restricted areas of the Platform</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Impersonate any other person</li>
          <li>Reverse engineer or extract source code</li>
          <li>Use the Platform for any unlawful purpose</li>
        </UL>

        <SubHeading>Prohibited Content</SubHeading>
        <Para>You shall not upload, display, or transmit any information that:</Para>
        <UL>
          <li>Belongs to another person without right</li>
          <li>Is harmful, offensive, harassing, obscene, or pornographic</li>
          <li>Infringes any intellectual property rights</li>
          <li>Harms minors in any way</li>
          <li>Contains viruses, malware, or harmful code</li>
          <li>Threatens the unity, integrity, or security of India</li>
          <li>Violates any applicable law</li>
        </UL>

        <SectionHeading>VI. SERVICES PROVIDED</SectionHeading>
        <Para>UniFiX provides the following Services:</Para>

        <SubHeading>6.1 Complaint Management</SubHeading>
        <Para>
          A platform to report campus maintenance issues including electrical, plumbing, cleaning, washroom,
          technician, safety, and others. Complaints are routed to appropriate staff members with automatic
          escalation if unresolved.
        </Para>

        <SubHeading>6.2 Lost and Found</SubHeading>
        <Para>
          A system to report lost items and post found items, with handover tracking and claims management.
        </Para>

        <SubHeading>6.3 Anti-Ragging Reporting</SubHeading>
        <Para>
          A confidential reporting mechanism for ragging incidents, with direct escalation to the HOD. Reports
          may be submitted anonymously or with identity.
        </Para>

        <SubHeading>6.4 Support Services</SubHeading>
        <Para>Push notifications, complaint tracking, staff ratings, and other ancillary services.</Para>

        <SectionHeading>VII. COMMUNICATION AND NOTIFICATIONS</SectionHeading>
        <Para>You agree that UniFiX may communicate with you through any of the following means:</Para>
        <UL>
          <li>Push notifications with your consent</li>
          <li>Email at your registered email address</li>
          <li>SMS if phone number is provided</li>
        </UL>
        <Para>
          You may opt out of push notifications through your device settings. Critical service communications
          such as complaint status updates may still be sent.
        </Para>

        <SectionHeading>VIII. PAYMENT FOR SERVICES</SectionHeading>
        <Para>
          The Service is currently provided <strong>FREE of charge</strong>. UniFiX does not charge any fees
          for complaint submission, lost and found posts, or anti-ragging reports.
        </Para>
        <Para>UniFiX reserves the right to introduce paid features in the future, with prior notice to users.</Para>

        <SectionHeading>IX. INTELLECTUAL PROPERTY RIGHTS</SectionHeading>

        <SubHeading>9.1 Our Intellectual Property</SubHeading>
        <Para>
          The UniFiX Platform, including its logo, design, text, graphics, code, and interface, is owned by
          VCET College and is protected by copyright, trademark, and other intellectual property laws.
        </Para>

        <SubHeading>9.2 Your Content</SubHeading>
        <Para>
          You retain ownership of all content you submit. By submitting content, you grant UniFiX a
          non-exclusive, royalty-free license to use, store, and display your content solely to operate the Service.
        </Para>

        <SubHeading>9.3 Restrictions</SubHeading>
        <Para>
          You may not copy, modify, distribute, or create derivative works of the Platform without written consent.
        </Para>

        <SectionHeading>X. EMERGENCY AND ANTI-RAGGING (SOS FEATURE)</SectionHeading>

        <SubHeading>10.1 Anti-Ragging Reporting</SubHeading>
        <Para>
          UniFiX provides a dedicated <strong>"Report Ragging"</strong> feature. By using this feature:
        </Para>
        <UL>
          <li>Your report is immediately sent to the HOD</li>
          <li>You may choose to remain anonymous</li>
          <li>False or malicious reports may result in disciplinary action</li>
        </UL>

    <SubHeading>10.2 Emergency Contacts</SubHeading>
        <Para>In case of a genuine emergency on campus, you are advised to immediately contact:</Para>
        <UL>
          <li>College Security: <PhoneLink number="9874563210" /></li>
          <li>Local Police: <PhoneLink number="100" /></li>
          <li>Ambulance: <PhoneLink number="102" /></li>
        </UL>

        <SubHeading>10.3 Misuse of SOS Feature</SubHeading>
        <Para>
          Misusing the Anti-Ragging feature for false complaints will result in account termination and may lead
          to disciplinary action by the College.
        </Para>

        <SectionHeading>XI. DISCLAIMERS</SectionHeading>
        <p className="tnc-caps">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
        </p>
        <Para>UniFiX does not warrant that:</Para>
        <UL>
          <li>Complaints will be resolved within any specific timeframe</li>
          <li>The Service will be uninterrupted or error-free</li>
          <li>All staff will be available at all times</li>
        </UL>
        <Para>
          The Platform is a communication and tracking tool. Actual maintenance resolution is the responsibility
          of the College facilities department.
        </Para>
        <Para>UniFiX is not responsible for:</Para>
        <UL>
          <li>The behaviour, actions, or inactions of staff members</li>
          <li>The quality of maintenance work performed</li>
          <li>Delays caused by circumstances beyond our control</li>
        </UL>

        <SectionHeading>XII. LIMITATION OF LIABILITY</SectionHeading>
        <p className="tnc-caps">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <UL>
          <li>UniFiX shall not be liable for any indirect, incidental, or consequential damages</li>
          <li>UniFiX shall not be liable for loss of data, profits, or reputation</li>
          <li>UniFiX shall not be liable for unauthorized access to your data</li>
        </UL>

        <SubHeading>Total Liability Cap</SubHeading>
        <Para>
          UniFiX's total liability to you for all claims arising out of or related to your use of the Service
          shall not exceed <strong>₹500 (Indian Rupees)</strong>, even if advised of the possibility of such
          damages. Since the Service is free, this cap applies to any claim, including negligence claims.
        </Para>

        <SectionHeading>XIII. FORCE MAJEURE</SectionHeading>
        <Para>UniFiX shall not be liable for any delay or failure to perform resulting from any of the following:</Para>
        <UL>
          <li>Natural disasters including earthquakes, floods, and storms</li>
          <li>War, terrorism, or civil unrest</li>
          <li>Government actions or regulations</li>
          <li>Internet or power outages</li>
          <li>Cyberattacks or server failures</li>
          <li>Labor strikes or shortages</li>
        </UL>

        <SectionHeading>XIV. INDEMNIFICATION</SectionHeading>
        <Para>
          You agree to indemnify, defend, and hold harmless UniFiX, VCET College, its officers, directors,
          employees, and agents from any claims, damages, losses, and expenses including legal fees arising
          out of or related to:
        </Para>
        <UL>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Any content you submit</li>
        </UL>

        <SectionHeading>XV. TERM AND TERMINATION</SectionHeading>

        <SubHeading>15.1 Term</SubHeading>
        <Para>These Terms are effective until terminated by either party.</Para>

        <SubHeading>15.2 Termination by You</SubHeading>
        <Para>You may terminate at any time by deleting your Account.</Para>

        <SubHeading>15.3 Termination by UniFiX</SubHeading>
        <Para>
          UniFiX may terminate your Account immediately if you violate these Terms, misuse the Platform,
          or act fraudulently.
        </Para>

        <SubHeading>15.4 Effect of Termination</SubHeading>
        <Para>
          Upon termination, your access to the Platform will be disabled, and your data will be deleted
          in accordance with Section XVI.
        </Para>

        <SectionHeading>XVI. DATA RETENTION AND PRIVACY</SectionHeading>

        <SubHeading>16.1 Data Retention</SubHeading>
        <Para>
          When you delete your Account, your personal information will be retained for 15 days before
          permanent deletion. Complaint records may be retained for longer periods for audit and legal
          compliance purposes.
        </Para>

        <SubHeading>16.2 Privacy Policy</SubHeading>
        <Para>
          Please read our separate Privacy Policy for detailed information on data collection, use,
          and protection.
        </Para>

        <SectionHeading>XVII. GOVERNING LAW AND DISPUTE RESOLUTION</SectionHeading>

        <SubHeading>17.1 Governing Law</SubHeading>
        <Para>These Terms shall be governed by the laws of the Republic of India.</Para>

        <SubHeading>17.2 Jurisdiction</SubHeading>
        <Para>
          The courts of Palghar, Maharashtra shall have exclusive jurisdiction over any disputes arising
          under these Terms.
        </Para>

        <SubHeading>17.3 Dispute Resolution – Arbitration</SubHeading>
        <Para>
          Any dispute arising out of these Terms shall first be attempted to be resolved amicably within
          15 days. If unresolved, the dispute shall be referred to binding arbitration in accordance with
          the Arbitration and Conciliation Act, 1996.
        </Para>
        <UL>
          <li>The arbitration shall be conducted by a single arbitrator mutually appointed by both parties</li>
          <li>The seat of arbitration shall be Palghar, Maharashtra</li>
          <li>The language of arbitration shall be English</li>
          <li>The arbitrator's award shall be final and binding</li>
        </UL>

        <SubHeading>17.4 Class Action Waiver</SubHeading>
        <p className="tnc-caps">
          YOU AGREE TO BRING ANY CLAIMS AGAINST UNIFIX ONLY IN YOUR INDIVIDUAL CAPACITY AND NOT AS
          A CLASS ACTION.
        </p>

        <SectionHeading>XVIII. SEVERABILITY</SectionHeading>
        <Para>
          If any provision of these Terms is found to be unenforceable, the remaining provisions shall
          remain in full force and effect.
        </Para>

        <SectionHeading>XIX. ENTIRE AGREEMENT</SectionHeading>
        <Para>
          These Terms, together with the Privacy Policy, constitute the entire agreement between you and
          UniFiX regarding the Service.
        </Para>

        <SectionHeading>XX. NO WAIVER</SectionHeading>
        <Para>
          UniFiX's failure to enforce any right or provision shall not be considered a waiver of those rights.
        </Para>

        <SectionHeading>XXI. CHANGES TO THESE TERMS</SectionHeading>
        <Para>
          UniFiX may modify these Terms at any time. Users will be notified of significant changes via
          in-app notification or email. Your continued use after changes constitutes acceptance.
        </Para>

       <SectionHeading>XVIII. GRIEVANCE REDRESSAL</SectionHeading>
<Para>
  Customer Care details: <a href="mailto:unifix.helpdesk@gmail.com">unifix.helpdesk@gmail.com</a>
</Para>
<Para>
  Alternatively, you can contact Customer Care using the chat functionality on the UniFiX App and an associate will get back to you. 
  You can also reach out to the Customer Care through our 24*7 call support with respect to any technical issues faced by you on 
  the Platform or for emergency safety and security situations.
</Para>


        <Divider />

        <PartHeading>B. SPECIAL TERMS</PartHeading>

        <SectionHeading>I. COMPLAINT MANAGEMENT SERVICES</SectionHeading>

        <SubHeading>I.1 Submission Rules</SubHeading>
        <UL>
          <li>Complaints can only be submitted between <strong>8:00 AM and 8:00 PM IST</strong></li>
          <li>Users must provide accurate location including building and room number</li>
          <li>Photo upload is optional but encouraged</li>
        </UL>

        <SubHeading>I.2 Categories and Response Time Limits</SubHeading>
    <UL>
  <li><strong>Cleaning, Housekeeping, and Washroom</strong> - Response Time: 1 hour</li>
  <li><strong>Technician, IT, Lab, Safety, and Others</strong> - Response Time: 2 hours</li>
  <li><strong>Electrical, Plumbing, Civil, and Carpentry</strong> - Response Time: 24 hours</li>
</UL>

        <SubHeading>I.3 Staff Assignment</SubHeading>
        <UL>
          <li>Eligible staff receive notifications for new complaints</li>
          <li>Staff may accept or reject complaints with reason</li>
          <li>If all staff reject, the complaint is marked as rejected and the user is notified</li>
          <li>Gender-based routing applies to washroom complaints</li>
        </UL>

        <SubHeading>I.4 Escalation Workflow</SubHeading>
        <UL>
          <li>If unresolved within time limit, the complaint is flagged</li>
          <li>Admin receives notification</li>
          <li>If no admin action after 20 minutes, HOD escalation email is sent</li>
        </UL>

        <SubHeading>I.5 Ratings</SubHeading>
        <UL>
          <li>Users may rate completed complaints from 1 to 5 stars</li>
          <li>Ratings are anonymous and affect staff performance metrics</li>
        </UL>

        <SectionHeading>II. LOST AND FOUND SERVICES</SectionHeading>

        <SubHeading>II.1 Lost Reports for Students and Teachers</SubHeading>
        <UL>
          <li>Users may post lost items with description, location, and optional photo</li>
          <li>Posts remain active for <strong>14 days</strong> from the lost date</li>
          <li>Users may mark their item as "Found" or delete their report</li>
        </UL>

        <SubHeading>II.2 Found Items for Staff Only</SubHeading>
        <UL>
          <li>Staff may post found items</li>
          <li>Staff may mark items as "Handed Over" with recipient name</li>
        </UL>

        <SubHeading>II.3 Claims and Handover</SubHeading>
        <UL>
          <li>Handover records are publicly visible in the Claims tab</li>
          <li>All handovers are logged with timestamp and recipient name</li>
        </UL>

        <SectionHeading>III. ANTI-RAGGING REPORTING</SectionHeading>

        <SubHeading>III.1 Confidential Reporting</SubHeading>
        <UL>
          <li>Users may report ragging incidents confidentially</li>
          <li>Anonymous option is available</li>
          <li>Reports go directly to the HOD via email</li>
        </UL>

        <SubHeading>III.2 Legal Compliance</SubHeading>
        <UL>
          <li>Reports are processed in compliance with UGC Anti-Ragging Regulations</li>
          <li>The College will take appropriate action within 72 hours</li>
        </UL>

        <SubHeading>III.3 False Reports</SubHeading>
        <UL>
          <li>Knowingly filing a false ragging report is a serious offense</li>
          <li>May result in disciplinary action under College policy</li>
        </UL>

        <SectionHeading>IV. STAFF OBLIGATIONS</SectionHeading>

<SubHeading>IV.1 Response Requirements</SubHeading>
<Para>Staff must respond to assigned complaints within the following timeframes:</Para>
<UL>
  <li><strong>Accept or Reject complaint</strong> - 1 hour</li>
  <li><strong>Update status to "In Progress"</strong> - Within category limit</li>
  <li><strong>Mark as "Completed"</strong> - Within category limit</li>
</UL>

        <SubHeading>IV.2 Professional Conduct</SubHeading>
        <Para>Staff must adhere to all of the following:</Para>
        <UL>
          <li>Handle complaints professionally and respectfully</li>
          <li>Not misrepresent work completion</li>
          <li>Respect user privacy</li>
        </UL>

        <SubHeading>IV.3 Consequences of Misconduct</SubHeading>
        <UL>
          <li>Low ratings may affect performance reviews</li>
          <li>Repeated violations may result in account termination</li>
          <li>Serious misconduct will be reported to College administration</li>
        </UL>

        <Divider />

 
      </div>

    <Footer />
    </div>
  );
}