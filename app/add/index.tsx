import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ANCHOR_KEYS, COLORS } from '../../constants/colors';
import { useNotes } from '../../context/NotesContext';
import { Anchor, Note } from '../../types/Note';

const DEFAULT_ANCHOR: Anchor = COLORS.anchor.BLUE;

export default function AddScreen() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState<Anchor>(DEFAULT_ANCHOR);
  // Zmieniamy domyślny folder na 'Study' (zgodnie z nową logiką)
  const [folder, setFolder] = useState<string>('Study');
  
  // Pamiętaj, że foldery domyślne to teraz 'Niemiecki', 'Angielski', 'Study'
  const [uniqueFolders, setUniqueFolders] = useState<string[]>(['Niemiecki', 'Angielski', 'Study']);
  
  const { addNewNote, notes, folders: contextFolders } = useNotes(); // Pobieramy 'folders' z kontekstu
  const router = useRouter();

  // --- 1. LOGIKA GENEROWANIA FOLDERÓW NA PODSTAWIE KONTEKSTU ---
  useEffect(() => {
    // Używamy listy folderów z kontekstu, ponieważ jest ona zawsze aktualna (zawiera również foldery bez notatek)
    const foldersList = [...contextFolders].sort((a, b) => a.localeCompare(b));
        
    setUniqueFolders(foldersList);
    
    // Upewniamy się, że domyślny folder jest poprawny
    if (!folder || !foldersList.includes(folder)) {
      // Ustawiamy domyślny na 'Study', jeśli istnieje, w przeciwnym razie na pierwszy folder
      setFolder(foldersList.includes('Study') ? 'Study' : foldersList[0] || 'Uncategorized');
    }
  }, [contextFolders]);
  // --------------------------------------

  const handleCreate = async () => {
    Keyboard.dismiss(); // Ukrycie klawiatury
    
    // Filtracja pustych folderów
    const finalFolder = folder.trim() || 'Uncategorized';
    
    if (!text.trim() && !image) return;

    setLoading(true);

    const type = image ? (text ? 'mixed' : 'image') : 'text';

    const newNote: Note = {
      id: Date.now().toString(),
      type: type as 'mixed' | 'image' | 'text' | 'vocab_list',
      content: image || text, 
      textContent: image ? text : text, // textContent jest używany do tekstu w notatkach obrazkowych/mixed
      createdAt: Date.now(),
      folder: finalFolder, // Zapisujemy ustaloną wartość
      anchor: selectedAnchor,
    };

    await addNewNote(newNote);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const pickImage = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // --- renderAnchorPicker (Bez zmian) ---
  const renderAnchorPicker = () => (
    <View style={styles.anchorPickerContainer}>
      <Text style={styles.anchorPickerLabel}>Memory Anchor:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.anchorPickerScroll}
      >
        {ANCHOR_KEYS.map((key) => {
          const anchorData = COLORS.anchor[key];
          const isSelected = selectedAnchor.color === anchorData.color;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.anchorOption,
                isSelected && { 
                    borderColor: anchorData.color, 
                    borderWidth: 3,
                    transform: [{ scale: 1.05 }]
                }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedAnchor(anchorData);
              }}
            >
              <Text style={styles.anchorEmoji}>{anchorData.emoji}</Text>
              <View style={[styles.anchorColorDot, { backgroundColor: anchorData.color }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // --- 2. NOWY KOMPONENT WYBORU FOLDERU ---
  const renderFolderPicker = () => (
    <View style={styles.folderPicker}>
      <Text style={styles.anchorPickerLabel}>Select/Create Folder:</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.folderScroll}
      >
        {/* Opcja stworzenia nowego folderu (INPUT) */}
        <View style={styles.folderInputWrapper}>
          <TextInput
            style={[styles.folderInput, styles.folderCreateInput]}
            placeholder={folder.trim() ? folder : "New Folder..."}
            placeholderTextColor={COLORS.textSec}
            value={folder.trim()}
            onChangeText={setFolder}
            // Na focus czyścimy tylko jeśli to jest domyślny, ale nie ma sensu
            // po prostu używamy tego pola do wpisywania nowej wartości
            onFocus={() => setFolder(folder || '')} 
          />
        </View>

        {/* Wyświetlanie istniejących folderów (z wyjątkiem tego, który jest aktualnie wpisany/wybrany) */}
        {uniqueFolders.map((f) => (
          <TouchableOpacity
            key={f}
            // Jeśli folder jest równy f, to jest zaznaczony
            style={[
              styles.folderOption, 
              f === folder.trim() && styles.folderOptionSelected
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setFolder(f);
              Keyboard.dismiss(); // Ukrywamy klawiaturę po wyborze z listy
            }}
          >
            <Text style={[styles.folderOptionText, f === folder.trim() && { color: COLORS.bg }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  // --------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Encode Thought</Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          disabled={loading || (!text.trim() && !image)}
        >
          {loading ? <ActivityIndicator color={COLORS.primary} /> : (
            <Text style={[styles.createText, (!text.trim() && !image) && { opacity: 0.5 }]}>Encode</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" 
        contentInset={{ bottom: 200 }} 
        scrollIndicatorInsets={{ bottom: Platform.OS === 'ios' ? 200 : 0 }}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind? Use 'Termin: Definicja', '* lista', or start with '?' for Q&A."
            placeholderTextColor={COLORS.textSec}
            multiline
            autoFocus
            value={text}
            onChangeText={setText}
          />
        </View>

        {image && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.img} />
            <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImg}>
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {renderAnchorPicker()}

        {renderFolderPicker()}

      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={pickImage} style={styles.toolBtn}>
          <Ionicons name="image-outline" size={24} color={COLORS.primary} />
          <Text style={styles.toolBtnText}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
          <Ionicons name="mic-outline" size={24} color={COLORS.primary} />
          <Text style={styles.toolBtnText}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => Keyboard.dismiss()}>
          <Ionicons name="keyboard-outline" size={24} color={COLORS.primary} />
          <Text style={styles.toolBtnText}>Hide KB</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg || '#1C1C1E' 
  }, 
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 0.5, borderBottomColor: '#2A2A2A' 
  },
  title: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  cancelText: { color: COLORS.primary, fontSize: 16 },
  createText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  
  scrollContent: { padding: 20 },
  inputContainer: { marginBottom: 20 },
  
  input: { 
    minHeight: 200, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 16, 
    padding: 18, 
    color: COLORS.text, 
    fontSize: 18, 
    lineHeight: 28, 
    textAlignVertical: 'top'
  },
  
  imagePreview: { marginBottom: 20, height: 200, borderRadius: 12, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  removeImg: { 
    position: 'absolute', top: 8, right: 8, 
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 
  },

  anchorPickerContainer: { marginBottom: 30 },
  anchorPickerLabel: { color: COLORS.textSec, fontSize: 14, marginBottom: 10, fontWeight: '600' },
  
  anchorPickerScroll: {
      paddingRight: 20, 
      gap: 12, 
  },
  anchorOption: { 
    width: 50, height: 50, borderRadius: 25, 
    backgroundColor: '#2A2A2A', 
    justifyContent: 'center', alignItems: 'center', 
    borderColor: 'transparent',
    borderWidth: 3,
  },
  anchorEmoji: { fontSize: 22 },
  anchorColorDot: { position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  
  folderPicker: { marginBottom: 20 },
  
  // NOWE STYLE DLA WYBORU FOLDERÓW
  folderScroll: {
      gap: 10,
      paddingRight: 20,
      alignItems: 'center',
  },
  folderInputWrapper: {
      minWidth: 120,
      marginRight: 5, // Dodatkowy odstęp od listy przycisków
  },
  folderCreateInput: {
      borderWidth: 1,
      borderColor: COLORS.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
  },
  folderOption: {
      backgroundColor: '#2A2A2A',
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      // Zapewnienie, że przyciski mają spójną wysokość
      height: 40, 
      justifyContent: 'center', 
  },
  folderOptionSelected: {
      backgroundColor: COLORS.primary,
  },
  folderOptionText: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '500',
  },
  
  toolbar: { 
    flexDirection: 'row', padding: 16, gap: 10, 
    borderTopWidth: 0.5, borderTopColor: '#2A2A2A',
    paddingBottom: 16 
  },
  toolBtn: { 
    flex: 1, 
    height: 60,
    borderRadius: 14, 
    backgroundColor: '#2C2C2E', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 8, 
  },
  toolBtnText: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.textSec 
  },
  folderInput:{
    color: COLORS.text,
    height: 40,
  }
});