// Plik: components/ui/GlassCard.tsx

import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

// Upewnij się, że ta definicja zawiera anchorColor
interface GlassProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  anchorColor?: string; // <-- To pole musi tu być!
}

export default function GlassCard({ children, style, intensity = 20, anchorColor }: GlassProps) {
  return (
    <View style={[styles.container, style, { 
      borderColor: anchorColor || COLORS.border, // Dynamiczne obramowanie
    }]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
      
      {/* Subtelne podświetlenie w kolorze kotwicy */}
      {anchorColor && <View style={[styles.anchorGlow, { backgroundColor: anchorColor }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(30,30,30,0.3)', 
  },
  content: {
    padding: 16,
    zIndex: 1,
  },
  anchorGlow: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    alignSelf: 'center',
    borderRadius: 5,
    opacity: 0.7,
  }
});