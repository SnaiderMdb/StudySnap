// ============================================================
// Contact.tsx — Sección de contacto y pie de página
// Información del proyecto StudySnap
// ============================================================

// Equipo real — Colegio San Bernardo de Tarija
const TEAM = [
  { name: 'Fernando Reyes Fernández', role: 'Desarrollo web', email: 'fernando.reyes@cosabe.edu.bo' },
  { name: 'Ana Pamela Ávila Tejerina', role: 'Diseño de interfaz', email: 'ana.avila@cosabe.edu.bo' },
  { name: 'Emily Valentina Zenteno Villa', role: 'Investigación educativa', email: 'emily.zenteno@cosabe.edu.bo' },
  { name: 'Luz Oriana Medinaceli Delgado', role: 'Contenido y pruebas', email: 'luz.medinaceli@cosabe.edu.bo' },
  { name: 'Luciana Jael Illescas Cardozo', role: 'Documentación', email: 'luciana.illescas@cosabe.edu.bo' },
];

// Datos de contacto del proyecto
const CONTACT_INFO = [
  { icon: '📧', label: 'Correo', value: 'studysnap@cosabe.edu.bo' },
  { icon: '🏫', label: 'Institución', value: 'Colegio San Bernardo de Tarija' },
  { icon: '📚', label: 'Materias', value: 'Emprendedurismo - Tecnología' },
  { icon: '📅', label: 'Año escolar', value: '2025–2026' },
];

export default function Contact() {
  return (
    <section id="contacto" style={{ padding: '5rem 1.5rem 0', background: '#F8F6FF' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Separador decorativo */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #DDD6FE, transparent)',
          marginBottom: '4rem',
        }}/>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-block',
            background: '#EDE9FF',
            color: '#7C6CE6',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            marginBottom: '1rem',
          }}>
            ✉️ Contacto
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontFamily: 'Nunito, sans-serif', color: '#2C2855', marginBottom: '0.75rem' }}>
            Sobre el proyecto
          </h2>
          <p style={{ color: '#7C75A6', maxWidth: '480px', margin: '0 auto' }}>
            StudySnap es un proyecto escolar desarrollado con pasión por estudiantes
            que quieren mejorar la forma en que todos aprendemos.
          </p>
        </div>

        {/* Grid: Información de contacto + Equipo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}>
          {/* Tarjeta de información de contacto */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              📋 Información del proyecto
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {CONTACT_INFO.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '1.2rem',
                    background: '#EDE9FF',
                    width: '38px',
                    height: '38px',
                    borderRadius: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </span>
                  <div>
                    <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2C2855', fontSize: '0.875rem', marginBottom: '0.1rem' }}>
                      {item.label}
                    </p>
                    <p style={{ color: '#7C75A6', fontSize: '0.85rem' }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta del equipo */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              👥 Equipo de desarrollo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {TEAM.map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Avatar con inicial */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `hsl(${i * 60 + 240}, 60%, 85%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: `hsl(${i * 60 + 240}, 50%, 40%)`,
                    flexShrink: 0,
                  }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2C2855', fontSize: '0.9rem' }}>
                      {member.name}
                    </p>
                    <p style={{ color: '#7C75A6', fontSize: '0.8rem' }}>
                      {member.role} · {member.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PIE DE PÁGINA ===== */}
        <div style={{
          background: '#2C2855',
          borderRadius: '1.5rem 1.5rem 0 0',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginTop: '1rem',
        }}>
          {/* Logo en el footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✦</span>
            <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'white' }}>
              Study<span style={{ color: '#a78bfa' }}>Snap</span>
            </span>
          </div>

          <p style={{ color: '#7C75A680', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Plataforma educativa · Proyecto tecnológico escolar 2026
          </p>
          <p style={{ color: '#7C75A640', fontSize: '0.8rem' }}>
            Hecho con 💜 para estudiantes de secundaria
          </p>
        </div>

      </div>
    </section>
  );
}
