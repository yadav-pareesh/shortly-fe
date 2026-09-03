import { useEffect } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { CreateUrlForm } from './components/CreateUrlForm';
import { useThemeStore } from './store/useThemeStore';

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    // This is the single source of truth for DOM theme toggling.
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl text-center">
          
          <div className="mb-4 flex items-center justify-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-none tracking-tight">
              Shortly <ThemeToggle />
            </h1>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-lg text-muted-foreground">
            <span>Create, manage, and track your short URLs</span>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 sm:p-8">
            <CreateUrlForm />
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shortly. All rights reserved.
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;