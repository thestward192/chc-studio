import { empresa } from '../../content/empresa';
import './Footer.css';

export function Footer() {
  return (
    <footer className="pie">
      <p>
        © {new Date().getFullYear()} {empresa.nombre}
      </p>
      <ul className="pie__redes">
        {empresa.redes.map((red) => (
          <li key={red.nombre}>
            <a href={red.url} target="_blank" rel="noreferrer">
              {red.nombre}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
