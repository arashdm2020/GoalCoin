import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Countdown } from '@/components/Countdown';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">GoalCoin</h1>
        <ConnectWalletButton />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-6 text-[#FFD700]">
            Coin of the People
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Empowering communities through blockchain technology
          </p>
          
          {/* Countdown */}
          <div className="flex justify-center mb-12">
            <Countdown />
          </div>
        </div>

        {/* Placeholder Sections */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {/* DAO Section */}
          <div className="bg-gray-900 rounded-lg p-8 border border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-colors">
            <h3 className="text-2xl font-semibold text-[#FFD700] mb-4">DAO</h3>
            <p className="text-gray-400">
              Decentralized Autonomous Organization for community governance.
              Coming soon...
            </p>
          </div>

          {/* Burn Tracker Section */}
          <div className="bg-gray-900 rounded-lg p-8 border border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-colors">
            <h3 className="text-2xl font-semibold text-[#FFD700] mb-4">Burn Tracker</h3>
            <p className="text-gray-400">
              Track token burns and supply reduction in real-time.
              Coming soon...
            </p>
          </div>

          {/* Fitness Challenge Section */}
          <div className="bg-gray-900 rounded-lg p-8 border border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-colors">
            <h3 className="text-2xl font-semibold text-[#FFD700] mb-4">Fitness Challenge</h3>
            <p className="text-gray-400">
              Participate in fitness challenges and earn rewards.
              Coming soon...
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-gray-800">
        <p className="text-center text-gray-500">
          © 2025 GoalCoin. All rights reserved.
        </p>
      </footer>
    </div>
  );
}