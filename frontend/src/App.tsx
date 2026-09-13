
import Dashboard from './components/Dashboard.tsx';

function App() {
  return (
    <div className="min-h-screen bg-darker text-slate-200">
      <header className="bg-dark border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            SwitchMonitor
          </h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-sm text-slate-400">Live</span>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 py-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
