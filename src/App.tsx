import React from 'react';
import { Navbar } from './components/Navbar';
import { CreateUrlForm } from './components/CreateUrlForm';
import { UrlList } from './components/UrlList';
import { StatsOverview } from './components/StatsOverview';
import { ToastContainer } from './components/Toast';
import { ZapIcon, BarChartIcon, QrCodeIcon, ShieldCheckIcon } from './components/Icons';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200 antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-xs">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Fast &bull; Reliable &bull; Secure
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Shorter Links.{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Deeper Insights.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Create clean, memorable short links in seconds. Generate instant QR codes and track click engagement effortlessly.
          </p>
        </section>

        {/* URL Creation Engine Card */}
        <section className="w-full max-w-2xl mx-auto">
          <div className="relative rounded-2xl border border-border/80 bg-card/90 p-5 sm:p-8 shadow-xl shadow-primary/5 backdrop-blur-md transition-all">
            {/* Decorative background glow */}
            <div
              aria-hidden="true"
              className="absolute -top-12 -left-12 -z-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-12 -right-12 -z-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
            />

            <CreateUrlForm />
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground p-2 rounded-lg bg-muted/30">
              <ZapIcon size={14} className="text-amber-500" />
              <span>Instant Redirect</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground p-2 rounded-lg bg-muted/30">
              <QrCodeIcon size={14} className="text-indigo-500" />
              <span>Auto QR Codes</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground p-2 rounded-lg bg-muted/30">
              <BarChartIcon size={14} className="text-emerald-500" />
              <span>Click Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground p-2 rounded-lg bg-muted/30">
              <ShieldCheckIcon size={14} className="text-blue-500" />
              <span>Custom Aliases</span>
            </div>
          </div>
        </section>

        {/* Real-time Metrics Overview */}
        <section className="w-full max-w-3xl mx-auto">
          <StatsOverview />
        </section>

        {/* Links Management Dashboard Section */}
        <section className="w-full max-w-3xl mx-auto">
          <UrlList />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-6 sm:py-8 mt-12 text-center text-xs text-muted-foreground bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Shortly</span>
            <span>&bull;</span>
            <span>Link Management & Analytics</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Shortly. Built for speed, scalability, and ease.
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default App;