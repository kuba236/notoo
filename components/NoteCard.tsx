// components/NoteCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import type { Note } from '../types/Note';
import { COLORS } from '../constants/colors';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

export default function NoteCard({ note }: { note: Note }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={[styles.container]}
      onPress={() => router.push({ pathname: '/view/[id]', params: { id: note.id } })}
    >
      {note.type === 'text' && (
        <View style={styles.textWrap}>
          <Text style={styles.text}>{note.content}</Text>
          <Text style={styles.date}>{new Date(note.createdAt).toLocaleString()}</Text>
        </View>
      )}

      {note.type === 'image' && (
        <Image source={{ uri: note.content }} style={styles.image} resizeMode="cover" />
      )}

      {note.type === 'audio' && (
        <View style={styles.textWrap}>
          <Text style={styles.text}>🎤 Audio note</Text>
          <Text style={styles.date}>{new Date(note.createdAt).toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    width: '90%',
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 14,
  },
  text: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 28,
  },
  date: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
