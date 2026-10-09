// ============================================================
// App.tsx — Componente raíz de StudySnap
// Controla la navegación entre secciones
// ============================================================
import { useState } from 'react';
import { StudyProvider } from './store/StudyContext';
import NavBar from './components/NavBar';
import Home from './components/Home';
import ScanNotes from './components/ScanNotes';
import Study from './components/Study';
import Progress from './components/Progress';
import Contact from './components/Contact';

// Tipo que representa cada sección de la aplicación
type Section = 'inicio' | 'escanear' | 'estudiar' | 'progreso' | 'contacto';

export default function App() {
  // Sección actualmente visible — empieza en "inicio"
  const [activeSection, setActiveSection] = useState<Section>('inicio');

  // Función de navegación que cambia la sección y hace scroll arriba
  function navigate(section: Section) {
    setActiveSection(section);
    // Regresa al tope de la página al cambiar de sección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Renderiza la sección correspondiente al estado activo
  function renderSection() {
    switch (activeSection) {
      case 'inicio':
        return <Home onNavigate={navigate} />;
      case 'escanear':
        return <ScanNotes />;
      case 'estudiar':
        return <Study />;
      case 'progreso':
        return <Progress />;
      case 'contacto':
        return <Contact />;
      default:
        return <Home onNavigate={navigate} />;
    }
  }

  return (
    <StudyProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F6FF' }}>
        {/* Barra de navegación fija */}
        <NavBar activeSection={activeSection} onNavigate={navigate} />

        {/* Contenido principal de la sección activa */}
        <main>
          {renderSection()}
        </main>

        {/* El pie de página (contacto) aparece siempre al final, excepto en la propia sección de contacto */}
        {activeSection !== 'contacto' && <Contact />}
      </div>
    </StudyProvider>
  );
}
