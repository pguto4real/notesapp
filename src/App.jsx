import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import {
  Authenticator,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";

// Configure Amplify with generated outputs
Amplify.configure(outputs);

// Generate the data client
const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", image: null });

  // Fetch all notes
  async function fetchNotes() {
    try {
      const { data } = await client.models.Note.list();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }

  // Create a note
  async function createNote(e) {
    e.preventDefault();

    if (!formData.name || !formData.description) return;

    try {
      let imageKey = null;

      // If image selected, upload to Amplify storage
      if (formData.image) {
        const fileName = `${Date.now()}_${formData.image.name}`;
        await client.storage.put(fileName, formData.image);
        imageKey = fileName;
      }

      // Save note in Data
      await client.models.Note.create({
        name: formData.name,
        description: formData.description,
        image: imageKey,
      });

      setFormData({ name: "", description: "", image: null });
      fetchNotes();
    } catch (err) {
      console.error("Error creating note:", err);
    }
  }

  // Delete a note
  async function deleteNote(id) {
    try {
      await client.models.Note.delete({ id });
      fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <View className="App">
          <Heading level={2}>Welcome, {user.username}</Heading>
          <Button onClick={signOut}>Sign out</Button>

          {/* Create Note Form */}
          <form onSubmit={createNote} style={{ marginTop: "2rem" }}>
            <Flex direction="column" gap="1rem">
              <TextField
                label="Note Title"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.files[0] })
                }
              />
              <Button type="submit">Create Note</Button>
            </Flex>
          </form>

          {/* Notes List */}
          <Heading level={3} style={{ marginTop: "2rem" }}>
            My Notes
          </Heading>
          <Flex wrap="wrap" gap="1rem">
            {notes.map((note) => (
              <View
                key={note.id}
                className="card box"
                style={{
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "1rem",
                  width: "250px",
                }}
              >
                <Text as="strong">{note.name}</Text>
                <Text>{note.description}</Text>
                {note.image && (
                  <Image
                    alt={note.name}
                    src={client.storage.get(note.image)}
                    style={{ width: "100%", marginTop: "1rem" }}
                  />
                )}
                <Button
                  variation="destructive"
                  onClick={() => deleteNote(note.id)}
                  style={{ marginTop: "1rem" }}
                >
                  Delete
                </Button>
              </View>
            ))}
          </Flex>
        </View>
      )}
    </Authenticator>
  );
}
