import React from 'react';
import { Bus, MapPin, Route, Bell } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'terminals', label: 'Terminals', icon: MapPin },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-pink-600 to-pink-700 text-white z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">Bus Tracker Admin</h1>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-20 shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};