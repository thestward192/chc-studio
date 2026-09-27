import { equipo } from '../../content/equipo';
import './Secciones.css';

export function SeccionEquipo() {
  return (
    <section id="equipo" className="seccion">
      <h2 className="seccion__titulo">Equipo</h2>
      <div className="rejilla-tarjetas">
        {equipo.map((persona) => (
          <article key={persona.id} className="tarjeta tarjeta--equipo">
            <h3>{persona.nombre}</h3>
            <p className="tarjeta__rol">{persona.rol}</p>
            <p>{persona.bio}</p>
            <a href={persona.href} className="tarjeta__enlace">
              Ver su habitación y CV
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
