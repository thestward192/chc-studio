import { empresa } from '../../content/empresa';
import './Secciones.css';

export function SeccionContacto() {
  return (
    <section id="contacto" className="seccion">
      <h2 className="seccion__titulo">Contacto</h2>
      <p>{empresa.descripcionLarga}</p>
      <dl className="lista-contacto">
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${empresa.email}`}>{empresa.email}</a>
          </dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{empresa.telefono}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{empresa.direccion}</dd>
        </div>
      </dl>
    </section>
  );
}
