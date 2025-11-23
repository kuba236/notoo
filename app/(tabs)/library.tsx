import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '../../constants/colors';
import { useNotes } from '../../context/NotesContext';
import { Note } from '../../types/Note';

const { width } = Dimensions.get('window');

// --- KOMPONENT: MODAL ZARZĄDZANIA FOLDERAMI ---
interface FolderModalProps {
    visible: boolean;
    onClose: () => void;
    folders: string[];
    addFolder: (name: string) => Promise<boolean>;
    deleteFolder: (name: string) => Promise<boolean>;
}

const FolderManagementModal: React.FC<FolderModalProps> = ({ visible, onClose, folders, addFolder, deleteFolder }) => {
    const [newFolderName, setNewFolderName] = useState('');
    const protectedFolders = ['Niemiecki', 'Angielski', 'Study']; // Domyślne foldery

    const handleAddFolder = async () => {
        if (!newFolderName.trim()) return;
        
        const success = await addFolder(newFolderName.trim());
        if (success) {
            setNewFolderName('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Alert.alert("Błąd", "Folder o tej nazwie już istnieje lub nazwa jest nieprawidłowa.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleDeleteFolder = async (name: string) => {
        if (protectedFolders.includes(name)) {
            Alert.alert("Błąd", `Folder "${name}" jest chroniony i nie może zostać usunięty.`);
            return;
        }

        Alert.alert(
            "Usuń Folder",
            `Czy na pewno chcesz usunąć folder "${name}"? Notatki z tego folderu zostaną przeniesione do "Study".`,
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Usuń",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteFolder(name);
                        if (success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }
                }
            ]
        );
    };

    const sortableFolders = folders
        .filter(f => !protectedFolders.includes(f))
        .sort((a, b) => a.localeCompare(b));

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <BlurView tint="dark" intensity={90} style={StyleSheet.absoluteFill} />
                <GlassCard style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Folder Management 🗂️</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Dodawanie folderu */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>➕ Add New Folder</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                placeholder="Folder Name (e.g. History)"
                                placeholderTextColor={COLORS.textSec}
                                style={styles.modalInput}
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                            />
                            <TouchableOpacity onPress={handleAddFolder} style={styles.addBtn}>
                                <Ionicons name="add" size={24} color={COLORS.bg} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Lista folderów */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSubtitle}>🗑️ Manage Custom Folders</Text>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {protectedFolders.map(f => (
                                <View key={f} style={styles.folderRow}>
                                    <Text style={styles.folderTextProtected}>{f} (System)</Text>
                                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSec} />
                                </View>
                            ))}
                            {sortableFolders.length > 0 ? (
                                sortableFolders.map(f => (
                                    <View key={f} style={styles.folderRow}>
                                        <Text style={styles.folderText}>{f}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteFolder(f)} style={styles.deleteBtn}>
                                            <Ionicons name="trash-outline" size={18} color="#FF453A" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No custom folders yet.</Text>
                            )}
                        </ScrollView>
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};
// --- KONIEC KOMPONENTU MODALNEGO ---


export default function LibraryScreen() {
  // ZMIANA: Pobieramy foldery i funkcje zarządzania z kontekstu
  const { notes, folders, addFolder, deleteFolder } = useNotes(); 
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false); // Stan modalu
  const router = useRouter();

  // 1. LOGIKA: Wyświetlana lista folderów
  const displayFolders = useMemo(() => {
    // Upewniamy się, że "All" jest na początku, a potem wszystkie foldery z kontekstu
    // Filtrujemy null/undefined i sortujemy foldery poza 'All'
    const sortedFolders = folders.filter(f => f && f.trim() !== '').sort();
    return ['All', ...sortedFolders];
  }, [folders]);
  
  // 2. LOGIKA FILTROWANIA (BEZ ZMIAN)
  const filteredNotes = useMemo(() => {
    let result: Note[] = notes;
    if (activeFolder !== 'All') {
      // Użyjemy pustego stringa dla notatek bez folderu, jeśli chcemy je filtrować
      result = result.filter(n => n.folder === activeFolder);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => 
        (n.content && n.content.toLowerCase().includes(q)) || 
        (n.textContent && n.textContent.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, activeFolder, search]);

  const col1 = filteredNotes.filter((_, i) => i % 2 === 0);
  const col2 = filteredNotes.filter((_, i) => i % 2 !== 0);

  const handleFolderChange = (folder: string) => {
    Haptics.selectionAsync();
    setActiveFolder(folder);
  };

  const renderNoteItem = (note: Note) => (
    <TouchableOpacity 
      key={note.id} 
      onPress={() => router.push(`/note/${note.id}` as Href)}
      activeOpacity={0.8}
    >
      <GlassCard style={styles.noteCard} anchorColor={note.anchor.color}>
        {note.folder && (
          <Text style={[styles.noteFolder, { color: note.anchor.color }]}>
            {note.anchor.emoji} {note.folder}
          </Text>
        )}
        <Text style={styles.noteText} numberOfLines={6}>
          {note.type === 'text' ? note.content : note.textContent || '📷 Visual Link'}
        </Text>
        <Text style={styles.noteDate}>
          {new Date(note.createdAt).toLocaleDateString()}
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.headerGlass}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Knowledge Library</Text>
          
          <View style={styles.controlsRow}>
            {/* Pole Wyszukiwania */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.textSec} />
              <TextInput 
                placeholder="Search concepts..." 
                placeholderTextColor={COLORS.textSec}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            
            {/* Przycisk Zarządzania Folderami */}
            <TouchableOpacity 
              onPress={() => setIsModalVisible(true)} 
              style={styles.manageBtn}
            >
              <Ionicons name="folder-open-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Paski Folderów */}
        <View style={styles.folderContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderScroll}>
            {/* Iteracja po folderach z kontekstu */}
            {displayFolders.map(f => (
              <TouchableOpacity 
                key={f} 
                style={[styles.chip, activeFolder === f && styles.chipActive]}
                onPress={() => handleFolderChange(f)}
              >
                <Text style={[styles.chipText, activeFolder === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.masonryContainer}>
          <View style={styles.column}>{col1.map(renderNoteItem)}</View>
          <View style={styles.column}>{col2.map(renderNoteItem)}</View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Modal zarządzania */}
      <FolderManagementModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        folders={folders}
        addFolder={addFolder}
        deleteFolder={deleteFolder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerGlass: { paddingTop: 60, paddingBottom: 10, zIndex: 10 },
  headerContent: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 24, color: COLORS.text, marginBottom: 10 },
  
  // Nowy styl dla kontroli (search + manage button)
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 12, paddingHorizontal: 12, height: 40,
    flex: 1 // Zajmuje dostępną przestrzeń
  },
  searchInput: { flex: 1, marginLeft: 8, color: COLORS.text, fontSize: 16 },
  manageBtn: {
    height: 40, width: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
    
  folderContainer: { paddingVertical: 8 },
  folderScroll: { paddingHorizontal: 20, gap: 8 },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 6, 
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', 
    borderWidth: 1, borderColor: 'transparent' 
  },
  chipActive: { 
    backgroundColor: COLORS.primary + '15', 
    borderColor: COLORS.primary 
  },
  chipText: { color: COLORS.textSec, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary },
  
  scrollContent: { paddingTop: 10, paddingBottom: 180 }, // Zmniejszona padding top
  masonryContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  column: { flex: 1, gap: 12 },
  
  noteCard: { padding: 12, borderRadius: 16 },
  noteFolder: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  noteText: { color: COLORS.text, fontSize: 15, lineHeight: 20 },
  noteDate: { color: COLORS.textSec, fontSize: 10, marginTop: 8, textAlign: 'right' },
  
  // STYLE DLA MODALU
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: width * 0.9, padding: 20, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, color: COLORS.text, fontWeight: 'bold' },
  modalSection: { marginBottom: 20 },
  modalSubtitle: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: 8 },
  modalInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  folderText: { color: COLORS.text, fontSize: 16 },
  folderTextProtected: { color: COLORS.textSec, fontSize: 16, fontStyle: 'italic' },
  deleteBtn: { padding: 5 },
  emptyText: { color: COLORS.textSec, marginTop: 10, textAlign: 'center' }
});