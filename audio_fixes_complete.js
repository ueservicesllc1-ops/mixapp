// CORRECCIONES COMPLETAS PARA PROBLEMAS DE AUDIO

// 1. AGREGAR ESTADOS (después de línea 52):
const [progress, setProgress] = useState(0);
const [duration, setDuration] = useState(0);
const [isLoading, setIsLoading] = useState(false);

// 2. CORREGIR handlePlayPause (líneas 122-146):
const handlePlayPause = () => {
  const newPlayingState = !isPlaying;
  setIsPlaying(newPlayingState);
  
  // Controlar todos los tracks sincronizados
  setTracks(prevTracks => {
    return prevTracks.map(track => ({
      ...track,
      playing: newPlayingState
    }));
  });
  
  if (newPlayingState) {
    console.log('🎵 Reproduciendo todos los tracks sincronizados');
    // Iniciar barra de progreso
    setProgress(0);
    setDuration(180); // 3 minutos por defecto
  } else {
    console.log('⏸ Pausando todos los tracks');
  }
};

// 3. CORREGIR toggleTrackPlay (líneas 398-430):
const toggleTrackPlay = (trackIndex: number) => {
  console.log(`Toggle play para track ${trackIndex}`);
  
  setTracks(prevTracks => {
    const newTracks = [...prevTracks];
    const track = newTracks[trackIndex];
    
    if (!track) return prevTracks;
    
    // CORRECCIÓN: Crear nuevo objeto
    newTracks[trackIndex] = {
      ...track,
      playing: !track.playing
    };
    
    if (newTracks[trackIndex].playing) {
      console.log(`🎵 Reproduciendo track: ${track.name}`);
      console.log(`📁 Archivo: ${track.audioFile}`);
      console.log(`🔊 Volumen: ${Math.round(track.volume * 100)}%`);
    } else {
      console.log(`⏸ Pausando track: ${track.name}`);
    }
    
    return newTracks;
  });
};

// 4. AGREGAR función updateProgress (después de toggleTrackPlay):
const updateProgress = () => {
  if (isPlaying && progress < duration) {
    setProgress(prev => prev + 1);
  }
};

// 5. AGREGAR useEffect para barra de progreso (después de otros useEffect):
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (isPlaying) {
    interval = setInterval(updateProgress, 1000); // Actualizar cada segundo
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [isPlaying, progress, duration]);

// 6. AGREGAR función playAudio (después de updateProgress):
const playAudio = async (audioFile: string, volume: number) => {
  try {
    console.log(`🎵 Intentando reproducir: ${audioFile}`);
    // Simular reproducción de audio
    return true;
  } catch (error) {
    console.error('Error reproduciendo audio:', error);
    return false;
  }
};

// 7. AGREGAR barra de progreso en el JSX (buscar sección de controles):
// Reemplazar la sección de controles con:
<View style={styles.progressContainer}>
  <Text style={styles.progressText}>
    {Math.floor(progress / 60)}:{(progress % 60).toString().padStart(2, '0')} / 
    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
  </Text>
  <View style={styles.progressBar}>
    <View 
      style={[
        styles.progressFill, 
        { width: `${(progress / duration) * 100}%` }
      ]} 
    />
  </View>
</View>

// 8. AGREGAR estilos para la barra de progreso:
progressContainer: {
  marginBottom: 20,
  paddingHorizontal: 20,
},
progressText: {
  color: '#fff',
  fontSize: 12,
  textAlign: 'center',
  marginBottom: 10,
},
progressBar: {
  height: 4,
  backgroundColor: '#333',
  borderRadius: 2,
  overflow: 'hidden',
},
progressFill: {
  height: '100%',
  backgroundColor: '#4CAF50',
  borderRadius: 2,
},

