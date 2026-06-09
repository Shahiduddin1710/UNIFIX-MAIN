import "../styles/TermsAndConditions.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
const Para = ({ children }) => <p className="tnc-para">{children}</p>;
const SectionHeading = ({ children }) => <h3 className="tnc-section-heading">{children}</h3>;
const SubHeading = ({ children }) => <h4 className="tnc-sub-heading">{children}</h4>;
const PartHeading = ({ children }) => <h2 className="tnc-part-heading">{children}</h2>;
const UL = ({ children }) => <ul className="tnc-list">{children}</ul>;


export default function PrivacyPolicy() {
  return (
    <div className="tnc-page">
<Navbar active="privacy" />

      <div className="tnc-container">
        <h1 className="tnc-main-title">PRIVACY POLICY</h1>
        <p className="tnc-main-subtitle">
          Your privacy matters to UniFiX (the "College", "we", "us" or "our")
        </p>

        <Para>
          This Privacy Policy ("Policy") describes the policies and procedures on the collection, use, processing, 
          storage, retrieval, disclosure, transfer and protection of your information, including personal information 
          and sensitive personal data or information ("Information"), that UniFiX may receive through your online 
          access, interaction or use of the UniFiX mobile application ("UniFiX App") or our website (the website and 
          UniFiX App are collectively referred to as the "UniFiX Platform") or through your offline interaction with 
          us including through mails, phones, in person, etc., or while availing our Services.
        </Para>

        <Para>
          The terms "you" and "your" refer to a Student, Teacher, Staff Member, Admin or any other user of the UniFiX 
          Platform and / or availing the Services (defined below).
        </Para>

        <Para>
          The term "Services" refers to any services offered by UniFiX in accordance with the terms and conditions 
          applicable to you (and available on the UniFiX Platform) whether on the UniFiX Platform or otherwise.
        </Para>

        <Para>
          Capital terms not defined herein have the meaning assigned to them in the terms and conditions applicable 
          to you and available on UniFiX Platform.
        </Para>

        <Para>
          Please read this Policy before using the UniFiX Platform or submitting any Information to UniFiX. This Policy 
          is a part of and incorporated within, and is to be read along with, the terms and conditions applicable to 
          the users of the UniFiX App available on the UniFiX Platform.
        </Para>

        <PartHeading>1. USER ACCEPTANCE</PartHeading>

        <Para>
          By accessing or using the UniFiX Platform or the Services, you agree and consent to this Policy, along with 
          any amendments made by the College at its sole discretion and posted on the UniFiX Platform from time to time.
        </Para>

        <Para>
          Any collection, processing, retrieval, transfer, use, storage, disclosure and protection of your Information 
          will be in accordance with this Policy and applicable laws including but not limited to Information Technology 
          Act, 2000, and the rules framed thereunder ("Applicable Laws"). If you do not agree with the Policy, please 
          do not use or access the UniFiX Platform.
        </Para>

        <Para>You hereby represent to UniFiX that:</Para>

        <UL>
          <li>The Information you provide to UniFiX from time to time, is and will be authentic, correct, current and updated and you have all the rights, permissions and consents as may be required to provide such Information to UniFiX.</li>
          <li>Your providing of the Information as well as UniFiX's consequent storage, collection, usage, transfer, access, or processing of such Information will not be in violation of any agreement, Applicable Laws, charter documents, judgments, orders and decrees.</li>
          <li>If you disclose to us any Information relating to other people, you represent that you have the authority to do so and to permit us to use such Information in accordance with this Policy.</li>
        </UL>

        <PartHeading>2. DEFINITIONS</PartHeading>

        <Para>Unless otherwise provided in this Policy, the terms capitalized in the Policy shall have the meaning as provided hereunder:</Para>

        <UL>
          <li><strong>"Admin"</strong> means authorized college personnel who manage the UniFiX Platform and oversee complaints.</li>
          <li><strong>"Complaint"</strong> means any maintenance issue reported through the UniFiX Platform.</li>
          <li><strong>"Customer"</strong> shall mean a Student or Teacher who uses the Services.</li>
          <li><strong>"Device"</strong> shall mean computer, mobile or other device used to access the Services.</li>
          <li><strong>"Device Identifier"</strong> shall mean IP address or other unique identifier of the Device.</li>
          <li><strong>"Personal Information"</strong> shall mean such categories of information that could reasonably be used to identify you personally, including your name, email address, mobile number, and college ID.</li>
          <li><strong>"Staff"</strong> means maintenance staff assigned to resolve complaints.</li>
          <li><strong>"Student"</strong> means a currently enrolled student of VCET College.</li>
          <li><strong>"Teacher"</strong> means a faculty member of VCET College.</li>
          <li><strong>"TPSP"</strong> shall mean a third-party service provider.</li>
          <li><strong>"Usage Information"</strong> shall have the meaning assigned to the term in paragraph 4(II) hereto.</li>
        </UL>

        <PartHeading>3. WHAT INFORMATION DO WE COLLECT?</PartHeading>

        <SectionHeading>I. INFORMATION YOU PROVIDE TO US</SectionHeading>

        <SubHeading>Personal Information:</SubHeading>
        <Para>
          We may ask you to provide certain Personal Information to us. We may collect this information through various 
          means and in various places for the provision of Services, including account registration forms, complaint 
          submission forms, or when you otherwise interact with us. When you sign up to use the Services, you create a 
          user profile. We shall ask you to provide only such Personal Information which is for lawful purpose connected 
          with our Services and necessary to be collected by us for such purpose.
        </Para>

        <Para>The Information you provide to us includes the following:</Para>

        <SubHeading>Account Information:</SubHeading>
        <Para>Create or update your UniFiX account which may include your full name, email address, phone number, gender, role (Student, Teacher, or Staff), password, etc.</Para>

        <SubHeading>Academic Information (for Students):</SubHeading>
        <Para>Branch, year, roll number, student ID card.</Para>

        <SubHeading>Professional Information (for Teachers):</SubHeading>
        <Para>Department, teacher ID, teacher ID card.</Para>

        <SubHeading>Employment Information (for Staff):</SubHeading>
        <Para>Employee ID, designation, years of experience, ID card, certificate.</Para>

        <SubHeading>Complaint Information:</SubHeading>
        <Para>Category of complaint, sub-issue, description, location (building and room number), photos of the issue.</Para>

        <SubHeading>Lost & Found Information:</SubHeading>
        <Para>Item name, category, description, location lost or found, date lost, how to reach you, photos of the item.</Para>

        <SubHeading>Anti-Ragging Information:</SubHeading>
        <Para>Incident date, time, location, description, person(s) involved, anonymous or named reporting.</Para>

        <SubHeading>Other Information:</SubHeading>
        <Para>We collect additional information you provide when you correspond with UniFiX for support or report problems. We also collect information that you may submit such as ratings, reviews, or comments.</Para>

        <SectionHeading>II. INFORMATION WE COLLECT AS YOU ACCESS AND USE UNIFIX APP</SectionHeading>

        <SubHeading>Complaint Transaction Information:</SubHeading>
        <Para>We collect complaint details such as ticket ID, category, status, assigned staff, timestamps, and resolution history.</Para>

        <SubHeading>Location Data:</SubHeading>
        <Para>We do NOT collect real-time location data. Users manually enter building and room numbers when submitting complaints.</Para>

        <SubHeading>Usage Information:</SubHeading>
        <Para>We, our TPSP may use a variety of technologies that automatically (or passively) collect certain Information whenever you visit or interact with the UniFiX Platform for obtaining the Services ("Usage Information"). This Usage Information may include the browser that you are using, the URL that referred you to our Services, all of the areas within our Services that you visit, and the time of day, searches and search results, or usage behavior on the UniFiX App.</Para>

        <SubHeading>Device Information:</SubHeading>
        <Para>We collect Information by ourselves or through integration with third-party applications which consists of technical information and aggregated usage information, and may contain, among other things, Device Identifier of your Device, your preferred language, manufacturer, software, and model of your Device, Device type, operating systems and versions, screens you have visited, your scrolling activity, and any other actions you have performed during your use of UniFiX App.</Para>

        <SubHeading>Push Notification Tokens:</SubHeading>
        <Para>We collect Expo push notification tokens to send you real-time updates about your complaints, lost & found posts, and other service-related communications.</Para>

        <SubHeading>Photos and Images:</SubHeading>
        <Para>When you upload complaint photos, lost item photos, or ID cards, these images are stored securely on Cloudinary.</Para>

        <SectionHeading>III. INFORMATION THIRD PARTIES PROVIDE ABOUT US</SectionHeading>

        <Para>
          We may, from time to time, collect Information about you through UniFiX Platform or while availing the Services 
          and collect Information from our affiliates or third parties / TPSPs such as technical subcontractors, business 
          partners, analytics providers, cloud storage providers (Firebase, Cloudinary), etc.
        </Para>

        <PartHeading>4. USE OF INFORMATION COLLECTED</PartHeading>

        <Para>
          Our primary goal in collecting your Information is to provide you with an enhanced experience when using the 
          Services. We may use your Information we collect in accordance with this Policy for the following purposes:
        </Para>

        <UL>
          <li>To enable you to access the UniFiX Platform</li>
          <li>To verify your identity and eligibility to use the Services</li>
          <li>To process and route your complaints to appropriate staff members</li>
          <li>To send you real-time notifications about complaint status updates</li>
          <li>To enable staff to view and respond to assigned complaints</li>
          <li>To enable admins to oversee the complaint management system</li>
          <li>To provide lost & found services</li>
          <li>To process anti-ragging reports and escalate to HOD</li>
          <li>To closely monitor which features of the Services are used most, to determine which features need to be improved for enhanced user experience</li>
          <li>To send you a welcome email/SMS to verify your account</li>
          <li>To help diagnose problems with our servers, and to administer UniFiX Platform</li>
          <li>To send you strictly service-related announcements. If our Services are temporarily suspended for maintenance, we might send you a notification</li>
          <li>To prevent, discover and investigate violations of this Policy or any applicable terms of service</li>
          <li>To identify and/or detect security breaches or attacks, errors, fraud, abuse and other criminal activities</li>
          <li>To share your complaint details with assigned staff so they can resolve your issue</li>
          <li>If you are a Staff member, we share your name and phone number with the complainant so they can contact you</li>
          <li>To enforce our terms and conditions and this Policy, and resolve any disputes</li>
          <li>To provide functionality, analyse performance, fix errors, bugs, and improve the usability and effectiveness of the UniFiX Platform</li>
          <li>To comply with Applicable Laws or requests received from regulators, government, law enforcement or judicial authorities</li>
          <li>To carry out our obligations and enforcing rights arising from any contracts between us</li>
          <li>To disclose to affiliates, our and their employees, agents and representatives on a need-to-know basis to facilitate provision of Services</li>
          <li>To deliver any administrative notices, alerts, advice, notifications and communication relevant to your use of the Services</li>
          <li>To fulfil any other purpose for which you provide us the Information and/or for any other purpose with your consent</li>
        </UL>

        <PartHeading>5. HOW AND WHEN DO WE DISCLOSE INFORMATION TO THIRD PARTIES</PartHeading>

        <Para>
          We do not sell, share, rent or trade the information we have collected about you, other than as disclosed 
          within this Policy or at the time you provide your Information. Following are the situations when Information 
          may be shared:
        </Para>

        <SectionHeading>WHEN YOU AGREE TO SHARE INFORMATION WITH THIRD PARTIES</SectionHeading>
        <Para>
          You may opt to receive information and/or marketing offers directly from third parties. If you do agree to 
          have your Personal Information shared, your Personal Information will be disclosed to such third parties and 
          all Information you disclose will be subject to the privacy policy and practices of such third parties. We 
          are not responsible for the privacy policies and practices of such third parties.
        </Para>

        <SectionHeading>THIRD PARTIES PROVIDING SERVICES ON OUR BEHALF</SectionHeading>
        <Para>
          We may share the Information you provide with our TPSPs, business partners, and agents. We use TPSPs to 
          facilitate our Services, provide or perform certain aspects of the Services on our behalf — such as host the 
          Services, design and/or operate the Services' features, track the Services' analytics, store data (Firebase), 
          store images (Cloudinary), provide customer support, perform technical services, or perform other administrative 
          services. These third parties will have access to Information, including Personal Information to only carry out 
          the services they are performing for you or for us.
        </Para>

        <SectionHeading>ADMINISTRATIVE AND LEGAL REASONS</SectionHeading>
        <Para>
          We cooperate with Government and law enforcement officials and private parties to enforce and comply with the 
          Applicable Laws. Thus, we may access, use, preserve, transfer and disclose your information (including Personal 
          Information, IP address, Device Information), to government or law enforcement officials or private parties as 
          we reasonably determine is necessary and appropriate:
        </Para>
        <UL>
          <li>To satisfy any Applicable Law, regulation, subpoenas, Governmental requests or legal process</li>
          <li>To protect and/or defend the terms and conditions applicable to use of the UniFiX App or the Services</li>
          <li>To protect the safety, rights, property or security of the College, our Services or any third party</li>
          <li>To detect, prevent or otherwise address fraud, security or technical issues</li>
          <li>To prevent or stop activity we may consider to be, or to pose a risk of being, an illegal, unethical, or legally actionable activity</li>
        </UL>

        <SectionHeading>AFFILIATES AND BUSINESS TRANSFER</SectionHeading>
        <Para>
          We may share your Information, including your Personal Information and Usage Information with our parent, 
          subsidiaries and affiliates for internal reasons, including business and operational purposes. We also reserve 
          the right to disclose and transfer all such information in connection with a corporate merger, consolidation, 
          restructuring, the sale of substantially all of our membership interests and/or assets or other corporate change.
        </Para>

        <PartHeading>6. THIRD PARTY CONTENT AND LINKS TO THIRD PARTY SERVICES</PartHeading>

        <Para>
          The Services may contain content that is supplied by a third party. In addition, when you are using the Services, 
          you may be directed to other sites or applications that are operated and controlled by third parties that we do 
          not control, in which case our Policy will no longer apply. We are not responsible for the privacy practices 
          employed by any of these third parties.
        </Para>

        <Para>
          Our online and mobile Services may include social media features. These features may collect Information including 
          your IP address, photograph, and may set a cookie to enable the feature to function properly. Your interactions 
          with these features and widgets are governed by the privacy policy of the company providing them.
        </Para>

        <PartHeading>7. INFORMATION COLLECTED BY STAFF MEMBERS</PartHeading>

        <Para>
          This Policy does not cover the usage of any information about you which is obtained by Staff Members while 
          resolving your complaints.
        </Para>

        <PartHeading>8. CHANGE OF INFORMATION AND CANCELLATION OF ACCOUNT</PartHeading>

        <Para>
          You are responsible for maintaining the accuracy of the Information you submit to us, such as your contact 
          information provided as part of account registration.
        </Para>

        <Para>
          If your Personal Information or Information you provide to us changes, or if you no longer desire our Services, 
          you may correct, delete inaccuracies, or amend information by making the change on your profile page or by 
          contacting us through the email address mentioned on UniFiX Platform, or contacting the Grievance Officer.
        </Para>

        <Para>
          You may also cancel or modify the communications that you have elected to receive from UniFiX by changing your 
          notification preferences in your device settings or by logging into your user account.
        </Para>

        <Para>
          If you wish to cancel your account or request that we no longer use your Information to provide you services, 
          contact us through email address mentioned on the UniFiX Platform or the Grievance Officer mentioned in this Policy.
        </Para>

        <Para>
          We will retain your Information including Personal Information and Usage Information for as long as your account 
          with the Services is active and as needed to provide you services. Even after your account is terminated, we will 
          retain some of your Information including Personal Information for a period of <strong>15 days</strong> to resolve 
          disputes, conclude any activities related to cancellation of an account, investigate, or prevent fraud and other 
          inappropriate activity related to your account, to enforce our agreements, or for other business reasons. After 
          completion of such period, your data may either be deleted from our database or be anonymized and aggregated, and 
          then may be held by us as long as necessary for us to provide our Services effectively, but our use of the anonymized 
          data will be solely for analytic purposes.
        </Para>

        <PartHeading>9. SECURITY</PartHeading>

        <Para>
          The Information we collect is securely stored within our databases, and we use standard, industry-wide, commercially 
          reasonable security practices such as encryption, firewalls and secure connections for protecting your Information. 
          However, as effective as security technology is, no security system is impenetrable. We cannot guarantee the security 
          of our databases, nor can we guarantee that Information you supply won't be intercepted while being transmitted to us 
          over the Internet or wireless communication, and any Information you transmit to us, you do at your own risk. We 
          recommend that you not disclose your password to anyone.
        </Para>

        <PartHeading>10. INFORMATION OF CHILDREN</PartHeading>

        <Para>
          We do not knowingly solicit or collect Information from children under the age of 16 years. Use of the UniFiX App 
          is only available for persons who can enter into a legally binding contract under Applicable Laws.
        </Para>

        <PartHeading>11. GRIEVANCE OFFICER</PartHeading>

        <Para>
          If you would like to ask about, make a request relating to, or complain about how we process your information, 
          please contact or email our grievance officer, at one of the addresses below. Our grievance officer will attempt 
          to expeditiously redress your grievances.
        </Para>

        <Para><strong>For any request, complaint, feedback or grievances, please contact:</strong></Para>

        <Para><strong>Name:</strong> Shahiduddin</Para>
        <Para><strong>Email:</strong> <a href="mailto:unifix.helpdesk@gmail.com">unifix.helpdesk@gmail.com</a></Para>
    

        <PartHeading>12. CHANGES TO THE PRIVACY POLICY</PartHeading>

        <Para>
          We reserve the right to update / modify, from time to time, this Policy to reflect changes to our Information 
          practices. Any changes will be effective immediately upon the posting of the revised Policy on the UniFiX Platform. 
          If we make any material changes, we will notify you by email (sent to the e-mail address specified in your account) 
          or by means of a notice on the UniFiX App prior to the change becoming effective. We encourage you to periodically 
          review this page for the latest information on our privacy practices. Your use of the UniFiX App or availing the 
          Services after an updated Policy becomes effective will indicate your acceptance of the updated Policy.
        </Para>

      </div>

    <Footer />
    </div>
  );
}