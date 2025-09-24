/**
 * Dashboard - Main dashboard component
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Music, BarChart3, Settings } from 'lucide-react';
import Header from './Header';
import FileUpload from './FileUpload';
import SongLibrary from './SongLibrary';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'analytics'>('upload');

  const tabs = [
    { id: 'upload', label: 'Subir Canciones', icon: Upload },
    { id: 'library', label: 'Biblioteca', icon: Music },
    { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Subir Canciones</h2>
              <p className="text-dark-400">
                Sube tus archivos de audio multitrack para sincronizarlos con tu app móvil
              </p>
            </div>
            <FileUpload 
              userId={user?.uid || ''} 
              onUploadComplete={() => {
                // Refresh library if it's currently active
                console.log('Upload completed, refreshing library...');
              }}
            />
          </div>
        );
      
      case 'library':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Mi Biblioteca</h2>
              <p className="text-dark-400">
                Todas las canciones que has subido. Úsalas en tu app móvil para crear setlists.
              </p>
            </div>
            <SongLibrary userId={user?.uid || ''} />
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Estadísticas</h2>
              <p className="text-dark-400">
                Visualiza el uso de tu biblioteca de audio
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-600 p-3 rounded-lg">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-dark-400">Canciones totales</p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0 MB</p>
                    <p className="text-dark-400">Espacio usado</p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-dark-400">Setlists</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-dark-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-dark-400 hover:text-white hover:border-dark-600'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Dashboard;
