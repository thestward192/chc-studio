import { proyectos } from '../../content/proyectos';
import { PanelTexto } from './PanelTexto';
import './Secciones.css';

export function SeccionProyectos() {
  return (
    <section id="proyectos" className="seccion">
      <h2 className="seccion__titulo">Proyectos destacados</h2>
      <p className="seccion__intro">
        La versión visual de estos proyectos vive en la sala 3D del estudio.{' '}
        <a href="/estudio.html">Entrar a la sala de proyectos</a>.
      </p>
      <div className="rejilla-tarjetas">
        {proyectos.map((proyecto) => (
          <article key={proyecto.id} className="tarjeta">
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.resumen}</p>
            <PanelTexto titulo={proyecto.titulo} etiquetaBoton="Ver detalle en texto">
              <p>{proyecto.descripcion}</p>
              <ul>
                {proyecto.tecnologias.map((tecnologia) => (
                  <li key={tecnologia}>{tecnologia}</li>
                ))}
              </ul>
            </PanelTexto>
          </article>
        ))}
      </div>
    </section>
  );
}
