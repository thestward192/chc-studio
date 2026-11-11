import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo';
import { Phone } from '@phosphor-icons/react/dist/csr/Phone';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { empresa } from '../../content/empresa';
import {
  encabezadoContacto,
  formularioContacto,
  mediosContacto,
  opcionesServicio,
  type IconoMedio,
} from '../../content/contacto';
import estilos from './SeccionContacto.module.css';

const iconos: Record<IconoMedio, Icon> = {
  correo: EnvelopeSimple,
  whatsapp: WhatsappLogo,
  telefono: Phone,
  ubicacion: MapPin,
};

/**
 * Contacto con el lenguaje de iOS: a la izquierda, el titular y los medios
 * de contacto en una lista agrupada (como Ajustes), con íconos de app y
 * chevrones; a la derecha, un formulario en listas agrupadas con píldoras
 * para elegir servicios. Sin servidor: al enviar se abre la app de correo
 * con el mensaje armado.
 */
export function SeccionContacto() {
  const seccionRef = useRef<HTMLElement>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seccion.dataset.visible = '';
        observador.disconnect();
      },
      { threshold: 0.15 },
    );
    observador.observe(seccion);
    return () => observador.disconnect();
  }, []);

  const alternar = (opcion: string) =>
    setElegidos((lista) =>
      lista.includes(opcion) ? lista.filter((o) => o !== opcion) : [...lista, opcion],
    );

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const nombre = String(datos.get('nombre') ?? '').trim();
    const empresaCliente = String(datos.get('empresa') ?? '').trim();
    const datosCliente = [
      `Nombre: ${nombre}`,
      `Correo: ${datos.get('correo')}`,
      empresaCliente && `Empresa: ${empresaCliente}`,
      elegidos.length > 0 && `Me interesa: ${elegidos.join(', ')}`,
    ].filter(Boolean);
    const cuerpo = `${datosCliente.join('\n')}\n\n${String(datos.get('mensaje') ?? '')}`;
    const url = `mailto:${empresa.email}?subject=${encodeURIComponent(
      formularioContacto.asunto(nombre),
    )}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = url;
    setEnviado(true);
  };

  return (
    <section
      ref={seccionRef}
      id="contacto"
      className={estilos.seccion}
      aria-labelledby="contacto-titular"
    >
      <div className={estilos.contenedor}>
        <div className={estilos.columnaInfo}>
          <header className={estilos.encabezado}>
            <p className={estilos.antetitulo}>{encabezadoContacto.antetitulo}</p>
            <h2 id="contacto-titular" className={estilos.titular}>
              {encabezadoContacto.titular.map((parte, i) =>
                parte.destacado ? (
                  <span key={i} className={estilos.degradado}>
                    {parte.texto}
                  </span>
                ) : (
                  parte.texto
                ),
              )}
            </h2>
            <p className={estilos.subtitulo}>{encabezadoContacto.subtitulo}</p>
          </header>

          {/* Medios de contacto: lista agrupada de iOS */}
          <ul className={estilos.grupo} aria-label="Medios de contacto">
            {mediosContacto.map((medio) => {
              const Icono = iconos[medio.icono];
              const contenido = (
                <>
                  <span className={estilos.icono} data-medio={medio.icono} aria-hidden="true">
                    <Icono size={18} weight="fill" />
                  </span>
                  <span className={estilos.filaTexto}>
                    <span className={estilos.filaTitulo}>{medio.titulo}</span>
                    <span className={estilos.filaValor}>{medio.valor}</span>
                  </span>
                  {medio.href && (
                    <CaretRight
                      className={estilos.chevron}
                      size={16}
                      weight="bold"
                      aria-hidden="true"
                    />
                  )}
                </>
              );
              return (
                <li key={medio.icono}>
                  {medio.href ? (
                    <a
                      className={estilos.fila}
                      href={medio.href}
                      {...(medio.href.startsWith('http')
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                    >
                      {contenido}
                    </a>
                  ) : (
                    <div className={estilos.fila}>{contenido}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Formulario: listas agrupadas como en Ajustes */}
        <form className={estilos.formulario} onSubmit={enviar}>
          <h3 className={estilos.formularioTitulo}>{formularioContacto.titulo}</h3>

          <div className={estilos.grupo}>
            <label className={estilos.campo}>
              <span>Nombre</span>
              <input name="nombre" required autoComplete="name" placeholder="Tu nombre" />
            </label>
            <label className={estilos.campo}>
              <span>Correo</span>
              <input
                name="correo"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
              />
            </label>
            <label className={estilos.campo}>
              <span>Empresa</span>
              <input name="empresa" autoComplete="organization" placeholder="Opcional" />
            </label>
          </div>

          <fieldset className={estilos.opciones}>
            <legend>¿Qué necesitas?</legend>
            <div className={estilos.pildoras}>
              {opcionesServicio.map((opcion) => {
                const activa = elegidos.includes(opcion);
                return (
                  <button
                    key={opcion}
                    type="button"
                    className={estilos.pildora}
                    aria-pressed={activa}
                    onClick={() => alternar(opcion)}
                  >
                    {activa && <CheckCircle size={15} weight="fill" aria-hidden="true" />}
                    {opcion}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className={estilos.grupo}>
            <label className={`${estilos.campo} ${estilos.campoMensaje}`}>
              <span>Mensaje</span>
              <textarea
                name="mensaje"
                required
                rows={4}
                placeholder="Cuéntanos de tu negocio y qué te gustaría lograr."
              />
            </label>
          </div>

          <button type="submit" className={estilos.enviar}>
            {formularioContacto.boton}
            <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
          </button>
          <p className={estilos.nota} role="status">
            {enviado ? formularioContacto.enviado : formularioContacto.nota}
          </p>
        </form>
      </div>
    </section>
  );
}
