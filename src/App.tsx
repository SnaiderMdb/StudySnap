// ============================================================
// App.tsx — Componente raíz de StudySnap
// Controla la navegación entre secciones
// ============================================================
import { useEffect, useState } from 'react';
import { AuthProvider } from './store/AuthContext';
import { StudyProvider } from './store/StudyContext';
import NavBar from './components/NavBar';
import Home from './components/Home';
import ScanNotes from './components/ScanNotes';
import Study from './components/Study';
import Progress from './components/Progress';
import Contact from './components/Contact';
import Plans from './components/Plans';
import AuthModal from './components/AuthModal';
import UpgradeModal from './components/UpgradeModal';
import AdminDashboard from './components/AdminDashboard';

// Tipo que representa cada sección de la aplicación
type Section = 'inicio' | 'escanear' | 'estudiar' | 'progreso' | 'contacto' | 'planes';

export default function App() {
  // Sección actualmente visible — empieza en "inicio"
  const [activeSection, setActiveSection] = useState<Section>('inicio');
  const [isAdminView, setIsAdminView] = useState(
    () => window.location.hash === '#admin',
  );

  // Permite abrir el panel de administración con la URL #admin
  useEffect(() => {
    const onHashChange = () => {
      setIsAdminView(window.location.hash === '#admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Función de navegación que cambia la sección y hace scroll arriba
  function navigate(section: Section) {
    if (isAdminView) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      setIsAdminView(false);
    }
    setActiveSection(section);
    // Regresa al tope de la página al cambiar de sección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function exitAdmin() {
    if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setIsAdminView(false);
    setActiveSection('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Renderiza la sección correspondiente al estado activo
  function renderSection() {
    if (isAdminView) {
      return <AdminDashboard onExit={exitAdmin} />;
    }
    switch (activeSection) {
      case 'inicio':
        return <Home onNavigate={navigate} />;
      case 'escanear':
        return <ScanNotes />;
      case 'estudiar':
        return <Study />;
      case 'progreso':
        return <Progress />;
      case 'planes':
        return <Plans onNavigate={navigate} />;
      case 'contacto':
        return <Contact />;
      default:
        return <Home onNavigate={navigate} />;
    }
  }

  return (
    <AuthProvider>
      <StudyProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F6FF' }}>
          {/* Barra de navegación fija */}
          <NavBar activeSection={activeSection} onNavigate={navigate} />

          {/* Contenido principal de la sección activa */}
          <main>
            {renderSection()}
          </main>

          {/* El pie de página (contacto) aparece siempre al final, excepto en la propia sección de contacto */}
          {activeSection !== 'contacto' && !isAdminView && <Contact />}

          {/* Cuentas y pago simulado */}
          <AuthModal />
          <UpgradeModal />
        </div>
      </StudyProvider>
    </AuthProvider>
  );
}
