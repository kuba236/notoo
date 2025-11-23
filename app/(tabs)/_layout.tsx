

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

        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        
        tabBarActiveTintColor: COLORS.primary, 
        tabBarInactiveTintColor: COLORS.textSec, 
        tabBarShowLabel: false, 
        

        tabBarIconStyle: styles.iconStyle,
        tabBarActiveBackgroundColor: COLORS.card, 
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

  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 65, 
    borderRadius: 32, 
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 5,
    overflow: 'hidden',
  },

  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#202020',
    borderRadius: 32,
    opacity: 0.9,
    borderWidth: 1, 
    borderColor: '#333333', 
  },
  iconStyle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  }
});