import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - One Tap Service",
  description:
    "Learn how One Tap Service collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">Privacy Policy</span>
        </nav>

        {/* Heading */}
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Privacy and Policy for 1 TAP Service
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">
          <strong>Last Updated:</strong> January 12, 2025
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          <strong>Effective Date:</strong> January 20, 2025
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-muted-foreground">
          {/* Introduction */}
          <section>
            <p>
              One TAP Service Services Limited (&ldquo;One TAP Service&rdquo;)
              values and respects your privacy. This Privacy Policy
              (&ldquo;Policy&rdquo;) outlines the types of information we
              collect from you when you visit our website,{" "}
              <strong>www.OneTAPService.com</strong> (the &ldquo;Website&rdquo;),
              or use our services (the &ldquo;Services&rdquo;), as well as how we
              utilize and disclose that information.
            </p>
            <p>
              If you have questions or need further clarification regarding this
              Policy, please contact us at{" "}
              <a
                href="mailto:support@onetapservice.com"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                support@onetapservice.com
              </a>
              . This Policy is a part of and subject to the One TAP Service{" "}
              <Link
                href="/terms-of-service"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Terms of Use
              </Link>
              . By using the Website and/or Services, you agree to the terms of
              this Policy and the Terms of Use.
            </p>
          </section>

          {/* Section A */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              A. Collection of Your Personal Information
            </h2>

            <h3 className="text-lg font-semibold text-foreground">
              1. Personal Information We Collect
            </h3>
            <p>
              &ldquo;Personal Information&rdquo; refers to data that can identify
              or contact you directly or indirectly, such as your name, address,
              email address, phone number, purchase history, or usage data.
            </p>

            <h4 className="text-base font-semibold text-foreground">
              Service Professionals
            </h4>
            <p>
              A &ldquo;Service Professional&rdquo; is an individual offering
              skilled or specialized services to customers or clients for
              compensation. These professionals often have specific expertise,
              training, or certifications in their field and operate in
              industries such as healthcare, education, technology, and
              maintenance.
            </p>
            <p>
              Service Professionals who list their services on our platform are
              required to create an account, which involves sharing certain
              personal and business details. This includes, but is not limited
              to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Contact details (e.g., phone number, email address)
              </li>
              <li>
                Business-related information (e.g., business name, service
                description, location, travel preferences, and profile headline)
              </li>
              <li>
                Additional content (e.g., photographs, videos, or other
                promotional material)
              </li>
            </ul>
            <p>
              Service Professionals may also be required to provide sensitive
              details like bank information, identification documents, and
              feedback during their use of our platform. The information
              collected ensures a better user experience, improves customer
              satisfaction, and helps address consumer needs.
            </p>
            <p>
              One TAP Service reserves the right to record conversations between
              Service Professionals and consumers conducted through our chat or
              call features. These records may be used for purposes such as
              monitoring abuse, resolving disputes, or safeguarding the rights of
              all parties.
            </p>

            <h4 className="text-base font-semibold text-foreground">
              Consumers
            </h4>
            <p>
              A &ldquo;Consumer&rdquo; refers to an individual purchasing goods
              or services for personal use rather than business purposes. During
              account registration or usage of the platform, we may collect
              information such as:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Name, address, email, phone number, and postal code
              </li>
              <li>
                Additional details like mailing address or demographic information
                (e.g., gender, age, education, or ethnic origin)
              </li>
              <li>
                Content shared in profiles, offers, feedback, blogs, or chatrooms
              </li>
            </ul>
            <p>
              This information helps enhance the platform&apos;s functionality
              and tailor our services to your preferences.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              2. Collection of Personal Information from Social Networking Sites
            </h3>
            <p>
              You may choose to log in to our Website using your Facebook account
              credentials. When you do, you will be required to enter the email
              address and password associated with your Facebook account. During
              this process, we will request access to specific information from
              your Facebook profile, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your name, profile picture, and gender</li>
              <li>Networks, user IDs, and list of friends</li>
              <li>Date of birth, email address, and other public information</li>
              <li>
                Any additional information you permit us to access (even if not
                set to public)
              </li>
            </ul>
            <p>
              If you grant access, this information will be stored alongside
              other data collected from or about you. Please note that Facebook
              controls the data it collects and shares. For details on how
              Facebook uses and discloses your information, refer to
              Facebook&apos;s Privacy Policy.
            </p>
            <p>
              To request the deletion of data shared with us through Facebook,
              you can consult Facebook&apos;s data deletion policy.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              3. Collection of Automatic Information, Use of Cookies, and Other
              Tracking Technologies
            </h3>
            <p>
              We, along with third-party service providers (including ad
              networks), use cookies, web beacons, and other tracking tools to
              collect data about your interactions with our Website and Services.
              This information may include:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Browser type, operating system, and internet service provider
                (ISP)
              </li>
              <li>Your domain name, access time, and IP address</li>
              <li>
                The URL of the website you visited prior to ours
              </li>
              <li>
                Page views, device type, and frequency of visits to our Website
              </li>
            </ul>
            <p>This data helps us with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Website analytics, including identifying popular features and
                areas for improvement
              </li>
              <li>Evaluating advertising effectiveness</li>
              <li>Enhancing user experience and tailoring content</li>
            </ul>

            <h4 className="text-base font-semibold text-foreground">Cookies</h4>
            <p>
              A &ldquo;cookie&rdquo; is a small text file stored on your device
              when you visit a website. Cookies allow websites to remember user
              preferences, login information, and browsing activity. Cookies can
              also be used for tracking and analytics, as well as targeted
              advertising.
            </p>
            <p>
              We and our third-party providers use cookies to collect
              information. For example, Google uses cookies to measure ad
              performance. If you visit our Website with a Google ad cookie on
              your device, we and Google can identify your interaction with the
              ad. Use of such cookies is governed by this Policy and
              Google&apos;s Privacy Policy.
            </p>

            <h4 className="text-base font-semibold text-foreground">
              Disabling Cookies
            </h4>
            <p>
              You can choose to accept or decline cookies. Most browsers
              automatically accept cookies, but you can modify your settings to
              disable them. Note that disabling cookies may limit your ability to
              use certain features of our Website.
            </p>

            <h4 className="text-base font-semibold text-foreground">
              Clear GIFs, Pixel Tags, and Other Technologies
            </h4>
            <p>
              We also use technologies such as clear GIFs, pixel tags, and web
              beacons. These tiny graphics, embedded invisibly in web pages or
              emails, allow us to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Track Website visitor activities</li>
              <li>Manage content and compile Website usage statistics</li>
              <li>
                Monitor email response rates, track email views, and determine if
                emails are forwarded
              </li>
            </ul>
            <p>
              These tools help us optimize user experience and improve
              communication with our users.
            </p>
          </section>

          {/* Section B */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              B. How One TAP Service Uses the Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-foreground">
              1. How Personal Information Is Used
            </h3>
            <p>
              We collect your personal information and aggregate data about your
              usage of our Website and Services to better understand your needs
              and enhance your experience. Specifically, we may use your personal
              information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Providing Our Services:</strong> This includes registering
                you for services, verifying your identity, and enabling you to
                access and use our Website and Services.
              </li>
              <li>
                <strong>Location Data:</strong> To improve service delivery,
                operational quality, and timing.
              </li>
              <li>
                <strong>Consumer Support:</strong> To address your inquiries and
                provide assistance.
              </li>
              <li>
                <strong>Record-Keeping:</strong> For internal administrative
                purposes.
              </li>
              <li>
                <strong>Billing and Payment:</strong> To process payments,
                including sharing information with third-party payment processors
                related to our Services.
              </li>
              <li>
                <strong>Service Contract Management:</strong> To monitor and
                oversee service contracts and ensure compliance with any
                agreements you enter with us.
              </li>
              <li>
                <strong>Website and Service Improvement:</strong> For example,
                analyzing search activity to enhance user experience,
                troubleshooting issues, and optimizing Website performance.
              </li>
              <li>
                <strong>Promotions:</strong> To send you promotional emails about
                new products, offers, or other updates from One TAP Service that
                may interest you.
              </li>
              <li>
                <strong>Communication:</strong> To contact you via email, phone,
                fax, mail, or text for services or information you&apos;ve
                requested.
              </li>
              <li>
                <strong>Market Research:</strong> To conduct research, including
                customizing the Website according to your interests.
              </li>
              <li>
                <strong>Demographic Analysis:</strong> Using demographic data
                (such as age, location, and other details) to tailor promotional
                efforts and research.
              </li>
              <li>
                <strong>Dispute Resolution and Protection:</strong> To resolve
                disputes, protect ourselves and users, and enforce our Terms of
                Use.
              </li>
              <li>
                <strong>Verification and Accuracy:</strong> Comparing personal
                information we collect with third-party data to ensure its
                accuracy.
              </li>
              <li>
                <strong>Data Aggregation:</strong> Combining aggregate data with
                personal information to improve services.
              </li>
            </ul>
            <p>
              From time to time, we may use your personal information for new,
              unanticipated purposes not previously disclosed in this Privacy
              Policy. If our data practices change regarding information we have
              already collected, we will make reasonable efforts to notify you
              and obtain consent as required by law.
            </p>
            <p>
              For a better service experience, we may ask you to provide
              personally identifiable information such as username, address, phone
              number, location, and device details. This information will be
              retained and used as described in this Privacy Policy. The app may
              also use third-party services that could collect data to identify
              you. Here are the third-party services involved:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Play Services</li>
              <li>Firebase Analytics</li>
              <li>Firebase Crashlytics</li>
              <li>Facebook</li>
              <li>Fabric</li>
              <li>OneSignal</li>
              <li>Amplitude</li>
            </ul>
          </section>

          {/* Section C */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              C. Electronic Newsletters, Invitations, Polls, and Surveys
            </h2>
            <p>
              At our discretion, One TAP Service may offer the following free
              services on the Website, which you can choose to use or receive.
              Some services may require you to provide additional personal
              information:
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              1. Electronic Newsletters
            </h3>
            <p>
              We may offer a free electronic newsletter to our users. Users who
              sign up for the newsletter will have their email addresses
              collected. You can unsubscribe from the newsletter anytime by
              following the link in each issue, changing your subscription
              preferences, or updating your profile settings.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              2. Send to a Friend
            </h3>
            <p>
              Users can voluntarily forward a link, page, or document to someone
              else by clicking the &ldquo;Send to a Friend&rdquo; option. You
              will need to provide your email address and the recipient&apos;s
              email address. Your email address will only be used to handle
              transmission errors and inform the recipient of who sent the email.
              The information will not be used for other purposes.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              3. Polling
            </h3>
            <p>
              We may offer interactive polls that allow users to share their
              opinions and view others&apos; responses on various issues,
              Services, and features of the Website. Poll responses are aggregated
              and anonymous. We may tag users to ensure they can vote only once on
              a given question, but this tag does not identify individual users.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              4. Surveys
            </h3>
            <p>
              From time to time, we may conduct surveys to better target our
              content. Individual responses are not shared with third parties.
              However, we may share aggregate data from the surveys with partners,
              service providers, or other entities. The results may also be posted
              on the Website and be accessible to other users.
            </p>
          </section>

          {/* Section D */}
          <section>
            <h2 className="text-xl font-bold text-foreground">D. Security</h2>
            <p>
              We implement procedural and technological measures designed to
              safeguard your personal information against unauthorized access or
              disclosure. These measures may include encryption, password
              protection, and physical security protocols.
            </p>
            <p>
              However, no security system is entirely foolproof, and we cannot
              guarantee that your personal information or private communications
              will remain inaccessible to unauthorized parties. You are
              responsible for protecting your account by:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Using a robust, unique password.</li>
              <li>Keeping your login credentials private.</li>
              <li>Logging out from shared devices after use.</li>
            </ul>
            <p>
              One TAP Service is not liable for unauthorized access resulting
              from lost, stolen, or compromised passwords or unauthorized
              activities on your account.
            </p>
          </section>

          {/* Section E */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              E. Disclosure
            </h2>
            <p>
              We may share the information collected about you, including
              personal information, under the following circumstances:
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              1. Information Disclosed to Protect Us and Others
            </h3>
            <p>
              We may disclose your information if we believe it is necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Comply with legal processes such as court orders or governmental
                regulations.
              </li>
              <li>Reduce potential liability in lawsuits.</li>
              <li>
                Enforce our Privacy Policy, Terms of Use, or other agreements.
              </li>
              <li>
                Investigate or prevent fraud, unauthorized transactions, or
                illegal activities.
              </li>
              <li>
                Protect our rights, property, or the safety of others.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              2. Information Disclosed to Third-Party Service Providers and
              Business Partners
            </h3>
            <p>
              We may share your personal information with third-party vendors and
              service providers that assist us in maintaining the Website,
              delivering our Services, or conducting business operations. Examples
              include payment processors and survey providers. These entities are
              restricted from using your personal information beyond the scope of
              their services for us.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              3. Disclosure to Non-Affiliated Third Parties for Your Request
            </h3>
            <p>
              When you request services, your information may be shared with
              third-party websites we partner with to enhance your
              request&apos;s visibility. These websites will display details of
              your request, including your location and contact information.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              4. Disclosure to Other Users of Our Website
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                If you are a service provider, information you post on the
                Website (excluding payment details) will be accessible to other
                users.
              </li>
              <li>
                Consumers&apos; requests, names, and locations will also be
                visible to all visitors. Service providers may access additional
                details, including contact information, to bid on requests.
              </li>
              <li>
                Comments posted on the Website will be visible to all visitors.
              </li>
              <li>
                Aggregated survey results may be displayed on the Website.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              5. Disclosure to Law Enforcement or Government Officials
            </h3>
            <p>
              We will disclose your personal information to law enforcement or
              government authorities if legally required or to cooperate with
              investigations. This may include details like your name, address,
              email, transaction history, and fraud-related information.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              6. In the Event of a Change of Control or Bankruptcy
            </h3>
            <p>
              In the event of a merger, acquisition, sale of assets, or
              corporate reorganization, One TAP Service reserves the right to
              transfer the collected information to a successor entity under
              similar terms. In cases of bankruptcy or reorganization, information
              transfer will adhere to existing privacy protections.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              7. Information Disclosed at Your Request
            </h3>
            <p>
              We may share your personal information with other registered users
              when you explicitly request or consent to such sharing, for
              example, during a contract with another user.
            </p>
          </section>

          {/* Section F */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              F. Links to External Websites
            </h2>
            <p>
              Our Website may include links to third-party websites or resources
              outside our control. These links are provided for your convenience
              and do not imply endorsement by One TAP Service.
            </p>
            <p>
              We are not responsible for the content, security, or privacy
              practices of external websites. Information you share on such
              websites is governed by their terms of use and privacy policies. You
              should review those policies before using external websites.
            </p>
          </section>

          {/* Section G */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              G. Updating, Deleting, and Correcting Your Personal Information
            </h2>
            <p>
              You can manage the collection and use of your personal information
              by:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Reviewing, correcting, and deleting your information through the
                &ldquo;Edit Profile&rdquo; section on the Website.
              </li>
              <li>
                Promptly updating your personal information if it becomes
                inaccurate or outdated.
              </li>
            </ul>
            <p>
              We do not manually alter your personal information, as verifying
              identities remotely can be challenging. However, upon request, we
              will deactivate your account and remove your personal information
              from public view, as soon as reasonably possible, considering your
              account activity and applicable laws.
            </p>
            <p>Please note:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                We retain information from closed accounts to comply with legal
                requirements, prevent fraud, resolve disputes, collect fees owed,
                and enforce our Terms of Use.
              </li>
              <li>
                Once information such as requests, feedback, or other posts is
                publicly shared on the Website, it may not be possible to edit or
                remove it.
              </li>
            </ul>
            <p>
              After your account is deleted or removed, One TAP Service is not
              responsible for any residual personal information remaining on the
              Website outside of your deleted account.
            </p>
          </section>

          {/* Section H */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              H. Choices Regarding the Use of Your Personal Information
            </h2>
            <p>
              We may send you promotional or informational emails periodically.
              You can opt-out of these communications by following the
              instructions in the email. Please allow up to 10 business days for
              opt-out requests to be processed.
            </p>
            <p>
              Note: Opting out of promotional emails does not stop us from
              sending account-related emails or communications about services you
              have requested or received.
            </p>
          </section>

          {/* Section I */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              I. Third-Party Ad Networks
            </h2>
            <p>
              We collaborate with third-party ad networks that display ads on
              other websites based on your activity on our Site and other
              websites. These ads aim to showcase products and services relevant
              to you.
            </p>
            <p>
              To enable this, third-party advertisers may use technologies like
              cookies, JavaScript, web beacons, or Flash LSOs to measure ad
              effectiveness and personalize content.
            </p>
            <p>Please note:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                These technologies and practices are governed by the third
                party&apos;s privacy policies, not by One TAP Service.
              </li>
              <li>
                We may share non-personally identifiable or aggregate data with
                these advertisers for improved targeting and analysis.
              </li>
            </ul>
          </section>

          {/* Section J */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              J. Full Name and Use of Information on One TAP Service
            </h2>

            <h3 className="text-lg font-semibold text-foreground">
              1. Your Full Name
            </h3>
            <p>
              As a Registered User, you will select a Full Name during the
              registration process. This name will be associated with your
              activities on the Website, and other users may see it when you:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Book, cancel, or receive offers for a service.</li>
              <li>Post a service or engage in related transactions.</li>
            </ul>
            <p>
              If you use your real name as your Full Name, other users may be
              able to identify your activities on the Website.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              2. Using Information from One TAP Service
            </h3>
            <p>
              The Website allows the sharing of personal information to
              facilitate service transactions. If you contract with another user,
              you may need to share contact information (name, email, phone
              number, or address) with them.
            </p>
            <p>Guidelines for using others&apos; information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use information only for One TAP Service transactions.
              </li>
              <li>
                Do not misuse or share other users&apos; information for any
                unauthorized purposes.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              3. Account Protection
            </h3>
            <p>
              Your password is the key to your account security.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Create a strong password with unique numbers, letters, and special
                characters.
              </li>
              <li>Do not share your password with others.</li>
            </ul>
            <p>
              If your password is compromised, notify One TAP Service immediately
              and change it to prevent unauthorized access. You are responsible
              for all account activities conducted using your credentials.
            </p>
          </section>

          {/* Section K */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              K. User-Generated Content
            </h2>
            <p>
              You may post comments, feedback, pictures, or other content on the
              Website. However, any content you post will be publicly available
              to all visitors.
            </p>
            <p>Important:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Once published, One TAP Service cannot prevent your content from
                being used in ways that may violate this Policy, the law, or your
                privacy.
              </li>
              <li>
                Be mindful of the information you share publicly.
              </li>
            </ul>
          </section>

          {/* Section L */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              L. Privacy Policy Updates
            </h2>
            <p>
              This Policy is current as of the Effective Date stated above. By
              using our Website or Services, you agree to this Policy.
            </p>
            <p>
              One TAP Service may update this Policy periodically and will post
              changes on this page. We encourage you to review the Policy
              regularly for updates. Your continued use of the Website or
              provision of personal information constitutes acceptance of the
              updated terms.
            </p>
          </section>

          {/* Footer note */}
          <section className="border-t pt-6">
            <p className="text-center text-sm">
              &copy; 2025 One TAP Service Platform Limited. All Rights Reserved.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-foreground">
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please{" "}
              <Link
                href="/contact-us"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
