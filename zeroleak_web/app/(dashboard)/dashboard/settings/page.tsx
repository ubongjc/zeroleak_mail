/**
 * Settings & Subscription Page
 * Manage account settings and premium subscriptions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  isCurrent: boolean;
}

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (tier: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier,
          action: 'subscribe',
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to start subscription. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Subscription</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and upgrade to unlock premium features
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {subscription?.currentTier?.name} Plan
            </h2>
            <p className="text-gray-600 mt-1">
              {subscription?.currentTier?.name === 'Free'
                ? 'Upgrade to unlock premium features'
                : 'Thank you for being a premium member!'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">
              ${subscription?.currentTier?.price}
              <span className="text-lg text-gray-600">/mo</span>
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Aliases</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">{subscription?.usage?.aliases}</p>
              <p className="ml-2 text-sm text-gray-500">
                / {subscription?.usage?.maxAliases === -1 ? '∞' : subscription?.usage?.maxAliases}
              </p>
            </div>
            {subscription?.atLimits?.aliases && (
              <p className="mt-1 text-xs text-red-600">⚠️ Limit reached - Upgrade to create more</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Email Storage</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">{subscription?.usage?.storage}</p>
              <p className="ml-2 text-sm text-gray-500">
                / {subscription?.usage?.maxStorage} GB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {subscription?.availableTiers?.map((tier: SubscriptionTier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              onSelect={() => {
                if (tier.id !== 'FREE' && !tier.isCurrent) {
                  subscribe(tier.id);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <p className="mt-1 text-gray-900">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account ID</label>
            <p className="mt-1 text-gray-900 font-mono text-sm">{user?.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Enable 2FA
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Passkeys</p>
              <p className="text-sm text-gray-600">Manage your biometric authentication</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-600">See where you're logged in</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              View Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-red-900">Export Your Data</p>
              <p className="text-sm text-red-700">Download all your data (GDPR compliant)</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              Export Data
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  onSelect,
}: {
  tier: SubscriptionTier;
  onSelect: () => void;
}) {
  const isPopular = tier.id === 'PREMIUM';
  const isFree = tier.id === 'FREE';

  return (
    <div
      className={`relative rounded-lg border-2 p-6 ${
        isPopular
          ? 'border-blue-600 bg-blue-50'
          : tier.isCurrent
          ? 'border-green-600 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {tier.isCurrent && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
        <div className="mt-4">
          <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
          {!isFree && <span className="text-gray-600">/month</span>}
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={tier.isCurrent}
        className={`mt-8 w-full px-6 py-3 rounded-lg font-medium transition ${
          tier.isCurrent
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {tier.isCurrent ? 'Current Plan' : isFree ? 'Get Started' : `Upgrade to ${tier.name}`}
      </button>
    </div>
  );
}
