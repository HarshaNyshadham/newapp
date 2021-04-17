import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

import { ReactExcel, readFile, generateObjects } from '@ramonak/react-excel';

const initialFormState = { name: '', description: '' }

function App() {
  const [initialData, setInitialData] = useState(undefined);
  const [currentSheet, setCurrentSheet] = useState({});
  const [generatedObjects, setGeneratedObjects] = useState([]);

  const handleUpload = (event) => {
    const file = event.target.files[0];
    readFile(file)
      .then((readedData) => setInitialData(readedData))
      .catch((error) => console.error(error));
  };

  const handleClick = () => {
    const result = generateObjects(currentSheet);
    setGeneratedObjects(result);
  };

  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
    <h1>Page header</h1>
      <input
        type='file'
        accept='.xlsx'
        onChange={handleUpload}
        id='upload'
        style={{ display: 'none' }}
      />
      <label htmlFor='upload'>
        <button
          className='custom-button'
          onClick={() => document.getElementById('upload').click()}
        >
          Upload
        </button>
      </label>
      <ReactExcel
        initialData={initialData}
        onSheetUpdate={(currentSheet) => setCurrentSheet(currentSheet)}
        activeSheetClassName='active-sheet'
        reactExcelClassName='react-excel'
      />
      {initialData && (
        <button className='custom-button' onClick={handleClick}>
          Match
        </button>
      )}
      {generatedObjects.length > 0 && (
        <textarea
          cols={70}
          rows={30}
          value={JSON.stringify(generatedObjects, null, 2)}
          readOnly
          className='text-area'
        />
      )}
      <h1>Notes for app</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note)}>Delete note</button>
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

 export default App;
