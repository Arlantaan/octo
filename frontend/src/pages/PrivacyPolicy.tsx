import SEO from '../components/SEO'

const PrivacyPolicy = () => {
  const lastUpdated = 'July 2025'

  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-20">
      <SEO
        title="Privacy Policy"
        description="How Octopus Tech collects, uses, and protects the personal information you share through our website."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-white/80 leading-relaxed text-sm sm:text-base">
          <section>
            <p>
              This Privacy Policy explains how Octopus Tech ("we", "us", "our") collects, uses,
              and protects the information you provide when using our website. We are committed to
              handling your data responsibly and only for the purposes described below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Information We Collect</h2>
            <p>
              When you submit our contact or quote form, we collect the information you choose to
              provide — typically your name, email address, phone number, company name (optional),
              and the details of your project or enquiry. We do not collect this information unless
              you actively submit it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How We Use Your Information</h2>
            <p>We use the information you provide solely to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Respond to your enquiry and discuss your project requirements;</li>
              <li>Prepare and send you a quote or proposal;</li>
              <li>Communicate with you about work you have engaged us for.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal information with third parties for
              marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data Retention</h2>
            <p>
              We keep the information you submit only for as long as necessary to respond to your
              enquiry and, where relevant, to fulfil a project. You may request that we delete your
              information at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, or request
              deletion of the personal information we hold about you, and to object to or restrict
              certain processing. To exercise any of these rights, email us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Services</h2>
            <p>
              Our website may load assets (such as fonts and icons) from third-party providers.
              These providers may process limited technical data, such as your IP address, as part
              of delivering their service. We do not control and are not responsible for the privacy
              practices of these external providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or how your data is handled, please
              contact us at{' '}
              <a
                href="mailto:abdulla@octopustech.org"
                className="text-green-400 hover:underline"
              >
                abdulla@octopustech.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
