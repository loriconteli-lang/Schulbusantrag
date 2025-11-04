
import React from 'react';
import TransportationForm from './components/TransportationForm';

const App: React.FC = () => {
  return (
    <main className="bg-slate-100 min-h-screen antialiased text-slate-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Schülerbeförderungsantrag</h1>
          <p className="text-slate-600 mt-2">Füllen Sie das folgende Formular aus, um den Transportbedarf zu melden.</p>
        </header>
        <TransportationForm />
        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Beförderungsdienst. Alle Rechte vorbehalten.</p>
        </footer>
      </div>
    </main>
  );
};

export default App;