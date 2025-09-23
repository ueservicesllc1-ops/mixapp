/**
 * MainScreen - Professional DAW Interface
 * 
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('02:03');
  const [totalTime, setTotalTime] = useState('04:00');
  const [bpm, setBpm] = useState(128);
  const [key, setKey] = useState('C');
  const [selectedTrack, setSelectedTrack] = useState(0);

  const tracks = [
    { name: 'Clicks', muted: true, solo: false, volume: 0 },
    { name: 'Cues', muted: true, solo: false, volume: 0 },
    { name: 'Drums 1', muted: false, solo: false, volume: 0.8 },
    { name: 'Drums 2', muted: false, solo: false, volume: 0.6 },
    { name: 'Warm pad', muted: false, solo: false, volume: 0.4 },
    { name: 'Guitar 1', muted: false, solo: false, volume: 0.7 },
    { name: 'Vocals 1', muted: false, solo: false, volume: 0.9 },
    { name: 'Vocals 2', muted: false, solo: false, volume: 0.5 },
    { name: 'Vocals 3', muted: false, solo: false, volume: 0.3 },
    { name: 'Synthesizer 1', muted: false, solo: false, volume: 0.6 },
    { name: 'Synthesizer 2', muted: false, solo: false, volume: 0.4 },
    { name: 'Bass guitar 1', muted: false, solo: false, volume: 0.8 },
    { name: 'Guitar 2', muted: false, solo: false, volume: 0.5 },
    { name: 'Guitar 3', muted: false, solo: false, volume: 0.3 },
    { name: 'Bass guitar 2', muted: false, solo: false, volume: 0.7 },
    { name: 'Back vocals 1', muted: false, solo: false, volume: 0.4 },
    { name: 'Violin 1', muted: false, solo: false, volume: 0.6 },
    { name: 'Violin 2', muted: false, solo: false, volume: 0.3 },
  ];

  const setlistSongs = [
    { id: 3, title: 'I speak Jesus', artist: 'Original version', key: 'E', bpm: 74 },
    { id: 4, title: 'I Thank God', artist: 'Elevation Worship', key: 'A', bpm: 128 },
    { id: 5, title: 'Praise', artist: 'Elevation Worship', key: 'Ab', bpm: 127, selected: true },
    { id: 6, title: 'Song Title', artist: 'Artist', key: 'C', bpm: 120 },
    { id: 7, title: 'Another Song', artist: 'Artist', key: 'B', bpm: 72 },
    { id: 8, title: 'Final Song', artist: 'Artist', key: 'F', bpm: 102 },
  ];

  const musicalKeys = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'B', 'C', 'D', 'E', 'F', 'G', 'A'];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (index: number) => {
    // Toggle mute logic here
  };

  const toggleSolo = (index: number) => {
    // Toggle solo logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.masterButton}>
            <Text style={styles.masterButtonText}>MASTER</Text>
            <View style={styles.masterIndicator} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <TouchableOpacity style={[styles.controlButton, styles.rewindButton]}>
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playButton, isPlaying && styles.playButtonActive]} onPress={handlePlayPause}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.stopButton]}>
            <Text style={styles.controlIcon}>⏹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.forwardButton]}>
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.loopButton]}>
            <Text style={styles.controlIcon}>⟲</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.shuffleButton]}>
            <Text style={styles.controlIcon}>⇄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeDisplay}>{currentTime} / {totalTime}</Text>
          <Text style={styles.bpmDisplay}>{bpm} BPM</Text>
          <Text style={styles.keyDisplay}>{key}</Text>
          <TouchableOpacity style={styles.midiButton}>
            <Text style={styles.midiText}>MIDI IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.midiButton}>
            <Text style={styles.midiText}>OUTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Tracks Section */}
        <View style={styles.tracksSection}>
          {/* Simple Display Section */}
          <View style={styles.simpleDisplaySection}>
            <View style={styles.simpleDisplay}>
              {/* Song Info */}
              <View style={styles.songInfoSection}>
                <View style={styles.albumArtContainer}>
                  <View style={styles.albumArt}>
                    <Text style={styles.albumArtText}>🎵</Text>
                  </View>
                </View>
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>Praise</Text>
                  <Text style={styles.songArtist}>Elevation Worship</Text>
                  <Text style={styles.songBpm}>{bpm} BPM</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '50%' }]} />
                  <View style={styles.progressThumb} />
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>{currentTime}</Text>
                  <Text style={styles.timeText}>{totalTime}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.tracksGrid}>
            {tracks.map((track, index) => (
              <View key={index} style={styles.trackContainer}>
                <Text style={styles.trackName}>{track.name}</Text>
                <View style={styles.professionalFaderContainer}>
                  {/* dB Scale */}
                  <View style={styles.dbScale}>
                    <Text style={styles.dbText}>+6</Text>
                    <Text style={styles.dbText}>+3</Text>
                    <Text style={styles.dbText}>0</Text>
                    <Text style={styles.dbText}>-3</Text>
                    <Text style={styles.dbText}>-6</Text>
                    <Text style={styles.dbText}>-12</Text>
                    <Text style={styles.dbText}>-∞</Text>
                  </View>
                  
                  {/* Fader Track */}
                  <View style={styles.faderTrack}>
                    <View style={styles.faderTrackLine} />
                    
                    {/* Fader Thumb */}
                    <View style={[styles.faderThumb, { 
                      bottom: `${(track.volume * 100)}%`,
                      backgroundColor: track.muted ? '#666' : '#4CAF50'
                    }]}>
                      {/* Blue indicator light */}
                      <View style={[styles.indicatorLight, { 
                        backgroundColor: track.muted ? '#333' : '#00aaff' 
                      }]} />
                    </View>
                  </View>
                  
                  {/* Current dB Value */}
                  <View style={styles.dbValueContainer}>
                    <Text style={styles.dbValue}>
                      {track.muted ? '-∞' : `${Math.round((track.volume - 0.5) * 24)}dB`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.trackControls}>
                  <TouchableOpacity 
                    style={[styles.trackButton, track.muted && styles.mutedButton]}
                    onPress={() => toggleMute(index)}
                  >
                    <Text style={styles.trackButtonText}>M</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.trackButton, track.solo && styles.soloButton]}
                    onPress={() => toggleSolo(index)}
                  >
                    <Text style={styles.trackButtonText}>S</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Right Panel */}
        <View style={styles.rightPanel}>
          {/* Setlist */}
          <View style={styles.setlistSection}>
            <View style={styles.setlistHeader}>
              <TouchableOpacity style={styles.setlistButton}>
                <Text style={styles.setlistButtonText}>Setlists</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.setlistButton, styles.syncButton]}>
                <Text style={styles.syncButtonText}>Sync</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.setlistTitle}>Sunday Setlist 20 March</Text>
            <ScrollView style={styles.setlistContainer}>
              {setlistSongs.map((song) => (
                <TouchableOpacity 
                  key={song.id} 
                  style={[styles.songItem, song.selected && styles.selectedSong]}
                >
                  <View style={styles.songInfo}>
                    <Text style={styles.songNumber}>{song.id}</Text>
                    <View style={styles.songDetails}>
                      <Text style={styles.songTitle}>{song.title}</Text>
                      <Text style={styles.songArtist}>{song.artist}</Text>
                    </View>
                    <Text style={styles.songMenu}>⋯</Text>
                  </View>
                  <View style={styles.songMeta}>
                    <Text style={styles.songKey}>{song.key}</Text>
                    <Text style={styles.songBpm}>{song.bpm}</Text>
                    <Text style={styles.songPlay}>▶️</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Library Section */}
          <View style={styles.librarySection}>
            <View style={styles.libraryHeader}>
              <Text style={styles.libraryTitle}>+ Library</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit setlist</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.libraryItem}>
              <Text style={styles.libraryIcon}>🎵</Text>
              <View style={styles.libraryInfo}>
                <Text style={styles.libraryName}>Fundamental Ambient Pad</Text>
                <Text style={styles.librarySource}>Loopcommunity.com</Text>
              </View>
            </View>
            
            {/* Key Selector */}
            <View style={styles.keySelector}>
              {musicalKeys.map((keyName) => (
                <TouchableOpacity 
                  key={keyName} 
                  style={[styles.keyButton, keyName === key && styles.selectedKey]}
                  onPress={() => setKey(keyName)}
                >
                  <Text style={styles.keyButtonText}>{keyName}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Library Volume */}
            <View style={styles.libraryVolume}>
              <View style={styles.libraryFaderContainer}>
                <View style={[styles.libraryFader, { height: 60 }]} />
              </View>
              <View style={styles.libraryControls}>
                <TouchableOpacity style={styles.libraryButton}>
                  <Text style={styles.libraryButtonText}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.libraryButton}>
                  <Text style={styles.libraryButtonText}>S</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flex: 1,
  },
  masterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  masterButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 8,
    marginRight: 4,
  },
  masterIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  controlButton: {
    marginHorizontal: 6,
    width: 40,
    height: 40,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    // Efecto metal pulido aluminio
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    // Gradiente simulado con múltiples bordes
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  playButton: {
    marginHorizontal: 8,
    width: 50,
    height: 50,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
    // Efecto metal pulido aluminio con LED verde
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    // Gradiente simulado con múltiples bordes
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  controlIcon: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  playIcon: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timeDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  bpmDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  keyDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  midiButton: {
    backgroundColor: '#333',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 2,
  },
  midiText: {
    color: '#fff',
    fontSize: 6,
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 12,
    color: '#fff',
  },
  // LED Button Styles - Metal pulido con LED
  playButtonActive: {
    borderColor: '#00ff00',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#00ff00',
    shadowOpacity: 1,
    shadowRadius: 15,
    backgroundColor: '#F0F8F0',
  },
  stopButton: {
    borderColor: '#ff0000',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff0000',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    backgroundColor: '#F8F0F0',
  },
  rewindButton: {
    borderColor: '#ff8800',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff8800',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F8F4F0',
  },
  forwardButton: {
    borderColor: '#ff8800',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff8800',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F8F4F0',
  },
  loopButton: {
    borderColor: '#0088ff',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#0088ff',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  shuffleButton: {
    borderColor: '#8800ff',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#8800ff',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F4F0F8',
  },
  simpleDisplaySection: {
    backgroundColor: '#0a0a0a',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  simpleDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  songInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  albumArtContainer: {
    marginRight: 15,
  },
  albumArt: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  albumArtText: {
    fontSize: 24,
    color: '#888',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songArtist: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  songBpm: {
    color: '#00aaff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    top: -3,
    left: '50%',
    transform: [{ translateX: -6 }],
    borderWidth: 2,
    borderColor: '#00aaff',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  advancedDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerText: {
    color: '#00aaff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subHeaderText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerValue: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  headerLabel: {
    color: '#888',
    fontSize: 10,
  },
  graphSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  graphContainer: {
    flex: 2,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  graphLabel: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  graphArea: {
    height: 60,
    backgroundColor: '#000',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 6,
  },
  waveformLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00aaff',
    width: '100%',
    top: '50%',
    borderRadius: 1,
  },
  waveformLine2: {
    backgroundColor: '#ff8800',
    top: '30%',
    width: '80%',
  },
  waveformLine3: {
    backgroundColor: '#00ff00',
    top: '70%',
    width: '60%',
  },
  graphControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  graphButton: {
    backgroundColor: '#00aaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  graphButtonText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  graphPercentage: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlSection: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlValue: {
    color: '#ff8800',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  playButton: {
    backgroundColor: '#00ff00',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: {
    fontSize: 12,
    color: '#000',
  },
  controlText: {
    color: '#888',
    fontSize: 8,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    marginRight: 4,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  controlLabel: {
    color: '#888',
    fontSize: 8,
    marginLeft: 8,
  },
  bottomGraphSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bottomGraph: {
    flex: 2,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  bottomGraphLabel: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  spectrumArea: {
    height: 40,
    backgroundColor: '#000',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  spectrumBar: {
    width: 6,
    backgroundColor: '#00ff00',
    borderRadius: 1,
  },
  spectrumLabel: {
    color: '#888',
    fontSize: 8,
  },
  sliderSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: 4,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#00aaff',
    borderRadius: 4,
    left: -2,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 8,
  },
  bottomControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bottomButton: {
    backgroundColor: '#00aaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 2,
  },
  bottomButtonText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  tracksSection: {
    flex: 2,
    padding: 15,
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackContainer: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  professionalFaderContainer: {
    height: 120,
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dbScale: {
    height: '100%',
    width: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  dbText: {
    color: '#888',
    fontSize: 8,
    fontWeight: 'bold',
  },
  faderTrack: {
    height: '100%',
    width: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    position: 'relative',
    marginHorizontal: 4,
  },
  faderTrackLine: {
    position: 'absolute',
    left: 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#444',
    borderRadius: 1,
  },
  faderThumb: {
    position: 'absolute',
    width: 12,
    height: 16,
    borderRadius: 6,
    left: -4,
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorLight: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#00aaff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  dbValueContainer: {
    height: '100%',
    width: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dbValue: {
    color: '#00aaff',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    transform: [{ rotate: '-90deg' }],
  },
  trackControls: {
    flexDirection: 'row',
  },
  trackButton: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  mutedButton: {
    backgroundColor: '#f44336',
  },
  soloButton: {
    backgroundColor: '#ff9800',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
  },
  setlistSection: {
    marginBottom: 20,
  },
  setlistHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  setlistButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#333',
    borderRadius: 4,
    marginRight: 10,
  },
  setlistButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  setlistTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setlistContainer: {
    maxHeight: 200,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  selectedSong: {
    backgroundColor: '#2196F3',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songNumber: {
    color: '#888',
    fontSize: 12,
    marginRight: 10,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#888',
    fontSize: 10,
  },
  songMenu: {
    color: '#888',
    fontSize: 16,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songKey: {
    color: '#fff',
    fontSize: 10,
    marginRight: 10,
  },
  songBpm: {
    color: '#fff',
    fontSize: 10,
    marginRight: 10,
  },
  songPlay: {
    fontSize: 12,
  },
  librarySection: {
    flex: 1,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  libraryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  libraryIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#fff',
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  librarySource: {
    color: '#888',
    fontSize: 10,
  },
  keySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  keyButton: {
    width: '16%',
    aspectRatio: 1,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  selectedKey: {
    backgroundColor: '#4CAF50',
  },
  keyButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  libraryVolume: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  libraryFaderContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  libraryFader: {
    backgroundColor: '#87CEEB',
    width: '100%',
    borderRadius: 10,
  },
  libraryControls: {
    flexDirection: 'row',
  },
  libraryButton: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  libraryButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MainScreen;