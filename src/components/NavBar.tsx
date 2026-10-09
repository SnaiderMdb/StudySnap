// ============================================================
// NavBar.tsx — Barra de navegación principal de StudySnap
// ============================================================
import { useState } from 'react';

// Tipo para las secciones de la página
type Section = 'inicio' | 'escanear' | 'estudiar' | 'progreso' | 'contacto';

// Props que recibe la barra de navegación
interface NavBarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
}

// Ícono del logo (cámara con documento y destello)
function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Marco de escaneo */}
      <path d="M4 10V6h4" stroke="#7C6CE6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 10V6h-4" stroke="#7C6CE6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 22v4h4" stroke="#7C6CE6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 22v4h-4" stroke="#7C6CE6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Documento */}
      <rect x="9" y="8" width="13" height="16" rx="2" fill="#EDE9FF"/>
      <path d="M21 8v3h1" stroke="#DDD6FE" strokeWidth="1"/>
      <rect x="21" y="8" width="1" height="3" fill="#DDD6FE" rx="0.5"/>
      {/* Líneas del documento */}
      <line x1="12" y1="14" x2="20" y2="14" stroke="#7C6CE6" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="20" y2="17" stroke="#7C6CE6" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="17" y2="20" stroke="#7C6CE6" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Destello */}
      <path d="M21 19 L22.5 17 L24 19 L22.5 21 Z" fill="#7C6CE6"/>
      <line x1="22.5" y1="15.5" x2="22.5" y2="16.5" stroke="#7C6CE6" strokeWidth="1" strokeLinecap="round"/>
      <line x1="22.5" y1="21.5" x2="22.5" y2="22.5" stroke="#7C6CE6" strokeWidth="1" strokeLinecap="round"/>
      <line x1="20.5" y1="19" x2="21.5" y2="19" stroke="#7C6CE6" strokeWidth="1" strokeLinecap="round"/>
      <line x1="23.5" y1="19" x2="24.5" y2="19" stroke="#7C6CE6" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

// Componente principal de la barra de navegación
export default function NavBar({ activeSection, onNavigate }: NavBarProps) {
  // Estado para mostrar/ocultar el menú en móviles
  const [menuOpen, setMenuOpen] = useState(false);

  // Lista de secciones de navegación
  const navItems: { id: Section; label: string }[] = [
    { id: 'inicio',    label: 'Inicio' },
    { id: 'escanear',  label: 'Escanear' },
    { id: 'estudiar',  label: 'Estudiar' },
    { id: 'progreso',  label: 'Mi Progreso' },
    { id: 'contacto',  label: 'Contacto' },
  ];

  // Función para navegar y cerrar el menú móvil
  function handleNav(section: Section) {
    onNavigate(section);
    setMenuOpen(false);
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(248, 246, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2DCFF',
        height: '4rem',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
      }}
    >
      {/* Contenedor interior con ancho máximo */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo y nombre */}
        <button
          onClick={() => handleNav('inicio')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogoIcon />
          <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2C2855' }}>
            Study<span style={{ color: '#7C6CE6' }}>Snap</span>
          </span>
        </button>

        {/* Menú de navegación — visible en pantallas medianas y grandes */}
        <div style={{ gap: '1.5rem', alignItems: 'center' }}
             className="hidden md:flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              style={{ background: 'none', border: 'none' }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNav('escanear')}
            className="btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
          >
            Comenzar ✦
          </button>
        </div>

        {/* Botón de menú hamburguesa — solo en móviles */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', flexDirection: 'column', gap: '5px' }}
          className="flex md:hidden"
          aria-label="Abrir menú"
        >
          <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#7C6CE6' : '#2C2855', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}/>
          <span style={{ display: 'block', width: '22px', height: '2px', background: '#2C2855', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }}/>
          <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#7C6CE6' : '#2C2855', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}/>
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '4rem',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderBottom: '1px solid #E2DCFF',
            padding: '1rem 1.5rem 1.5rem',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(124, 108, 230, 0.1)',
          }}
          className="md:hidden"
        >
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', textAlign: 'left', borderBottom: 'none', fontSize: '1rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
