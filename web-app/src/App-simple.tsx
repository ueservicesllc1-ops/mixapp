/**
 * App Simple - Versión simplificada para testing
 */

import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          🎵 MixerCurse Web App
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#888' }}>
          ¡La aplicación web está funcionando!
        </p>
        <p style={{ marginTop: '2rem', color: '#666' }}>
          Configura Firebase para ver la funcionalidad completa
        </p>
      </div>
    </div>
  );
}

export default App;
