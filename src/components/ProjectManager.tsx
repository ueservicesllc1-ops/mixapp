/**
 * ProjectManager - Component to manage projects and setlists
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from './AuthProvider';
import firestoreService, { Project, Setlist } from '../services/firestoreService';

interface ProjectManagerProps {
  onProjectSelect?: (project: Project) => void;
  onSetlistSelect?: (setlist: Setlist) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onProjectSelect, onSetlistSelect }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewSetlistModal, setShowNewSetlistModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newSetlistName, setNewSetlistName] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const userProjects = await firestoreService.getUserProjects(user.uid);
      const userSetlists = await firestoreService.getUserSetlists(user.uid);
      
      setProjects(userProjects);
      setSetlists(userSetlists);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const createNewProject = async () => {
    if (!user || !newProjectName.trim()) return;

    try {
      const defaultTracks: Array<{ id: string; name: string; volume: number; muted: boolean; solo: boolean; color: string }> = [];

      const projectData = {
        name: newProjectName,
        description: 'Nuevo proyecto de audio',
        ownerId: user.uid,
        tracks: defaultTracks,
        bpm: 120,
        key: 'C',
      };

      const projectId = await firestoreService.createProject(projectData);
      Alert.alert('Éxito', 'Proyecto creado correctamente');
      
      setNewProjectName('');
      setShowNewProjectModal(false);
      loadUserData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el proyecto');
    }
  };

  const createNewSetlist = async () => {
    if (!user || !newSetlistName.trim()) return;

    try {
      const defaultSongs: Array<{ id: string; title: string; artist: string; key: string; bpm: number; order: number }> = [];

      const setlistData = {
        name: newSetlistName,
        ownerId: user.uid,
        songs: defaultSongs,
      };

      const setlistId = await firestoreService.createSetlist(setlistData);
      Alert.alert('Éxito', 'Setlist creado correctamente');
      
      setNewSetlistName('');
      setShowNewSetlistModal(false);
      loadUserData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el setlist');
    }
  };

  const saveCurrentProject = async (projectData: Partial<Project>) => {
    if (!user) return;

    try {
      // This would be called from the main DAW interface
      // to save the current state
      const projectId = await firestoreService.createProject({
        name: `Proyecto ${new Date().toLocaleDateString()}`,
        ownerId: user.uid,
        tracks: projectData.tracks || [],
        bpm: projectData.bpm || 120,
        key: projectData.key || 'C',
      });

      Alert.alert('Éxito', 'Proyecto guardado en Firestore');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el proyecto');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Proyectos</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewProjectModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.item}
            onPress={() => onProjectSelect?.(project)}
          >
            <Text style={styles.itemTitle}>{project.name}</Text>
            <Text style={styles.itemSubtitle}>
              {project.tracks.length} pistas • {project.bpm} BPM • {project.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Setlists</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewSetlistModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {setlists.map((setlist) => (
          <TouchableOpacity
            key={setlist.id}
            style={styles.item}
            onPress={() => onSetlistSelect?.(setlist)}
          >
            <Text style={styles.itemTitle}>{setlist.name}</Text>
            <Text style={styles.itemSubtitle}>
              {setlist.songs.length} canciones
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* New Project Modal */}
      <Modal
        visible={showNewProjectModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Proyecto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del proyecto"
              placeholderTextColor="#888"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNewProjectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createNewProject}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Setlist Modal */}
      <Modal
        visible={showNewSetlistModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Setlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del setlist"
              placeholderTextColor="#888"
              value={newSetlistName}
              onChangeText={setNewSetlistName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNewSetlistModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createNewSetlist}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ProjectManager;
