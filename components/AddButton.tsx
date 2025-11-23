// components/AddButton.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';

export default function AddButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
      <Text style={styles.plus}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    width: 40,
    height:40,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    borderWidth:1,
    borderColor:COLORS.accent,
    borderStyle:"dashed",
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  plus: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '600',
  },
});
