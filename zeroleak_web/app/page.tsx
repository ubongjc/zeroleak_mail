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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Animated Hero Banner */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-3xl opacity-20 animate-pulse"></div>
            <h1 className="relative text-7xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🔒 ZeroLeak Mail
              </span>
            </h1>
          </div>

          <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            Disposable Email Addresses with Transparent Auditing
          </p>

          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Create unique email addresses for each website. When one gets leaked or starts receiving spam,
            <strong className="text-purple-700"> instantly replace it with one click</strong>.
            All your emails stay in one unified inbox - nothing is ever lost!
          </p>

          {/* Feature Highlights */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto mb-12 border-2 border-purple-200">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-5xl mb-3 group-hover:animate-bounce">🛡️</div>
                <h4 className="font-black text-gray-900 mb-2 text-lg">Hide Your Real Email</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Use <code className="bg-purple-100 px-2 py-0.5 rounded text-purple-800">a@zeroleak</code> for Amazon,
                  <code className="bg-blue-100 px-2 py-0.5 rounded text-blue-800 ml-1">b@zeroleak</code> for Netflix -
                  merchants never see your real address
                </p>
              </div>
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-5xl mb-3 group-hover:animate-spin">🔄</div>
                <h4 className="font-black text-gray-900 mb-2 text-lg">Easy Replacement</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If leaked, click <span className="font-bold text-blue-600">"Replace"</span> to instantly create a new email.
                  Update the merchant - done! Old emails still accessible.
                </p>
              </div>
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="text-5xl mb-3 group-hover:animate-pulse">📬</div>
                <h4 className="font-black text-gray-900 mb-2 text-lg">One Unified Inbox</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All emails from <span className="font-bold">ALL</span> your disposable addresses in
                  <span className="font-bold text-purple-600"> ONE place</span>. Old emails never disappear!
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              href="/sign-up"
              className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xl font-black rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                <span className="mr-2">✨</span>
                Get Started Free
                <span className="ml-2">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/sign-in"
              className="px-10 py-5 bg-white text-purple-700 text-xl font-black rounded-xl border-4 border-purple-300 hover:bg-purple-50 hover:border-purple-500 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-semibold">Free Forever Plan</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
              <span className="text-blue-600 text-lg">🔒</span>
              <span className="font-semibold">Privacy First</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
              <span className="text-purple-600 text-lg">⚡</span>
              <span className="font-semibold">Instant Setup</span>
            </div>
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
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Get started in 4 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
        <div className="mt-24 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -mt-48 -mr-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -mb-48 -ml-48"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black text-white mb-6">
              Ready to Protect Your Email? 🚀
            </h2>
            <p className="text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of users who've taken control of their email privacy
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center px-12 py-6 bg-white text-purple-700 text-xl font-black rounded-xl hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="mr-3">✨</span>
              Create Your Free Account
              <span className="ml-3">→</span>
            </Link>
            <p className="mt-6 text-blue-100 text-sm">
              No credit card required • Setup in 60 seconds • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-purple-200 bg-gradient-to-r from-white via-purple-50 to-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🔒 ZeroLeak Mail
            </p>
            <p className="text-gray-600 mb-4">
              Built with privacy in mind. Open source and transparent.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>© 2024 ZeroLeak Mail</span>
              <span>•</span>
              <a href="#" className="hover:text-purple-600 transition">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-purple-600 transition">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-purple-600 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
      <div className="text-5xl mb-4 group-hover:animate-bounce">{icon}</div>
      <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-black mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
        {number}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
