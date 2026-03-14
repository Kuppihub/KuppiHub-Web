import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Kuppi Hub",
  description: "Privacy Policy for Kuppi Hub.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-6">Effective date: March 14, 2026</p>

      <p className="mb-6">
        Kuppi Hub ("we", "our", or "us") respects your privacy. This Privacy
        Policy explains how we collect, use, and protect your information when
        you use our website and services. If you do not agree with this policy,
        please do not use the site.
      </p>

      <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
      <p className="mb-4">
        When you create an account or log in, we may collect personal
        information such as your name and email address.
      </p>
      <p className="mb-6">
        We also collect non-personal information about how the site is used,
        such as pages visited and general usage patterns.
      </p>

      <h2 className="text-xl font-semibold mb-2">How We Use Information</h2>
      <p className="mb-6">
        We use the information to operate and improve the platform, provide
        access to your account, and understand how users engage with the site.
      </p>

      <h2 className="text-xl font-semibold mb-2">Analytics</h2>
      <p className="mb-6">
        We use Google Analytics to understand site traffic and usage. Google
        Analytics may use cookies or similar technologies to collect usage
        information. You can opt out by adjusting your browser settings or using
        Google’s opt-out tools.
      </p>

      <h2 className="text-xl font-semibold mb-2">Advertising</h2>
      <p className="mb-6">We do not display ads on the site.</p>

      <h2 className="text-xl font-semibold mb-2">Data Sharing</h2>
      <p className="mb-6">
        We do not sell, rent, or share your personal information with service
        providers. We may only disclose information if required by law.
      </p>

      <h2 className="text-xl font-semibold mb-2">Data Retention</h2>
      <p className="mb-6">
        We retain personal information for as long as your account is active or
        as needed to provide services, comply with legal obligations, or resolve
        disputes.
      </p>

      <h2 className="text-xl font-semibold mb-2">Security</h2>
      <p className="mb-6">
        We implement reasonable security measures to protect your information,
        but no method of transmission or storage is 100% secure.
      </p>

      <h2 className="text-xl font-semibold mb-2">Children’s Privacy</h2>
      <p className="mb-6">
        Our services are intended for students and are not directed to children
        under 13. If you believe a child has provided us personal information,
        please contact us.
      </p>

      <h2 className="text-xl font-semibold mb-2">International Users</h2>
      <p className="mb-6">
        Our services are based in Sri Lanka. Users from other countries may
        access the site, and any information you provide will be processed in
        Sri Lanka.
      </p>

      <h2 className="text-xl font-semibold mb-2">Changes to This Policy</h2>
      <p className="mb-6">
        We may update this policy from time to time. The latest version will be
        posted on this page with the updated effective date.
      </p>

      <h2 className="text-xl font-semibold mb-2">Contact</h2>
      <p className="mb-6">
        If you have questions, contact us at{" "}
        <a className="text-blue-600 hover:underline" href="mailto:contact@kuppihub.org">
          contact@kuppihub.org
        </a>
        .
      </p>

      <p className="text-sm text-gray-600">
        Return to <Link className="text-blue-600 hover:underline" href="/">Home</Link>.
      </p>
    </main>
  );
}
