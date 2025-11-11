/**
 * Landing Page
 * Public homepage for ZeroLeak Mail
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            🔒 ZeroLeak Mail
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            Disposable Email Addresses with Transparent Auditing
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Create unique email addresses for each website. When one gets leaked or starts receiving spam,
            <strong className="text-gray-900"> instantly replace it with one click</strong>.
            All your emails stay in one unified inbox - nothing is ever lost!
          </p>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto mb-12">
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl mb-2">🛡️</div>
                <h4 className="font-bold text-gray-900 mb-1">Hide Your Real Email</h4>
                <p className="text-sm text-gray-600">
                  Use a@zeroleak for Amazon, b@zeroleak for Netflix - merchants never see your real address
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔄</div>
                <h4 className="font-bold text-gray-900 mb-1">Easy Replacement</h4>
                <p className="text-sm text-gray-600">
                  If leaked, click "Replace" to instantly create a new email. Update the merchant - done!
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">📬</div>
                <h4 className="font-bold text-gray-900 mb-1">One Inbox</h4>
                <p className="text-sm text-gray-600">
                  All emails from all your disposable addresses in ONE place. Old emails never disappear!
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📧"
            title="Disposable Email Aliases"
            description="Create unlimited email aliases for different services. Never expose your real email address again."
          />
          <FeatureCard
            icon="🚨"
            title="Leak Detection"
            description="Automatic detection when your email appears in data breaches. Instantly kill compromised aliases."
          />
          <FeatureCard
            icon="🛡️"
            title="Spam Protection"
            description="Advanced spam detection automatically filters junk. Auto-kill aliases that receive too much spam."
          />
          <FeatureCard
            icon="🔍"
            title="Transparent Auditing"
            description="Complete visibility into all actions and security events. Know exactly what happens to your data."
          />
          <FeatureCard
            icon="📊"
            title="Receipt Management"
            description="Automatically extract and organize receipts from emails. Export for tax purposes."
          />
          <FeatureCard
            icon="🔒"
            title="Privacy First"
            description="Your data stays private. No tracking, no selling data. Open source and transparent."
          />
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard
              number="1"
              title="Create an Alias"
              description="Generate a unique email address for each service you sign up for"
            />
            <StepCard
              number="2"
              title="Use It Anywhere"
              description="Use your alias when signing up for newsletters, services, or online shopping"
            />
            <StepCard
              number="3"
              title="Stay Protected"
              description="Emails are scanned for spam and monitored for data breaches"
            />
            <StepCard
              number="4"
              title="Kill When Leaked"
              description="If an alias is leaked or gets spam, kill it with one click"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 bg-blue-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Protect Your Email?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who've taken control of their email privacy
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Create Your Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 ZeroLeak Mail. Built with privacy in mind.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
