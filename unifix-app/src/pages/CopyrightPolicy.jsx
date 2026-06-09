import "../styles/TermsAndConditions.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Para = ({ children }) => <p className="tnc-para">{children}</p>;

const SubHeading = ({ children }) => <h4 className="tnc-sub-heading">{children}</h4>;
const PartHeading = ({ children }) => <h2 className="tnc-part-heading">{children}</h2>;
const UL = ({ children }) => <ul className="tnc-list">{children}</ul>;
const Divider = () => <hr className="tnc-divider" />;

export default function CopyrightPolicy() {
  return (
    <div className="tnc-page">
      <Navbar />

      <div className="tnc-container">
        <h1 className="tnc-main-title">COPYRIGHT POLICY</h1>
        <p className="tnc-main-subtitle">
          As per the Copyright Act, 1957 and Information Technology Act, 2000
        </p>

        <PartHeading>1. Ownership of Intellectual Property</PartHeading>
        <Para>
          All content, materials, information, text, graphics, logos, icons, images, audio clips, video clips, 
          data compilations, software, and any other works available on the UniFiX Platform (collectively, "Content") 
          are the exclusive property of UniFiX or its content suppliers and are protected under the 
          <strong> Copyright Act, 1957</strong> of India and other applicable intellectual property laws.
        </Para>

        <PartHeading>2. Limited License to Users</PartHeading>
        <Para>
          UniFiX grants you a personal, non-exclusive, non-transferable, revocable license to access and view the 
          Content on the Platform solely for your personal, non-commercial use.
        </Para>
        <Para>Without prior written permission from UniFiX, you shall NOT:</Para>
        <UL>
          <li>Copy, reproduce, modify, or create derivative works from any Content</li>
          <li>Distribute, display, transmit, or publish any Content</li>
          <li>Sell, rent, lease, license, or sublicense any Content</li>
          <li>Reverse engineer, decompile, or disassemble any software forming part of the Platform</li>
          <li>Remove any copyright, trademark, or other proprietary notices from the Content</li>
        </UL>

        <PartHeading>3. User-Generated Content</PartHeading>
        <Para>
          By submitting, posting, or uploading any content (including complaints, lost & found reports, photos, 
          comments, or feedback) to the UniFiX Platform, you hereby grant UniFiX a worldwide, royalty-free, 
          non-exclusive license to use, store, display, reproduce, and distribute such content solely for the 
          purpose of operating and providing the Services.
        </Para>
        <Para>You represent and warrant that:</Para>
        <UL>
          <li>You own or have the necessary licenses, rights, and permissions to submit such content</li>
          <li>Your content does not infringe any third-party copyright or other intellectual property rights</li>
        </UL>

        <PartHeading>4. Notification of Copyright Infringement</PartHeading>
        <Para>
          UniFiX respects the intellectual property rights of others. If you believe that any content available on 
          the UniFiX Platform infringes your copyright under the Copyright Act, 1957, please submit a written notice 
          ("Infringement Notice") to UniFiX's Designated Grievance Officer containing the following information:
        </Para>
        <Para><strong>Your Infringement Notice must include:</strong></Para>
        <UL>
          <li>Your full name, physical address, telephone number, and email address</li>
          <li>Identification of the copyrighted work that you claim has been infringed</li>
          <li>Identification of the material that is claimed to be infringing, including the URL(s) or other specific location(s) where the material appears on the Platform</li>
          <li>A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law</li>
          <li>A statement, made under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf</li>
          <li>Your physical or electronic signature</li>
        </UL>

        <SubHeading>Submit Infringement Notices to:</SubHeading>
        <Para><strong>Grievance Officer:</strong> Shahiduddin</Para>
        <Para><strong>Email:</strong> <a href="mailto:unifix.helpdesk@gmail.com">unifix.helpdesk@gmail.com</a></Para>
       
        <PartHeading>5. Action Upon Receipt of Infringement Notice</PartHeading>
        <Para>Upon receiving a valid Infringement Notice, UniFiX shall:</Para>
        <UL>
          <li>Expeditiously remove or disable access to the allegedly infringing content</li>
          <li>Take reasonable steps to notify the user who posted the content</li>
          <li>Terminate, in appropriate circumstances, the accounts of repeat infringers</li>
        </UL>

        <PartHeading>6. Counter-Notice</PartHeading>
        <Para>
          If you believe that your content was removed or disabled as a result of mistake or misidentification, 
          you may submit a counter-notice to the Grievance Officer containing:
        </Para>
        <UL>
          <li>Your physical or electronic signature</li>
          <li>Identification of the content that was removed and the location where it appeared before removal</li>
          <li>A statement under penalty of perjury that you have a good faith belief that the content was removed as a result of mistake or misidentification</li>
          <li>Your name, address, and telephone number</li>
          <li>A statement that you consent to the jurisdiction of the courts located in Palghar, Maharashtra</li>
        </UL>
        <Para>
          Upon receipt of a valid counter-notice, UniFiX will forward a copy to the original complainant and may 
          restore the removed content within 10 to 14 business days, unless the complainant files a court action 
          seeking an order against the alleged infringer.
        </Para>

        <PartHeading>7. Repeat Infringers</PartHeading>
        <Para>
          UniFiX reserves the right to terminate the accounts of users who are determined to be repeat infringers 
          of copyright, as per the provisions of the Copyright Act, 1957.
        </Para>

        <PartHeading>8. False Claims</PartHeading>
        <Para>
          Any person who knowingly makes a false or misleading statement regarding copyright infringement may be 
          held liable for damages and legal costs under applicable laws.
        </Para>

        <PartHeading>9. Governing Law</PartHeading>
        <Para>
          This Copyright Policy shall be governed by and construed in accordance with the laws of the Republic of 
          India, including the Copyright Act, 1957, and the Information Technology Act, 2000. Any disputes arising 
          under this Policy shall be subject to the exclusive jurisdiction of the courts in Palghar, Maharashtra.
        </Para>

        <Divider />

        <Para style={{ textAlign: "center" }}>
          <strong> &copy; 2026 UniFiX. All rights reserved.</strong>
        </Para>
      </div>

      <Footer />
    </div>
  );
}