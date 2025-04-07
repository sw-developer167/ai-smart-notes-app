// ✅ BACKEND: server.js for AI Smart Notes App
// This Express + MongoDB backend handles storing, retrieving, updating, and deleting notes. It includes smart summarization and optional AI.

const express = require('express'); // Express framework for HTTP APIs
const mongoose = require('mongoose'); // Mongoose for connecting to MongoDB
const cors = require('cors'); // CORS allows frontend (on another port) to access backend
require('dotenv').config(); // Load environment variables from a .env file (like DB URI)

const app = express(); // Create an instance of the Express app
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Automatically parse incoming JSON requests

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI) // Replace MONGO_URI in .env with your DB URI
  .then(() => console.log("✅ MongoDB connected")) // On success
  .catch(err => console.error("❌ MongoDB connection error:", err)); // On failure

// Schema: structure of a note in MongoDB
const noteSchema = new mongoose.Schema({
  title: String,       // Title of the note
  content: String,     // Full content of the note
  summary: String,     // Short summary generated from content
  category: String,    // Auto-detected category (Meeting, Task, etc.)
  createdAt: { type: Date, default: Date.now } // Timestamp
});

const Note = mongoose.model('Note', noteSchema); // Create model from schema

// 🔸 Basic summarizer (returns first sentence or 100 characters)
const getSummary = (text) => {
  const firstPeriod = text.indexOf('.');
  if (firstPeriod !== -1 && firstPeriod < 100) {
    return text.slice(0, firstPeriod + 1); // return first sentence
  }
  return text.length > 100 ? text.slice(0, 100) + "..." : text; // fallback to first 100 chars
};

// 🔸 OPTIONAL: OpenAI summarization (commented out)
/*
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getSummary = async (text) => {
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: `Summarize this: ${text}` }],
    temperature: 0.7,
  });
  return res.choices[0].message.content;
};
*/

// 🔸 Categorize notes using keywords
const categorize = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("meeting")) return "Meeting";
  if (lower.includes("idea")) return "Idea";
  if (lower.includes("reminder")) return "Reminder";
  if (lower.includes("task")) return "Task";
  if (lower.includes("schedule")) return "Schedule";
  if (lower.includes("goal")) return "Goal";
  if (lower.includes("research")) return "Research";
  return "Note"; // Default category
};

// 🔹 GET: Retrieve all notes (optionally filtered by category)
app.get('/notes', async (req, res) => {
  const { category } = req.query; // Example: /notes?category=Meeting
  const filter = category ? { category } : {}; // Build query
  const notes = await Note.find(filter).sort({ createdAt: -1 }); // Get notes from DB
  res.json(notes); // Send notes back to client
});

// 🔹 POST: Create a new note
app.post('/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

  try {
    const summary = getSummary(content); // Or await getSummary(content) if using OpenAI
    const category = categorize(content);
    const note = new Note({ title, content, summary, category });
    await note.save();
    res.status(201).json(note); // Send created note back
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// 🔹 PUT: Update a note by ID
app.put('/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  try {
    const summary = getSummary(content);
    const category = categorize(content);
    const updated = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, summary, category },
      { new: true } // Return updated document
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

// 🔹 DELETE: Delete a note by ID
app.delete('/notes/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id); // Delete by ID
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Start the backend server
const PORT = process.env.PORT || 5000; // Use .env port or fallback to 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
