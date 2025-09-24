/**
 * SetlistManager - Component for creating and managing setlists
 */

import React, { useState } from 'react';
import { Plus, Music, Save, X } from 'lucide-react';
import firestoreService from '../services/firestoreService';

interface SetlistManagerProps {
  userId: string;
  onSetlistCreated?: (setlistId: string) => void;
}

interface SetlistFormData {
  name: string;
  description: string;
}

const SetlistManager: React.FC<SetlistManagerProps> = ({ userId, onSetlistCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<SetlistFormData>({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const setlistId = await firestoreService.createSetlist({
        name: formData.name.trim(),
        ownerId: userId,
        songs: []
      });

      console.log('Setlist created:', setlistId);
      
      // Reset form
      setFormData({ name: '', description: '' });
      setIsCreating(false);
      
      // Notify parent
      if (onSetlistCreated) {
        onSetlistCreated(setlistId);
      }
      
    } catch (error) {
      console.error('Error creating setlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCreating) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Gestionar Setlists</h3>
            <p className="text-dark-400">Crea un nuevo setlist para organizar tus canciones</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Setlist</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Crear Nuevo Setlist</h3>
        <button
          onClick={() => setIsCreating(false)}
          className="text-dark-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleCreateSetlist} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nombre del Setlist *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Mi Setlist de Rock"
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descripción del setlist..."
            rows={3}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Creando...' : 'Crear Setlist'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="bg-dark-600 hover:bg-dark-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetlistManager;
