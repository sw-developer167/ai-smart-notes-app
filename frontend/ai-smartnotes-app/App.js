// ✅ FRONTEND: App.js for AI Smart Notes App
// This React Native app allows users to take notes, generates a summary automatically, and saves them with timestamps and categories.

import React, { useEffect, useState } from 'react'; // Import React and Hooks
import {
  View, Text, TextInput, Button, FlatList, StyleSheet,
  TouchableOpacity, Alert, Modal, ScrollView
} from 'react-native'; // UI components from React Native
import { Picker } from '@react-native-picker/picker'; // Dropdown picker

const backendUrl = "add your ip address"; // URL where backend is hosted, get it from ipconfig IPV4 address

export default function App() {
  // Declare state variables using React Hooks
  const [title, setTitle] = useState(''); // Title of the note
  const [note, setNote] = useState(''); // Content of the note
  const [notes, setNotes] = useState([]); // Array of all notes
  const [categoryFilter, setCategoryFilter] = useState(''); // Filter for category
  const [modalVisible, setModalVisible] = useState(false); // Show/hide modal popup
  const [selectedNote, setSelectedNote] = useState(null); // The note selected for viewing/editing
  const [editTitle, setEditTitle] = useState(''); // Title during edit
  const [editContent, setEditContent] = useState(''); // Content during edit

  // Fetch notes from backend on load or when category changes
  useEffect(() => { fetchNotes(); }, [categoryFilter]);

  // Function to fetch all notes from the server
  const fetchNotes = () => {
    const url = categoryFilter ? `${backendUrl}/notes?category=${categoryFilter}` : `${backendUrl}/notes`;
    fetch(url)
      .then(res => res.json())
      .then(setNotes)
      .catch(() => Alert.alert("Error", "Could not fetch notes"));
  };

  // Function to add a new note
  const addNote = () => {
    if (note.trim() && title.trim()) {
      fetch(`${backendUrl}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: note })
      })
        .then(() => {
          setTitle('');
          setNote('');
          fetchNotes();
        })
        .catch(() => Alert.alert("Error", "Could not add note"));
    }
  };

  // Delete a note by ID
  const deleteNote = (id) => {
    fetch(`${backendUrl}/notes/${id}`, { method: 'DELETE' })
      .then(() => fetchNotes())
      .catch(() => Alert.alert("Error", "Delete failed"));
  };

  // Open modal to view and edit selected note
  const openModal = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setModalVisible(true);
  };

  // Save edited note
  const saveEdit = () => {
    fetch(`${backendUrl}/notes/${selectedNote._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editContent })
    }).then(() => {
      setModalVisible(false);
      fetchNotes();
    });
  };

  // Render each note in a clickable card
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={styles.noteCard}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteSummary}>🧠 {item.summary}</Text>
      <Text style={styles.noteDate}>🕒 {new Date(item.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  // JSX (HTML-like) structure of the app
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🧠 AI Smart Notes</Text>

      {/* Input field for note title */}
      <TextInput
        style={styles.input}
        placeholder="Note Title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Input field for note content */}
      <TextInput
        style={styles.input}
        placeholder="Write your note here..."
        value={note}
        onChangeText={setNote}
      />

      {/* Button to add a new note */}
      <Button title="➕ Add Note" onPress={addNote} />

      {/* Filter section using Picker dropdown */}
      <Text style={styles.filterLabel}>🎯 Filter by Category:</Text>
      <Picker
        selectedValue={categoryFilter}
        style={styles.picker}
        onValueChange={(itemValue) => setCategoryFilter(itemValue)}
      >
        <Picker.Item label="All" value="" />
        <Picker.Item label="Meeting" value="Meeting" />
        <Picker.Item label="Idea" value="Idea" />
        <Picker.Item label="Reminder" value="Reminder" />
        <Picker.Item label="Task" value="Task" />
        <Picker.Item label="Schedule" value="Schedule" />
        <Picker.Item label="Goal" value="Goal" />
        <Picker.Item label="Research" value="Research" />
      </Picker>

      {/* List all notes below filter */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ width: '100%', maxWidth: 600 }}
      />

      {/* Modal shows when a user taps a note */}
      {selectedNote && (
        <Modal visible={modalVisible} animationType="slide">
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>📝 Edit Note</Text>

            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={editContent}
              onChangeText={setEditContent}
            />

            <Text style={styles.noteSummary}>🧠 Summary: {selectedNote.summary}</Text>
            <Text style={styles.noteDate}>🕒 Created: {new Date(selectedNote.createdAt).toLocaleString()}</Text>

            <Button title="💾 Save" onPress={saveEdit} />
            <Button title="🗑️ Delete" color="red" onPress={() => {
              deleteNote(selectedNote._id);
              setModalVisible(false);
            }} />
            <Button title="❌ Cancel" onPress={() => setModalVisible(false)} />
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

// Styles for the components
const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#F1FAFF' },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#0C2340', marginBottom: 10 },
  input: { height: 50, borderColor: '#E87722', borderWidth: 1, padding: 10, backgroundColor: 'white', marginBottom: 10, width: '100%', maxWidth: 500, borderRadius: 6 },
  filterLabel: { fontWeight: '600', marginTop: 10, marginBottom: 5 },
  picker: { height: 50, width: '100%', maxWidth: 500, backgroundColor: 'white' },
  noteCard: { backgroundColor: '#fff', padding: 15, marginVertical: 6, borderRadius: 8, elevation: 2, width: '100%', maxWidth: 600 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: '#0C2340' },
  noteSummary: { fontSize: 14, fontWeight: '500', color: '#333', marginTop: 4 },
  noteDate: { fontSize: 12, color: '#666', marginTop: 4 },
  modalContent: { padding: 20, alignItems: 'center', backgroundColor: '#FAFAFA' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#E87722' }
});
