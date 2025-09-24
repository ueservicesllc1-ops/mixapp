/**
 * DatabaseStatusIndicator - Componente para mostrar el estado de conexión de las bases de datos
 * 
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface DatabaseStatusIndicatorProps {
  isConnected: boolean;
  databaseName: 'Firestore' | 'B2';
  size?: 'small' | 'medium' | 'large';
}

const DatabaseStatusIndicator: React.FC<DatabaseStatusIndicatorProps> = ({
  isConnected,
  databaseName,
  size = 'medium'
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isConnected) {
      // Animación de pulso para indicar conexión activa
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isConnected, pulseAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          indicator: styles.indicatorSmall,
          text: styles.textSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          indicator: styles.indicatorLarge,
          text: styles.textLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          indicator: styles.indicatorMedium,
          text: styles.textMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.wrapper, sizeStyles.container]}>
      <Animated.View
        style={[
          styles.indicator,
          sizeStyles.indicator,
          {
            backgroundColor: isConnected ? '#2196F3' : '#666666',
            transform: [{ scale: isConnected ? pulseAnim : 1 }],
          },
        ]}
      >
        {/* Efecto de brillo interno */}
        <View
          style={[
            styles.innerGlow,
            {
              backgroundColor: isConnected ? '#42A5F5' : '#888888',
            },
          ]}
        />
        {/* Punto central */}
        <View
          style={[
            styles.centerDot,
            {
              backgroundColor: isConnected ? '#1976D2' : '#444444',
            },
          ]}
        />
      </Animated.View>
      <Text style={[styles.label, sizeStyles.text]}>
        {databaseName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    marginHorizontal: 2,
  },
  indicator: {
    borderRadius: 6,
    marginRight: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  innerGlow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 5,
    opacity: 0.6,
  },
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -1 }, { translateY: -1 }],
    borderRadius: 1,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Tamaños pequeños
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  indicatorSmall: {
    width: 8,
    height: 8,
  },
  textSmall: {
    fontSize: 8,
  },
  // Tamaños medianos
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  indicatorMedium: {
    width: 10,
    height: 10,
  },
  textMedium: {
    fontSize: 10,
  },
  // Tamaños grandes
  containerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  indicatorLarge: {
    width: 12,
    height: 12,
  },
  textLarge: {
    fontSize: 12,
  },
});

export default DatabaseStatusIndicator;
