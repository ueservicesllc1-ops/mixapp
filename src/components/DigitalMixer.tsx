import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface DigitalMixerProps {
  isVisible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const DigitalMixer: React.FC<DigitalMixerProps> = ({ isVisible, onClose }) => {
  const [faderValues, setFaderValues] = useState({
    channel1: 50,
    channel2: 50,
    channel3: 50,
    channel4: 50,
    channel5: 50,
    channel6: 50,
    channel7: 50,
    channel8: 50,
    master: 75
  });

  const [knobValues, setKnobValues] = useState({
    low: 50,
    mid: 50,
    high: 50,
    reverb: 30,
    delay: 20,
    chorus: 10
  });

  const [buttonStates, setButtonStates] = useState({
    mute1: false,
    mute2: false,
    mute3: false,
    mute4: false,
    mute5: false,
    mute6: false,
    mute7: false,
    mute8: false,
    solo1: false,
    solo2: false,
    solo3: false,
    solo4: false,
    play: false,
    pause: false,
    stop: false,
    record: false
  });

  if (!isVisible) return null;

  const updateFader = (channel: string, value: number) => {
    setFaderValues(prev => ({ ...prev, [channel]: value }));
  };

  const updateKnob = (knob: string, value: number) => {
    setKnobValues(prev => ({ ...prev, [knob]: value }));
  };

  const toggleButton = (button: string) => {
    setButtonStates(prev => ({ ...prev, [button]: !prev[button] }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DIGITAL MIXER</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Main Mixer Surface */}
      <View style={styles.mixerSurface}>
        {/* Channel Strips */}
        <View style={styles.channelStrips}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(channel => (
            <View key={channel} style={styles.channelStrip}>
              {/* Channel Label */}
              <Text style={styles.channelLabel}>CH {channel}</Text>
              
              {/* EQ Knobs */}
              <View style={styles.eqSection}>
                <View style={styles.knobContainer}>
                  <View style={styles.knob}>
                    <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.low * 3.6 - 180}deg` }] }]} />
                  </View>
                  <Text style={styles.knobLabel}>LOW</Text>
                </View>
                <View style={styles.knobContainer}>
                  <View style={styles.knob}>
                    <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.mid * 3.6 - 180}deg` }] }]} />
                  </View>
                  <Text style={styles.knobLabel}>MID</Text>
                </View>
                <View style={styles.knobContainer}>
                  <View style={styles.knob}>
                    <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.high * 3.6 - 180}deg` }] }]} />
                  </View>
                  <Text style={styles.knobLabel}>HIGH</Text>
                </View>
              </View>

              {/* Fader */}
              <View style={styles.faderContainer}>
                <View style={styles.faderTrack}>
                  <View 
                    style={[
                      styles.faderKnob, 
                      { bottom: `${faderValues[`channel${channel}` as keyof typeof faderValues]}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.faderValue}>{faderValues[`channel${channel}` as keyof typeof faderValues]}</Text>
              </View>

              {/* Channel Buttons */}
              <View style={styles.channelButtons}>
                <TouchableOpacity 
                  style={[
                    styles.channelButton, 
                    buttonStates[`mute${channel}` as keyof typeof buttonStates] && styles.buttonActive
                  ]}
                  onPress={() => toggleButton(`mute${channel}`)}
                >
                  <Text style={styles.channelButtonText}>MUTE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.channelButton, 
                    buttonStates[`solo${channel}` as keyof typeof buttonStates] && styles.buttonActive
                  ]}
                  onPress={() => toggleButton(`solo${channel}`)}
                >
                  <Text style={styles.channelButtonText}>SOLO</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Master Section */}
        <View style={styles.masterSection}>
          <Text style={styles.masterLabel}>MASTER</Text>
          
          {/* Master Fader */}
          <View style={styles.masterFaderContainer}>
            <View style={styles.masterFaderTrack}>
              <View 
                style={[
                  styles.masterFaderKnob, 
                  { bottom: `${faderValues.master}%` }
                ]} 
              />
            </View>
            <Text style={styles.masterFaderValue}>{faderValues.master}</Text>
          </View>

          {/* Master Buttons */}
          <View style={styles.masterButtons}>
            <TouchableOpacity 
              style={[styles.masterButton, buttonStates.play && styles.buttonActive]}
              onPress={() => toggleButton('play')}
            >
              <Text style={styles.masterButtonText}>▶ PLAY</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.masterButton, buttonStates.pause && styles.buttonActive]}
              onPress={() => toggleButton('pause')}
            >
              <Text style={styles.masterButtonText}>⏸ PAUSE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.masterButton, buttonStates.stop && styles.buttonActive]}
              onPress={() => toggleButton('stop')}
            >
              <Text style={styles.masterButtonText}>⏹ STOP</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.masterButton, buttonStates.record && styles.buttonActive]}
              onPress={() => toggleButton('record')}
            >
              <Text style={styles.masterButtonText}>● REC</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Effects Section */}
        <View style={styles.effectsSection}>
          <Text style={styles.effectsLabel}>EFFECTS</Text>
          <View style={styles.effectsKnobs}>
            <View style={styles.effectKnob}>
              <View style={styles.knob}>
                <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.reverb * 3.6 - 180}deg` }] }]} />
              </View>
              <Text style={styles.effectLabel}>REVERB</Text>
            </View>
            <View style={styles.effectKnob}>
              <View style={styles.knob}>
                <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.delay * 3.6 - 180}deg` }] }]} />
              </View>
              <Text style={styles.effectLabel}>DELAY</Text>
            </View>
            <View style={styles.effectKnob}>
              <View style={styles.knob}>
                <View style={[styles.knobIndicator, { transform: [{ rotate: `${knobValues.chorus * 3.6 - 180}deg` }] }]} />
              </View>
              <Text style={styles.effectLabel}>CHORUS</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  closeButton: {
    backgroundColor: '#2a2a2a',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#444',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mixerSurface: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  channelStrips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  channelStrip: {
    alignItems: 'center',
    width: '11%',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  channelLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
  },
  eqSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  knobContainer: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  knob: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
  },
  knobIndicator: {
    width: 4,
    height: 15,
    backgroundColor: '#00ff00',
    position: 'absolute',
    top: 2,
  },
  knobLabel: {
    color: '#888',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 1,
  },
  faderContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  faderTrack: {
    width: 20,
    height: 120,
    backgroundColor: '#333',
    borderRadius: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  faderKnob: {
    width: 30,
    height: 20,
    backgroundColor: '#00ff00',
    borderRadius: 10,
    position: 'absolute',
    left: -5,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  faderValue: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  channelButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  channelButton: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonActive: {
    backgroundColor: '#00ff00',
    borderColor: '#fff',
  },
  channelButtonText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  masterSection: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#444',
  },
  masterLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  masterFaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  masterFaderTrack: {
    width: 30,
    height: 150,
    backgroundColor: '#333',
    borderRadius: 15,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#444',
  },
  masterFaderKnob: {
    width: 40,
    height: 25,
    backgroundColor: '#ff0000',
    borderRadius: 12,
    position: 'absolute',
    left: -5,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  masterFaderValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  masterButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  masterButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  masterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  effectsSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  effectsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
    textAlign: 'center',
  },
  effectsKnobs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  effectKnob: {
    alignItems: 'center',
  },
  effectLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
});

export default DigitalMixer;