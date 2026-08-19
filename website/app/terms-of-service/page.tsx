import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions - One Tap Service",
  description:
    "Read the Terms of Use governing your use of One Tap Service's platform, booking, and services.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link
            href="/"
            className="transition-colors hover:text-primary"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">
            Terms of Use
          </span>
        </nav>

        {/* Heading */}
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Last Updated: January 2025
          <br />
          Effective Date: January 20, 2025
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-muted-foreground">
          {/* Introduction */}
          <section>
            <p>
              Welcome to One TAP Service, operated and managed by One TAP
              Service Services Limited from its registered office in Dhaka.
              These Terms of Use, together with any service-specific terms and
              the Privacy Policy, constitute a legally binding agreement between
              you and One TAP Service. By using our services, mobile
              applications, websites, or other platforms, you accept these terms
              automatically.
            </p>
          </section>

          {/* A. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              A. Acceptance of Terms
            </h2>
            <p>
              PLEASE READ THESE TERMS CAREFULLY. By using One TAP
              Service&apos;s website, mobile application, or other platforms,
              you agree to these Terms of Use, which outline your rights,
              responsibilities, and limitations when accessing and participating
              in:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                The One TAP Service website and mobile application, including
                classifieds, forums, email functions, internet links, and all
                other content and services, including payment services offered
                through our platforms (referred to collectively as the
                &quot;Product&quot;).
              </li>
              <li>
                Online transactions between users offering services
                (&quot;SERVICE PROVIDERS&quot;) and those obtaining services
                (&quot;SERVICE USERS&quot;) through the Product (collectively
                referred to as &quot;Services&quot;).
              </li>
            </ul>
            <p>
              By continuing to use the Product or by clicking &quot;I have read
              and agree to the terms of use,&quot; you certify the following:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>You are a SERVICE PROVIDER or a prospective SERVICE USER.</li>
              <li>You have the authority to enter into these Terms of Use.</li>
              <li>
                You authorize payment transfers for services requested through
                the Product, as applicable.
              </li>
              <li>
                You agree to abide by these Terms of Use and related documents
                incorporated by reference.
              </li>
            </ul>
            <p>
              If you do not agree with these Terms, you must discontinue using
              the Product immediately. By accepting these Terms, you form a
              legally binding agreement with One TAP Service.
            </p>
            <p>
              <strong>Age Requirement:</strong> By using the Product, you
              confirm that you are at least 18 years old and legally competent
              to enter into enforceable contracts.
            </p>
          </section>

          {/* 1. Modifications */}
          <section>
            <h3 className="text-lg font-bold text-foreground">
              1. Modifications to Terms of Use and Privacy Policy
            </h3>
            <p>
              One TAP Service may amend these Terms of Use or the Privacy
              Policy at its sole discretion to comply with legal or regulatory
              requirements or for other legitimate business purposes. Changes
              will be posted at www.onetapservice/terms-and-condition, and it is
              your responsibility to review them periodically. Continued use of
              the Product after amendments signifies your acceptance of the
              revised terms. If you disagree with any updates, you should stop
              using the Product immediately.
            </p>
          </section>

          {/* 2. Privacy Policy */}
          <section>
            <h3 className="text-lg font-bold text-foreground">
              2. Privacy Policy
            </h3>
            <p>
              One TAP Service is committed to protecting your privacy. Our
              Privacy Policy explains how user information is collected, used,
              and safeguarded. The Privacy Policy is an integral part of these
              Terms of Use. By using the Product, you agree to the practices
              described in the Privacy Policy.
            </p>
          </section>

          {/* B. Membership and Accessibility */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              B. Membership and Accessibility
            </h2>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. License to Access
            </h3>
            <p>
              One TAP Service grants you a non-exclusive, revocable license to
              use its Website, Apps, or products in accordance with these Terms
              of Use, provided that:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                (i) You will not copy, distribute, or create derivative works
                of the Website, Apps, or products without prior written consent
                from One TAP Service.
              </li>
              <li>
                (ii) You will not alter or modify any part of the Website, Apps,
                or products.
              </li>
              <li>
                (iii) You will not use the Website, Apps, or products for any
                illegal or unauthorized purposes, including transmitting
                malware, viruses, or destructive code.
              </li>
              <li>
                (iv) You comply with all applicable laws, maintain respectful
                user behavior, and adhere to the terms outlined in this
                agreement and any service-specific terms attached to relevant
                modules.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Membership Eligibility Criteria
            </h3>
            <p>Use of the Product is restricted to individuals who:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Are at least 18 years old.</li>
              <li>
                Can legally form binding contracts under applicable laws.
              </li>
            </ul>
            <p>
              By using the Product, you represent and agree that:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                (a) All registration information provided by you is truthful
                and accurate, and you accept responsibility for any misleading
                or false information.
              </li>
              <li>
                (b) You will update and maintain the accuracy of this
                information.
              </li>
              <li>
                (c) Your use of the Product does not violate any laws,
                regulations, or these Terms of Use.
              </li>
            </ul>
            <p>
              <strong>Account Termination:</strong> If One TAP Service determines
              that you are underage, have provided false or misleading
              information, or are violating any terms or applicable laws, your
              account may be terminated without warning. One TAP Service reserves
              the right to pursue legal remedies for violations and seek
              indemnification for damages resulting from such actions.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Account Creation and Responsibility
            </h3>
            <p>
              While browsing the Product does not require registration, certain
              features or services will require you to create a
              password-protected account (&quot;Account&quot;).
            </p>
            <p>To create an Account:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Provide your name, email address, and password through the
                registration page.
              </li>
              <li>
                Optionally, you may supply additional information for a
                personalized experience.
              </li>
              <li>
                You can also register using your Facebook credentials
                (&quot;Third-Party Site Password&quot;).
              </li>
            </ul>
            <p>
              Accounts may also be created by One TAP Service upon your verbal
              request, with confirmation sent via SMS or other communication
              formats.
            </p>
            <p>Your Responsibilities:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Safeguard your passwords (both One TAP Service and Third-Party
                Site Passwords) and maintain their confidentiality.
              </li>
              <li>
                Notify One TAP Service immediately if you detect any
                unauthorized use of your account or breach of security.
              </li>
              <li>
                Avoid misrepresenting yourself or impersonating another user.
              </li>
              <li>
                You accept sole liability for any losses incurred from
                unauthorized account use.
              </li>
            </ul>
            <p>
              Notwithstanding this, you may also be held liable for losses
              incurred by One TAP Service or other users due to such
              unauthorized use.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Account Policies
            </h3>
            <p>
              As an account holder (a &quot;Registered User&quot;), you agree
              to comply with the following policies:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Do not copy, distribute, or modify the Website, Apps, or
                products without authorization.
              </li>
              <li>
                Provide accurate, current, and complete account information and
                update it as necessary.
              </li>
              <li>
                Avoid using automated systems (e.g., bots, scrapers) to access
                the Product without prior approval.
              </li>
              <li>
                Do not collect, share, or misuse personally identifiable
                information from other users.
              </li>
              <li>
                Refrain from contacting SERVICE PROVIDERs or SERVICE USERs for
                unauthorized commercial purposes or business unrelated to One
                TAP Service.
              </li>
              <li>
                Do not interfere with or attempt to bypass security measures,
                overload infrastructure, or disrupt the proper functioning of
                the Product.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. Additional Policies
            </h3>
            <p>
              Your use of the Product is subject to all applicable One TAP
              Service rules, regulations, and additional policies that may be
              published from time to time. These include, but are not limited
              to, copyright policies and other usage restrictions (collectively,
              &quot;Additional Policies&quot;).
            </p>
            <p>
              Failure to comply with the Terms of Use, Account Policies,
              membership criteria, or Additional Policies may result in the
              termination of your Account without prior notice. One TAP Service
              reserves the right to pursue legal action if necessary.
            </p>
          </section>

          {/* C. Member Conduct */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              C. Member Conduct
            </h2>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Prohibitions on Submitted Content
            </h3>
            <p>
              You are prohibited from uploading, posting, transmitting,
              transferring, distributing, or otherwise sharing any content,
              including text, images, videos, sound, data, information, or
              software (collectively referred to as &quot;Submitted
              Content&quot;), on the Website, Apps, or any related products,
              such as your profile (&quot;Profile&quot;), service requests
              (&quot;Want&quot;), or reviews and opinions
              (&quot;Feedback&quot;), if the content:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Misrepresents its source, impersonates individuals or entities,
                or includes false or inaccurate biographical details for SERVICE
                PROVIDERs.
              </li>
              <li>
                Provides or links to external sites that violate the Terms of
                Use.
              </li>
              <li>
                Exploits or harms individuals under 18 years old
                (&quot;Minors&quot;) or seeks to collect their personal
                information.
              </li>
              <li>
                Invades privacy by attempting to collect, store, or distribute
                personal or private data without consent.
              </li>
              <li>
                Contains falsehoods, misrepresentations, or any content that
                could harm One TAP Service or third parties.
              </li>
              <li>
                Is pornographic, harassing, hateful, illegal, obscene,
                defamatory, threatening, discriminatory, or otherwise offensive.
              </li>
              <li>
                Promotes racism, hatred, bigotry, or violence, or encourages
                conduct violating laws or inciting harm.
              </li>
              <li>
                Violates intellectual property rights unless you own or have
                permission to post the material.
              </li>
              <li>
                Includes illegal or unauthorized content (e.g., pirated
                software, music, or educational materials).
              </li>
              <li>
                Threatens, defrauds, intimidates, or targets individuals or
                groups based on age, gender, disability, ethnicity, sexual
                orientation, race, or religion.
              </li>
              <li>
                Attempts to harm or disrupt others&apos; devices, bypass
                security measures, or engage in spamming.
              </li>
              <li>
                Impersonates or attempts to impersonate One TAP Service staff,
                users, or others.
              </li>
              <li>
                Advertises or promotes unrelated or inappropriate businesses,
                services, or external websites.
              </li>
              <li>
                Contains spam, chain letters, pyramid schemes, or other
                unsolicited commercial content.
              </li>
              <li>
                Advertises fraudulent schemes, surveys, or contests.
              </li>
              <li>
                Distributes malware, viruses, or harmful technologies.
              </li>
              <li>Contains irrelevant or duplicate postings.</li>
              <li>
                Uses automated tools for submissions without explicit consent
                from One TAP Service.
              </li>
            </ul>
            <p>
              <strong>Note:</strong> One TAP Service reserves the right to
              remove any Submitted Content at any time, for any reason, without
              prior notice.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Prohibitions on Sending Messages
            </h3>
            <p>You may not send messages that:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Propose national or international money transfers exceeding a
                service&apos;s asking price with the intent to request a refund.
              </li>
              <li>
                Contain unsolicited advertisements or promotions for services not
                offered by One TAP Service.
              </li>
              <li>
                Include statements or conduct deemed socially or morally
                objectionable by One TAP Service.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. No Discrimination
            </h3>
            <p>
              Discriminatory postings based on race, color, religion, gender,
              national origin, age, disability, or other protected classes are
              strictly prohibited under Bangladesh law.
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                One TAP Service will remove any discriminatory content without
                notice and may seek compensation or legal action as applicable.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              4. Prohibitions with Respect to Services
            </h3>
            <p>When using the Website or Apps, you must not:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Post content in inappropriate categories or areas.</li>
              <li>
                Violate laws, third-party rights, or Terms of Use.
              </li>
              <li>
                Fail to pay for purchased services unless the SERVICE PROVIDER
                materially changes the agreed terms, makes a typographical
                error, or cannot verify their identity.
              </li>
              <li>
                Manipulate fees, billing processes, or service payments.
              </li>
              <li>
                Post false, misleading, defamatory, or libelous content,
                including about other users.
              </li>
              <li>
                Undermine the Feedback or rating system through unauthorized
                activities like exporting Feedback data.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              5. Feedback
            </h3>
            <p>
              Users are required to act lawfully, carefully, and in good faith
              when leaving Feedback. Prohibited actions include:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Threatening negative Feedback unless additional, unagreed
                services are provided.
              </li>
              <li>
                Leaving misleading Feedback to falsely enhance a SERVICE
                PROVIDER&apos;s or SERVICE USER&apos;s reputation.
              </li>
              <li>Imposing conditions restricting Feedback.</li>
            </ul>
            <p>
              <strong>Sanctions for Misuse:</strong> One TAP Service may take
              the following actions for inappropriate Feedback use:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Delete Feedback or related postings.</li>
              <li>Restrict account privileges or suspend accounts.</li>
              <li>
                Adjust user status or privileges earned through Feedback.
              </li>
            </ul>
            <p>
              <strong>Reporting and Resolution:</strong> Inappropriate Feedback
              can be reported via email at info@OneTAPService. One TAP Service
              will resolve disputes as the final arbiter and may remove or
              modify Feedback at its discretion.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              General Provisions
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>The listed prohibitions are examples and not exhaustive.</li>
              <li>
                One TAP Service may, at its sole discretion, terminate accounts,
                remove content, or restrict communications without prior notice.
              </li>
              <li>
                Illegal activities may be reported to law enforcement, and One
                TAP Service may cooperate in investigations.
              </li>
            </ul>
            <p>
              These provisions do not obligate One TAP Service to monitor all
              user activity but reserve its right to act when necessary.
            </p>
          </section>

          {/* D. Rules for Service Users */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              D. Rules for Service Users
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Prohibited Actions for Service Users
            </h3>
            <p>
              Service Users must refrain from the following actions:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                (a) Committing to purchase or use a service without the
                intention to pay;
              </li>
              <li>
                (b) Signing up for, negotiating a price for, using, or
                soliciting a service with no intention of completing the
                transaction or making payment;
              </li>
              <li>
                (c) Agreeing to purchase a service while failing to meet the
                Service Provider&apos;s terms as outlined in the posting, or
                doing so with the intention of disrupting the service;
              </li>
              <li>
                (d) Misusing any options provided by One TAP Service in
                connection with the use or purchase of any service.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Penalties for Rule Violations
            </h3>
            <p>
              If a Service User violates any of the aforementioned rules, One
              TAP Service reserves the right, at its sole discretion, to take
              any of the following actions:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>(a) Cancel the posting;</li>
              <li>(b) Restrict the Service User&apos;s account privileges;</li>
              <li>(c) Suspend the Service User&apos;s account;</li>
              <li>
                (d) Reduce the Service User&apos;s earned status on the
                Feedback page.
              </li>
            </ul>
          </section>

          {/* E. Disclaimers and Warranties */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              E. Disclaimers and Warranties for Service Users
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Warranty Exclusions for Spare Parts
            </h3>
            <p>
              One TAP Service does not extend warranties to any spare parts
              used during service completion. Service Users can procure spare
              parts independently or engage the Service Provider to do so. In
              either case, neither the Service Provider nor One TAP Service will
              be held responsible for the quality or pricing of the spare parts.
              The full service charge must be paid to the Service Provider,
              regardless of any spare part issues.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Warranty Period Claims
            </h3>
            <p>
              Claims must be raised within the specified warranty period for the
              service. Any claims made after this period will be treated as a
              new order and will require payment for additional service or
              support.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. Documentation for Claims
            </h3>
            <p>
              For services such as packing and shifting, home appliances,
              phones, laptops, and other electronic gadgets, Service Users must
              sign the agreed final order list provided by the Service Provider.
              If this document is not provided, One TAP Service will not
              mediate disputes.
            </p>
            <p>
              Users are encouraged to clearly itemize details of items handed
              over to the Service Provider to avoid misunderstandings.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              4. Marketplace Disclaimer
            </h3>
            <p>
              One TAP Service operates as a marketplace connecting Service Users
              with various Service Providers. While Service Providers are
              responsible for meeting order specifications, One TAP Service is
              not liable for the quality of service or non-performance by
              Service Providers once the order is placed. Additionally, One TAP
              Service may provide links to third-party sites without warranty or
              guarantee for the quality or safety of those services. Users must
              exercise due diligence when accessing such links, and by using the
              platform, they agree to indemnify One TAP Service from claims
              arising from accessing these third-party services.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              5. Dispute Resolution Timeline
            </h3>
            <p>
              One TAP Service aims to resolve disputes within two days of a
              complaint being raised, except in exceptional circumstances
              determined at its sole discretion. If parties fail to respond
              within this timeframe, One TAP Service reserves the right to make
              an independent resolution.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              6. Compensation for Poor Service
            </h3>
            <p>
              Under specific circumstances, One TAP Service may offer
              compensation to users for subpar service from providers. The
              compensation will not exceed 10% of the order value or BDT 5000,
              whichever is lower, and will be provided as a free service coupon
              for future use. Decisions regarding compensation are at the
              discretion of the One TAP Service support team and are final.
            </p>
          </section>

          {/* F. Use of Submitted Content */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              F. Use of Submitted Content
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. No Confidentiality
            </h3>
            <p>
              Submitted content, such as videos, profiles, offers, wants, or
              feedback, is not treated as confidential, regardless of whether
              it is published. Freely searchable content submitted by users is
              considered non-proprietary and non-confidential, and One TAP
              Service may use or distribute it without restriction. Users should
              exercise caution when sharing sensitive information, especially
              with professionals like doctors or lawyers.
            </p>
            <p>
              One TAP Service may disclose user information, including personal
              data, if it:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>(a) Complies with legal processes;</li>
              <li>(b) Mitigates liability in legal proceedings;</li>
              <li>(c) Protects rights or property;</li>
              <li>(d) Enforces the Terms of Use; or</li>
              <li>(e) Deters fraudulent or illegal behavior.</li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. User Representations and Warranties
            </h3>
            <p>
              Users are solely responsible for their submitted content and must
              affirm that:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                (a) They own or have rights to use the content, including
                licenses, permissions, or consents;
              </li>
              <li>
                (b) Identifiable individuals in the content have consented to
                its use; and
              </li>
              <li>
                (c) Any royalties, fees, or other liabilities related to the
                content are the user&apos;s responsibility.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. Ownership and License of Submitted Content
            </h3>
            <p>
              Users retain ownership of their submitted content but grant One
              TAP Service a perpetual, worldwide, royalty-free license to use,
              reproduce, distribute, and adapt the content for platform
              operations and promotional purposes. Users also grant others the
              right to access and use their content through the platform. This
              license expires when the content is removed from the platform.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              4. Content Removal and Disclaimers
            </h3>
            <p>
              One TAP Service does not endorse user content and reserves the
              right to remove it if it violates the Terms of Use or applicable
              laws, including intellectual property rights. Repeat infringers
              may face account termination. Users are solely responsible for
              their content and its impact on others. Suggestions for content
              improvements are welcomed but remain subject to One TAP
              Service&apos;s discretion.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              5. Suggestions
            </h3>
            <p>
              Any suggestions or recommendations submitted to One TAP Service,
              including ideas for features or functionality, will be treated as
              non-confidential and non-proprietary. One TAP Service may use such
              suggestions without attribution or compensation. Users have no
              claim to recognition or rewards if their suggestions are
              implemented.
            </p>
          </section>

          {/* G. Copyright Infringement */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              G. Copyright Infringement Takedown Procedure
            </h2>
            <p>
              One TAP Service values intellectual property rights and expects
              its users to adhere to the same high standards. If necessary, One
              TAP Service may, at its sole discretion, suspend or terminate
              accounts, or block access to its Website and Mobile Application,
              of users found to infringe upon the intellectual property rights
              of others.
            </p>
            <p>
              If you believe your work has been copied or posted on the platform
              in a way that constitutes copyright or trademark infringement,
              please provide the following details to info@OneTAPService:
            </p>
            <ol className="list-decimal space-y-1 pl-6">
              <li>
                <strong>Identification of the Work:</strong> Specify the
                copyrighted or trademarked work you believe has been infringed.
                If multiple works are covered under one notification, provide a
                representative list.
              </li>
              <li>
                <strong>Identification of the Infringing Material:</strong>{" "}
                Clearly identify the material in question and provide sufficient
                information to enable One TAP Service to locate it on the
                platform.
              </li>
              <li>
                <strong>Statement of Good Faith:</strong> Include a written
                statement affirming that you believe the disputed use is
                unauthorized by the owner, their agent, or the law.
              </li>
              <li>
                <strong>Contact Information:</strong> Provide sufficient contact
                details, including an address, telephone number, and, if
                available, an email address where you can be reached.
              </li>
              <li>
                <strong>Authorized Signature:</strong> Include a physical or
                electronic signature of the person authorized to act on behalf
                of the intellectual property owner.
              </li>
              <li>
                <strong>Accuracy and Authority Statement:</strong> Confirm under
                penalty of perjury that the information in your notice is
                accurate and that you are authorized to act on behalf of the
                owner of the exclusive right being infringed.
              </li>
            </ol>
            <p>
              Only the intellectual property owner or an authorized
              representative can file a notice. If you are not the owner, please
              contact the relevant party to take appropriate action. All
              notifications will be processed by One TAP Service based on
              internal procedures and at its sole discretion.
            </p>
          </section>

          {/* H. Modifications or Termination */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              H. Modifications or Termination of Services
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Modifications or Discontinuation
            </h3>
            <p>
              One TAP Service reserves the right to modify or discontinue any
              of its products, services, or features (in whole or part) at any
              time, with or without prior notice. One TAP Service shall not be
              held liable to users or third parties for any modifications,
              suspensions, or discontinuations.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Termination by One TAP Service
            </h3>
            <p>
              One TAP Service may, at its sole discretion, terminate or
              deactivate your account, restrict access to its platform, or
              remove submitted content without notice for reasons including, but
              not limited to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Policy Violations:</strong> Breaching the Terms of Use
                or applicable laws and regulations, such as the Bangladesh
                Payment and Settlement Systems Regulations, 2014.
              </li>
              <li>
                <strong>Misuse:</strong> Engaging in fraudulent, abusive, or
                illegal activities, including attempts to manipulate payment
                systems or circumvent security protocols.
              </li>
              <li>
                <strong>Payment Issues:</strong> Non-payment, payment disputes,
                or chargebacks related to services.
              </li>
              <li>
                <strong>Regulatory Compliance:</strong> Legal or regulatory
                changes, including directives from authorities like Bangladesh
                Bank, requiring service limitations or termination.
              </li>
            </ul>
            <p>
              In cases of termination, One TAP Service may deactivate accounts,
              block access, and freeze or refund pending transactions as
              required by law and internal policies.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. Termination by You
            </h3>
            <p>
              You may terminate your account at any time through account
              settings or by contacting customer support. Termination does not
              relieve you of obligations to settle outstanding transactions or
              fees. Upon termination, access to services, account balances, and
              transaction history may be permanently deleted, subject to the
              Refund Policy and applicable laws.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              4. Effects of Termination
            </h3>
            <p>Termination results in the following:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Loss of access to services, including offering or purchasing
                services on the platform.
              </li>
              <li>
                Forfeiture of compensation, rewards, or discounts associated
                with account activities.
              </li>
              <li>
                Account deactivation, including loss of files and data stored
                in the system.
              </li>
            </ul>
            <p>
              One TAP Service retains residual data for internal analysis and
              archival purposes. Users are required to destroy copies of One TAP
              Service data, marks, and content in their possession. Upon
              termination, One TAP Service is not obligated to return submitted
              content.
            </p>
            <p>
              By using the platform, you agree to indemnify One TAP Service, its
              affiliates, and personnel against claims or damages arising from
              account termination.
            </p>
          </section>

          {/* I. Intellectual Property Rights */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              I. Intellectual Property Rights
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Ownership of Data and Marks
            </h3>
            <p>
              All content on the platform, including text, software, graphics,
              photos, videos, and trademarks (&quot;Data&quot; and
              &quot;Marks&quot;), is owned or licensed by One TAP Service or
              its licensors. This content is provided &quot;as is&quot; for
              personal use and may not be reproduced, distributed, or exploited
              without prior written consent.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Limited License for Users
            </h3>
            <p>
              One TAP Service grants users a non-transferable, non-assignable,
              revocable license to access and use its Data and Marks for
              personal purposes in accordance with these Terms of Use. Users
              must not copy, modify, or redistribute this content.
            </p>
            <p>
              Violating these terms, including circumventing security features,
              may result in legal action. Content provided by other users or
              licensors is similarly protected and must not be used without
              proper authorization.
            </p>
          </section>

          {/* J. One TAP Service Fees */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              J. One TAP Service Fees
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Fees for Service Users
            </h3>
            <p>
              Joining One TAP Service, creating an account, and browsing posted
              services are free of charge. Currently, One TAP Service does not
              impose transaction fees on users for interactions between service
              users and service providers on the platform. However, One TAP
              Service reserves the right to introduce transaction fees in the
              future, at its sole discretion. Any changes to this fee policy
              will take effect after a 30-day notice, communicated through
              updates to the Terms &amp; Conditions.
            </p>
            <p>
              If applicable, you agree to pay all fees and charges associated
              with your account based on the prevailing billing terms. Failure
              to make timely payments or unsuccessful payment processing may
              result in account suspension or termination of access to the
              platform. One TAP Service is authorized to bill you for applicable
              fees, taxes, or charges through the payment method provided during
              registration or transactions. Please note that no refunds will be
              issued for account cancellations. Any outstanding balances may be
              charged to your payment method or billed separately. One TAP
              Service retains the right to pursue legal action to recover unpaid
              amounts if necessary.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Taxes
            </h3>
            <p>
              One TAP Service acts solely as an intermediary for fee and rent
              collection between service users and providers. Tax obligations
              vary significantly by location, and you are solely responsible for
              understanding and meeting your own tax reporting requirements. One
              TAP Service does not offer tax advice and is not liable for
              users&apos; tax obligations. However, One TAP Service reserves the
              right to deduct taxes or VAT from applicable transactions as
              required by law.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. Refund Policy
            </h3>
            <p>
              Fees paid by clients to service providers or One TAP Service are
              final and non-refundable. However, refunds may be considered in
              the following situations, subject to an investigation by One TAP
              Service&apos;s support team:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                A fully paid job was canceled due to unforeseen circumstances.
              </li>
              <li>
                A dispute arises during the warranty period for a completed and
                paid-for job.
              </li>
              <li>
                A client paid in advance, but the job was completed for a lower
                amount.
              </li>
            </ul>
            <p>
              Refunds, if approved, will be issued as promo codes for use on
              One TAP Service.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Order Cancellation
            </h3>
            <p>
              One TAP Service reserves the right to cancel orders without
              liability if the requested product or service is unavailable or
              out of stock. Such unavailability may arise from inventory issues,
              website errors, vendor updates, or other unforeseen
              circumstances. Customers will be notified promptly in such cases.
            </p>
          </section>

          {/* K. Negotiation of Service Terms and Disputes */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              K. Negotiation of Service Terms and Disputes Between Users
            </h2>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. No Involvement in Service Contracts
            </h3>
            <p>
              One TAP Service does not participate in or form any part of
              agreements or contracts between service users and providers. Its
              role is limited to providing a platform that connects users and
              providers.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              2. Independent Entities
            </h3>
            <p>
              One TAP Service does not establish agency, partnership, joint
              venture, or employment relationships between users. Service
              providers operate as independent contractors, and neither party has
              the authority to bind or represent One TAP Service.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              3. User Disputes
            </h3>
            <p>
              Interactions between users, including payments, service execution,
              and other agreements, are solely between the parties involved. One
              TAP Service makes no warranties regarding service provider
              suitability or the accuracy of user-provided information. Users
              should exercise due diligence and take precautions when engaging
              in transactions.
            </p>
            <p>
              One TAP Service will not be held responsible for any disputes or
              damages arising from such interactions. If disputes arise, One TAP
              Service may facilitate resolution but is not obligated to
              intervene. Any claims or disputes related to the platform are
              released from liability concerning One TAP Service and its
              affiliates.
            </p>
          </section>

          {/* L. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              L. Dispute Resolution
            </h2>
            <p>
              If you have a dispute with One TAP Service, our aim is to resolve
              it efficiently and amicably. We encourage you to contact us
              directly via email at info@OneTAPService or through our call
              center at 16516. Disputes may be resolved through alternative
              dispute resolution methods, such as mediation or arbitration.
            </p>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              1. Governing Law
            </h3>
            <p>
              The Terms of Use and all associated agreements are governed by the
              laws of Bangladesh. Any unresolved disputes will be exclusively
              handled in the courts of Dhaka, Bangladesh.
            </p>
          </section>

          {/* M. Advertisements */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              M. Advertisements
            </h2>
            <p>
              The platform may feature advertisements to support its services.
              One TAP Service is not liable for any loss or damage resulting
              from interactions with advertisers or reliance on their offerings.
              Advertisements do not imply endorsement by One TAP Service.
            </p>
          </section>

          {/* N. Third-Party Links */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              N. Third-Party Links and Resources
            </h2>
            <p>
              The website may include links, forms, or phone numbers for
              third-party resources. While you may interact or transact with
              these third-party entities, One TAP Service does not control or
              endorse their offerings. Users are advised to review the
              respective third-party terms and privacy policies as One TAP
              Service is not liable for any loss or damage caused by
              third-party interactions.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Referral Program Policy
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Referrers will benefit only after the referred user completes
                their first order.
              </li>
              <li>
                Both parties receive a discount of 200 BDT for successful
                referrals.
              </li>
              <li>
                The discount is split into two reference codes worth 100 BDT
                each.
              </li>
              <li>
                Reference code validity: 1 month for the referrer, 3 months for
                the referred user.
              </li>
              <li>
                A referral is valid only if the referred user&apos;s first
                order totals 500 BDT or more. If the first order is less than
                500 BDT, the referrer will not receive any benefits.
              </li>
              <li>
                Referrers and referred users cannot order the same service at
                the same location within the same time period.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              O. Fraudulent Protection Policy
            </h3>
            <p>
              To ensure a secure shopping experience, One TAP Service actively
              monitors transactions for potential fraudulent activities. If
              suspicious activity is identified, we reserve the right to cancel
              past, current, or future orders without liability. Additionally,
              One TAP Service may refuse or cancel orders under circumstances
              such as pricing inaccuracies or service unavailability. We may
              also request further verification before accepting an order and
              will notify you if your order is canceled or if additional
              information is required. Please note that promotional vouchers
              used in canceled orders may not be refunded.
            </p>
            <p>
              If a service user engages in any of the following prohibited
              activities, deemed as fraudulent by One TAP Service, we reserve
              the right to take appropriate actions, including but not limited
              to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>(a) Canceling orders or postings</li>
              <li>(b) Limiting or suspending account privileges</li>
              <li>
                (c) Taking actions in accordance with the country&apos;s laws
                and regulations
              </li>
              <li>
                (d) Enforcing measures as per company policies
              </li>
            </ul>
            <p>
              <strong>Examples of Prohibited Activities:</strong>
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Providing false information during account creation or order
                placement, including incorrect name, mobile number, address, or
                profile picture.
              </li>
              <li>Submitting falsified documents.</li>
              <li>
                Misusing another customer&apos;s phone number or email address.
              </li>
              <li>Using invalid or fake contact details.</li>
              <li>
                Exploiting promotional vouchers not linked to the registered
                account.
              </li>
              <li>
                Altering or distributing any aspect of the One TAP Service
                platform (including websites and apps).
              </li>
              <li>
                Using automated tools (e.g., robots, spiders, scrapers) to
                access the website without prior authorization.
              </li>
              <li>
                Overloading servers with excessive requests beyond reasonable
                use.
              </li>
              <li>
                Posting messages or information that violate local laws or
                regulations.
              </li>
              <li>Refusing to pay for confirmed orders.</li>
              <li>
                Failure to communicate or be available during scheduled service
                delivery.
              </li>
              <li>
                Using someone else&apos;s identity to access services.
              </li>
              <li>
                Demanding refunds or solutions deemed unreasonable or
                unjustified by One TAP Service.
              </li>
              <li>
                Creating multiple accounts or placing orders under different
                identities.
              </li>
              <li>
                Exploiting system bugs for personal gain.
              </li>
              <li>
                Repeatedly ordering the same service within short intervals.
              </li>
              <li>
                Misusing promo codes multiple times within a day.
              </li>
              <li>
                Referring other users within the same location suspiciously.
              </li>
              <li>
                Placing multiple orders from different accounts at a single
                location on the same day.
              </li>
              <li>
                Failing to provide required documents upon request.
              </li>
              <li>
                Engaging in theft or fraudulent behavior during service
                delivery.
              </li>
              <li>
                Submitting false or inaccurate billing information.
              </li>
            </ul>
            <p>
              <strong>
                Additional Note on Billing Information Accuracy:
              </strong>{" "}
              By agreeing to these terms, you acknowledge your responsibility to
              provide accurate and updated billing and account information,
              including your name, address, email, and payment details. We are
              not liable for any issues resulting from inaccurate or outdated
              information. If we suspect fraudulent or incomplete billing
              details, we may suspend or terminate your account.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Promo Code Policy
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Promo codes are valid only within the specified promotional
                period.
              </li>
              <li>
                Services availed under a promo code must be completed within
                the offered timeline.
              </li>
              <li>Promo codes cannot be used after their expiration.</li>
              <li>
                Services booked under a promo code must be availed within seven
                days.
              </li>
              <li>
                Promo codes become invalid if the service category changes.
              </li>
              <li>
                Promo codes remain valid if line items within the same service
                category are updated.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Service Scheduling Policy
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>Services must be availed at the scheduled time.</li>
              <li>
                To reschedule, users must notify the service provider at least
                two hours in advance.
              </li>
              <li>
                Rescheduling without prior communication or cancellation within
                two hours of the scheduled time will incur a cancellation or
                minimum service fee to compensate for lost time and conveyance
                costs.
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Cancellation and Rescheduling Policy
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Canceling a service within two hours of the scheduled time will
                result in a cancellation fee.
              </li>
              <li>
                Rescheduling within two hours of the scheduled time will incur
                a minimum service fee in addition to the original service
                charge.
              </li>
            </ul>
          </section>

          {/* P. Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              P. Disclaimer of Warranties
            </h2>
            <p>
              Your use of the website and its services is at your own risk. To
              the fullest extent permitted by law, One TAP Service and its
              affiliates disclaim all warranties, express or implied, including
              but not limited to implied warranties of merchantability, fitness
              for a particular purpose, and non-infringement. All content,
              services, and information are provided &quot;as is&quot; and
              &quot;as available.&quot; We do not guarantee accuracy,
              reliability, or completeness and are not responsible for errors,
              unauthorized access, data breaches, bugs, or any losses arising
              from third-party actions or system failures.
            </p>
            <p>
              One TAP Service does not endorse or assume responsibility for any
              third-party services advertised on the website. Use discretion
              when engaging with external links or content.
            </p>
          </section>

          {/* Q. Limitations of Liability */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              Q. Limitations of Liability
            </h2>
            <p>
              One TAP Service and its affiliates are not liable for any direct,
              indirect, incidental, special, or consequential damages,
              including lost revenue, profits, or data, resulting from:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Use of the website or services.</li>
              <li>
                Errors, unauthorized access, or technical issues.
              </li>
              <li>
                Disputes or failed negotiations between users or third-party
                providers.
              </li>
              <li>
                Defamatory or illegal conduct by third parties.
              </li>
              <li>
                Interactions with third-party websites linked to the platform.
              </li>
            </ul>
            <p>
              Our aggregate liability shall not exceed the total fees paid to
              One TAP Service. By using our services, you agree that the risk
              of harm or damages from third-party conduct rests entirely with
              you.
            </p>
            <p>
              <strong>Force Majeure:</strong> Neither One TAP Service nor its
              users shall be held liable for delays or failures caused by
              events beyond reasonable control, such as natural disasters, war,
              strikes, or regulatory actions.
            </p>
          </section>

          {/* R. Indemnification and Release */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              R. Indemnification and Release
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless One TAP Service
              and its officers, managers, members, directors, employees,
              successors, assigns, subsidiaries, affiliates, service providers,
              suppliers, and agents from and against any and all claims,
              damages, obligations, losses, liabilities, costs, or expenses
              (including attorneys&apos; fees) arising from:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Your use of, access to, or participation in the website or
                mobile application.
              </li>
              <li>
                Your violation of any provision of these Terms of Use,
                including the Privacy Policy.
              </li>
              <li>
                Your infringement of any third-party rights, such as copyright,
                intellectual property, or privacy rights.
              </li>
              <li>
                Any claims arising from your submitted content causing harm or
                damage to a third party.
              </li>
            </ul>
            <p>
              This indemnification obligation will survive beyond the
              termination of these Terms of Use and your use of the website or
              mobile application.
            </p>
            <p>
              If you have a dispute with another user, you release One TAP
              Service (including its officers, managers, members, directors,
              employees, successors, assigns, affiliates, service providers,
              suppliers, and agents) from any claims, demands, or damages
              (actual and consequential) of any kind arising from or connected
              to such disputes.
            </p>
            <p>
              The rights and licenses granted under these Terms of Use cannot be
              transferred or assigned by you but may be assigned by One TAP
              Service without restrictions.
            </p>
          </section>

          {/* S. No Third-party Beneficiaries */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              S. No Third-party Beneficiaries
            </h2>
            <p>
              Unless explicitly stated otherwise in these Terms of Use, no third
              parties shall have any rights or benefits under these terms.
            </p>
          </section>

          {/* T. Notice */}
          <section>
            <h2 className="text-xl font-bold text-foreground">T. Notice</h2>
            <p>
              One TAP Service may provide notices to you via email, postal mail,
              or postings on the website or mobile application, including
              updates to these Terms of Use.
            </p>
          </section>

          {/* U. General Information */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              U. General Information
            </h2>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Entire Agreement
            </h3>
            <p>
              These Terms of Use, along with the Privacy Policy and other legal
              notices published by One TAP Service, constitute the complete
              agreement between you and One TAP Service. If any provision is
              found invalid or unenforceable, the remaining provisions will
              remain in effect. Failure to enforce any provision shall not be
              considered a waiver.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Statute of Limitations
            </h3>
            <p>
              Any claim arising out of or related to the website or mobile
              application must be filed within one (1) year from the date the
              cause of action arises; otherwise, it will be permanently barred.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Section Headings
            </h3>
            <p>
              The section headings in these Terms of Use are for convenience
              only and hold no legal or contractual significance.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Scheduling Limitations
            </h3>
            <p>
              An order may be rescheduled a maximum of three times (initial
              schedule plus two reschedules). Reschedules cannot extend beyond
              one week from the current schedule unless handled as an
              exception.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Consent to Promotional Communications
            </h3>
            <p>
              By accepting these Terms of Use, you consent to receiving
              promotional messages (via SMS, email, calls, or other forms of
              communication) from One TAP Service. If you wish to opt out,
              follow the instructions provided in the communication. You also
              consent to activities that are customary or implied for similar
              platforms, even if not explicitly outlined here.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Severability
            </h3>
            <p>
              If any provision of these Terms is deemed unlawful or
              unenforceable, it will still be enforceable to the maximum extent
              permitted, with the unenforceable portion severed. This will not
              affect the validity of the remaining provisions.
            </p>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Contact Information
            </h3>
            <p>
              For questions or concerns regarding these Terms of Use, you may
              contact us via email at{" "}
              <a
                href="mailto:info@OneTAPService"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                info@OneTAPService
              </a>
              .
            </p>
          </section>

          {/* Acceptance of Cookies */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              Acceptance of Cookies
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>What Are Cookies?</strong> Cookies are small text files
                stored on your device when you visit our website or app. They
                enhance user experience, provide insights, and enable specific
                functionality.
              </li>
              <li>
                <strong>Managing Cookies:</strong> You can manage cookies
                through browser settings. Disabling cookies may affect website
                or app performance.
              </li>
              <li>
                <strong>Consent:</strong> By using the website or app, you
                consent to our use of cookies as described. If you disagree,
                adjust your browser settings or stop using the platform.
              </li>
              <li>
                <strong>Policy Updates:</strong> Changes to the Cookie Policy
                will be reflected on this page. Continued use signifies
                acceptance of the updated policy.
              </li>
            </ul>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
