import './SaltarIntro.css';

interface Props {
  onSaltar: () => void;
  visible: boolean;
}

export function SaltarIntro({ onSaltar, visible }: Props) {
  if (!visible) return null;
  return (
    <button type="button" className="saltar-intro" onClick={onSaltar}>
      Saltar intro
    </button>
  );
}
