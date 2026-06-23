import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-accent)] opacity-20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-blue)] opacity-20 rounded-full blur-[100px]" />

      <div className="max-w-3xl text-center space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg glow-purple">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            AcademIQ
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Your AI-Powered <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-pink-400">
            Academic OS
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Notion + Duolingo + ChatGPT. Organize your schedule, track habits, get personalized AI tutoring, and ace your exams with a master study plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Show when="signed-in">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-xl">
              <span className="text-sm text-[var(--color-text-secondary)]">Signed in as</span>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton>
              <button className="px-8 py-3.5 rounded-xl glass font-semibold hover:bg-[rgba(255,255,255,0.05)] transition-colors border border-[var(--color-border)]">
                Log In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-200">
                <Sparkles className="w-4 h-4" /> Get Started Free
              </button>
            </SignUpButton>
          </Show>
        </div>
      </div>
    </div>
  );
}
