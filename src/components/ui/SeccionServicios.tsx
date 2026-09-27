import { servicios } from '../../content/servicios';
import './Secciones.css';

export function SeccionServicios() {
  return (
    <section id="servicios" className="seccion">
      <h2 className="seccion__titulo">Servicios</h2>
      <div className="rejilla-tarjetas">
        {servicios.map((servicio) => (
          <article key={servicio.id} className="tarjeta">
            <span className="tarjeta__icono" aria-hidden="true">
              {servicio.icono}
            </span>
            <h3>{servicio.titulo}</h3>
            <p>{servicio.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
