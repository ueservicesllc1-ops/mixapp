// Correcciones para problemas de audio en MainScreen.tsx

// 1. CORREGIR toggleTrackPlay - Problema: botón play se queda en pausa
// Reemplazar líneas 397-430 con:

const toggleTrackPlay = (trackIndex: number) => {
  console.log(`Toggle play para track ${trackIndex}`);
  
  setTracks(prevTracks => {
    const newTracks = [...prevTracks];
    const track = newTracks[trackIndex];
    
    if (!track) return prevTracks;
    
    // CORRECCIÓN: Crear nuevo objeto en lugar de modificar directamente
    newTracks[trackIndex] = {
      ...track,
      playing: !track.playing
    };
    
    if (newTracks[trackIndex].playing) {
      console.log(`🎵 Reproduciendo track: ${track.name}`);
      console.log(`📁 Archivo: ${track.audioFile}`);
      console.log(`🔊 Volumen: ${Math.round(track.volume * 100)}%`);
      // Simular reproducción de audio (sin Alert.alert)
    } else {
      console.log(`⏸ Pausando track: ${track.name}`);
    }
    
    return newTracks;
  });
};

// 2. AGREGAR estados para barra de progreso
// Agregar después de los otros useState:

const [progress, setProgress] = useState(0);
const [duration, setDuration] = useState(0);
const [isLoading, setIsLoading] = useState(false);

// 3. CORREGIR handlePlayPause - Problema: control maestro
// Reemplazar líneas 122-145 con:

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

// 4. AGREGAR función para barra de progreso
// Agregar después de handlePlayPause:

const updateProgress = () => {
  if (isPlaying && progress < duration) {
    setProgress(prev => prev + 1);
  }
};

// 5. AGREGAR useEffect para barra de progreso
// Agregar después de los otros useEffect:

useEffect(() => {
  let interval: NodeJS.Timeout;
  if (isPlaying) {
    interval = setInterval(updateProgress, 1000); // Actualizar cada segundo
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [isPlaying, progress, duration]);

// 6. AGREGAR función para reproducir audio real
// Agregar después de updateProgress:

const playAudio = async (audioFile: string, volume: number) => {
  try {
    console.log(`🎵 Intentando reproducir: ${audioFile}`);
    // Aquí implementarías la reproducción real con react-native-sound
    // Por ahora solo simulamos
    return true;
  } catch (error) {
    console.error('Error reproduciendo audio:', error);
    return false;
  }
};

