import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BusesTab } from './components/BusesTab';
import { TerminalsTab } from './components/TerminalsTab';
import { RoutesTab } from './components/RoutesTab';
import { NotificationsTab } from './components/NotificationsTab';

function App() {
  const [activeTab, setActiveTab] = useState('buses');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'buses':
        return <BusesTab />;
      case 'terminals':
        return <TerminalsTab />;
      case 'routes':
        return <RoutesTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return <BusesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="ml-64 min-h-screen">
        <header className="bg-white shadow-sm border-b border-pink-100">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {activeTab} Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your bus tracking system with ease
            </p>
          </div>
        </header>
        
        <main className="p-8">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default App;