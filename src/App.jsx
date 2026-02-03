import React from 'react';
import SchemaCanvas from './components/SchemaCanvas';
import useSchemaStore from './store/useSchemaStore';
import './App.css';

function App() {
  const darkMode = useSchemaStore((state) => state.visualizationSettings.darkMode);

  return (
    <div className={`w-full h-screen ${darkMode ? 'dark' : ''}`}>
      <SchemaCanvas />
    </div>
  );
}

export default App;
