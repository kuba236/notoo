// app/(tabs)/_layout.tsx

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        // Tło: Pusta View bez BlurView, stylizujemy to w tabBarStyle i tabBarBackground
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        
        tabBarActiveTintColor: COLORS.primary, // Czysty, wyraźny kolor akcentu
        tabBarInactiveTintColor: COLORS.textSec, // Szary, subtelny kolor
        tabBarShowLabel: false, 
        
        // Styl dla Aktywnego Elementu: Subtelne podświetlenie tła
        tabBarIconStyle: styles.iconStyle,
        tabBarActiveBackgroundColor: COLORS.card, // Użyj koloru karty jako dyskretnego tła dla aktywnej ikony
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
          title: 'Deck'
        }} 
      />
      <Tabs.Screen 
        name="library" 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="albums-outline" size={24} color={color} />,
          title: 'Library'
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Pasek Nawigacji (Kontener zewnętrzny)
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 65, // Standardowa wysokość
    borderRadius: 32, // Zaokrąglone rogi (kształt pigułki)
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 5, // Lekki cień, aby unosił się nad tłem
    overflow: 'hidden',
  },
  // Tło Paska (Symulacja czystego, iOS-owego tła bez BlurView)
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    // Używamy koloru zbliżonego do tła, ale z lekką jasnością, 
    // aby nadać mu "szklisty" wygląd na ciemnym motywie
    backgroundColor: '#202020', // Bardzo ciemny szary (lekko jaśniejszy niż tło główne)
    borderRadius: 32,
    opacity: 0.9, // Dodajemy minimalną przezroczystość
    
    // Dodajemy delikatny obrys, aby był bardziej widoczny
    borderWidth: 1, 
    borderColor: '#333333', 
  },
  iconStyle: {
    // Rozciągamy, by tło tabBarActiveBackgroundColor działało
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  }
});