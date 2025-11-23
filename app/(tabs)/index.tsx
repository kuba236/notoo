import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '../../constants/colors';
import { useNotes } from '../../context/NotesContext';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { notes } = useNotes();
  const router = useRouter();

  const recentNotes = notes.slice(0, 3);
  const images = notes.filter(n => n.type === 'image' || n.type === 'mixed').slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>notoo</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity onPress={() => router.push('/add' as Href)} style={{ flex: 1 }}>
          <LinearGradient
            colors={[COLORS.primary, '#2E5CFF']}
            start={{x:0, y:0}} end={{x:1, y:1}}
            style={styles.bigButton}
          >
            <Ionicons name="add-circle" size={32} color="#FFF" />
            <Text style={styles.btnText}>Create New</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <GlassCard style={styles.statCard}>
          <Text style={styles.statNumber}>{notes.length}</Text>
          <Text style={styles.statLabel}>created notes</Text>
        </GlassCard>
      </View>

      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Recall</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {images.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => router.push(`/note/${item.id}` as Href)}>
                <Image source={{ uri: item.content }} style={styles.scrollImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Stream</Text>
        {recentNotes.map((note) => (
          <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}` as Href)}>
            <GlassCard style={styles.noteCard} anchorColor={note.anchor.color}>
               <View style={styles.noteHeader}>
                  <Text style={[styles.noteDate, { color: note.anchor.color }]}>
                    {note.anchor.emoji} {new Date(note.createdAt).toLocaleDateString()}
                  </Text>
                  {note.folder && (
                    <View style={[styles.badge, { backgroundColor: note.anchor.color + '30' }]}>
                      <Text style={[styles.badgeText, { color: note.anchor.color }]}>{note.folder}</Text>
                    </View>
                  )}
               </View>
               <Text style={styles.notePreview} numberOfLines={2}>
                 {note.type === 'text' ? note.content : note.textContent || 'Image Note'}
               </Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 70, paddingHorizontal: 20, marginBottom: 20 },
  greeting: { color: COLORS.textSec, fontSize: 16,fontFamily:"PlayWriteCZ"},
  username: { color: COLORS.text, fontSize: 34, fontFamily: 'Geo' }, 
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 30 },
  bigButton: { 
    borderRadius: 24, padding: 20, height: 120, justifyContent: 'space-between' 
  },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  statCard: { width: 100, height: 120, justifyContent: 'center', alignItems: 'center' },
  statNumber: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: COLORS.textSec, fontSize: 12, textAlign: 'center' },
  section: { marginBottom: 30, paddingHorizontal: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '600',marginBottom:10 },
  scrollImage: { width: 140, height: 180, borderRadius: 16, marginRight: 12, backgroundColor: '#222' },
  noteCard: { marginBottom: 12, padding: 16 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noteDate: { fontSize: 12 },
  badge: { paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  notePreview: { color: COLORS.text, fontSize: 16, lineHeight: 22 },
});