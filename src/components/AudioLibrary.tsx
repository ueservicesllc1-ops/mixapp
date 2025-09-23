/**
 * AudioLibrary - Component to manage user's audio library
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from './AuthProvider';
import audioLibraryService from '../services/audioLibraryService';

interface AudioTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadDate: any;
  ownerId: string;
  isPublic: boolean;
  tags: string[];
}

const AudioLibrary: React.FC = () => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserTracks();
    }
  }, [user]);

  const fetchUserTracks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userTracks = await audioLibraryService.getUserTracks(user.uid);
      setTracks(userTracks);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch tracks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    Alert.alert(
      'Delete Track',
      'Are you sure you want to delete this track?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await audioLibraryService.deleteTrack(trackId);
              fetchUserTracks();
              Alert.alert('Success', 'Track deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete track: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const filteredTracks = tracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access your audio library</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Library</Text>
        <Text style={styles.subtitle}>{tracks.length} tracks</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tracks..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tracks...</Text>
        </View>
      ) : filteredTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No tracks found matching your search' : 'No tracks in your library yet'}
          </Text>
        </View>
      ) : (
        <View style={styles.tracksList}>
          {filteredTracks.map((track) => (
            <View key={track.id} style={styles.trackItem}>
              <View style={styles.trackInfo}>
                <Text style={styles.trackName}>{track.name}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
                <View style={styles.trackDetails}>
                  <Text style={styles.trackDetail}>{track.bpm} BPM</Text>
                  <Text style={styles.trackDetail}>•</Text>
                  <Text style={styles.trackDetail}>{track.key}</Text>
                  <Text style={styles.trackDetail}>•</Text>
                  <Text style={styles.trackDetail}>{formatDuration(track.duration)}</Text>
                  <Text style={styles.trackDetail}>•</Text>
                  <Text style={styles.trackDetail}>{formatFileSize(track.fileSize)}</Text>
                </View>
                {track.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {track.tags.map((tag, index) => (
                      <Text key={index} style={styles.tag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.trackActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteTrack(track.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#888888',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
  tracksList: {
    gap: 15,
  },
  trackItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  trackDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackDetail: {
    color: '#00aaff',
    fontSize: 12,
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    backgroundColor: '#333333',
    color: '#ffffff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trackActions: {
    marginLeft: 15,
  },
  actionButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AudioLibrary;
