/**
 * Sonido del estudio, todo sintetizado con Web Audio API (sin archivos).
 * Apagado por defecto: el AudioContext solo se crea cuando el usuario
 * activa el sonido (gesto del usuario, como exigen los navegadores).
 * Volumen general bajo.
 */
const VOLUMEN_GENERAL = 0.16;
const TEMPO = 76; // pulsos por minuto de la música lo-fi

// Progresiones (MIDI) de cada pista: acordes de 4 notas, uno por compás.
const PISTAS: number[][][] = [
  [
    [50, 57, 60, 65], // Dm9
    [55, 59, 62, 65], // G7
    [48, 55, 59, 64], // Cmaj7
    [57, 60, 64, 67], // Am7
  ],
  [
    [53, 57, 60, 64], // Fmaj7
    [52, 55, 59, 62], // Em7
    [50, 53, 57, 60], // Dm7
    [48, 52, 55, 59], // Cmaj7
  ],
  [
    [45, 52, 55, 60], // Am(add9)
    [53, 57, 60, 64], // Fmaj7
    [48, 55, 59, 62], // C(add9)
    [55, 59, 62, 65], // G7
  ],
];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class AudioEstudio {
  private ctx: AudioContext | null = null;
  private general: GainNode | null = null;
  private bufferRuido: AudioBuffer | null = null;
  private activo = false;

  // Música
  private temporizador: number | null = null;
  private siguienteTiempo = 0;
  private paso = 0;
  private pista = 0;
  private busMusica: GainNode | null = null;
  private crepitar: AudioBufferSourceNode | null = null;

  get encendido() {
    return this.activo;
  }

  get tocandoMusica() {
    return this.temporizador !== null;
  }

  /** Crea (o reanuda) el contexto. Debe llamarse desde un gesto del usuario. */
  activar() {
    if (!this.ctx) {
      const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Contexto();
      this.general = this.ctx.createGain();
      this.general.gain.value = 0;
      this.general.connect(this.ctx.destination);
      this.bufferRuido = this.crearRuido(2);
    }
    void this.ctx.resume();
    this.activo = true;
    this.general!.gain.setTargetAtTime(VOLUMEN_GENERAL, this.ctx.currentTime, 0.08);
  }

  desactivar() {
    if (!this.ctx || !this.general) return;
    this.activo = false;
    this.detenerMusica();
    this.general.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  /** Cierra el AudioContext (al salir de la página). */
  cerrar() {
    this.detenerMusica();
    void this.ctx?.close();
    this.ctx = null;
    this.general = null;
    this.activo = false;
  }

  // ---------------------------------------------------------------- utilidades

  private crearRuido(segundos: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * segundos, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private listo(): { ctx: AudioContext; salida: AudioNode } | null {
    if (!this.activo || !this.ctx || !this.general) return null;
    return { ctx: this.ctx, salida: this.general };
  }

  /** Nota con envolvente ADSR simple. */
  private tono(
    frecuencia: number,
    inicio: number,
    duracion: number,
    opciones: { tipo?: OscillatorType; volumen?: number; destino?: AudioNode; ataque?: number } = {},
  ) {
    const base = this.listo();
    if (!base) return;
    const { ctx } = base;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = opciones.tipo ?? 'sine';
    osc.frequency.value = frecuencia;
    const volumen = opciones.volumen ?? 0.3;
    const ataque = opciones.ataque ?? 0.005;
    env.gain.setValueAtTime(0, inicio);
    env.gain.linearRampToValueAtTime(volumen, inicio + ataque);
    env.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    osc.connect(env).connect(opciones.destino ?? base.salida);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.05);
  }

  /** Ráfaga de ruido filtrado. */
  private ruido(
    inicio: number,
    duracion: number,
    opciones: { frecuencia?: number; q?: number; tipo?: BiquadFilterType; volumen?: number; destino?: AudioNode } = {},
  ) {
    const base = this.listo();
    if (!base || !this.bufferRuido) return;
    const { ctx } = base;
    const fuente = ctx.createBufferSource();
    fuente.buffer = this.bufferRuido;
    const filtro = ctx.createBiquadFilter();
    filtro.type = opciones.tipo ?? 'bandpass';
    filtro.frequency.value = opciones.frecuencia ?? 2000;
    filtro.Q.value = opciones.q ?? 1;
    const env = ctx.createGain();
    const volumen = opciones.volumen ?? 0.2;
    env.gain.setValueAtTime(volumen, inicio);
    env.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    fuente.connect(filtro).connect(env).connect(opciones.destino ?? base.salida);
    fuente.start(inicio, Math.random() * 1.5);
    fuente.stop(inicio + duracion + 0.05);
  }

  // ---------------------------------------------------------------- efectos

  clic() {
    const base = this.listo();
    if (!base) return;
    this.tono(1400, base.ctx.currentTime, 0.06, { tipo: 'triangle', volumen: 0.12 });
  }

  tecla() {
    const base = this.listo();
    if (!base) return;
    const t = base.ctx.currentTime;
    this.ruido(t, 0.035, { frecuencia: 3200 + Math.random() * 1800, q: 4, volumen: 0.18 });
    this.tono(180 + Math.random() * 60, t, 0.03, { tipo: 'square', volumen: 0.03 });
  }

  goteo(retraso = 0) {
    const base = this.listo();
    if (!base) return;
    const t = base.ctx.currentTime + retraso;
    const osc = base.ctx.createOscillator();
    const env = base.ctx.createGain();
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.08);
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(env).connect(base.salida);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Café: silbido de vapor y goteo durante `segundos`. */
  cafe(segundos: number) {
    const base = this.listo();
    if (!base) return;
    const t = base.ctx.currentTime;
    this.ruido(t, Math.min(1.8, segundos), { frecuencia: 5200, q: 0.7, volumen: 0.07, tipo: 'highpass' });
    for (let i = 0; i < segundos * 3; i++) this.goteo(0.6 + i * 0.33 + Math.random() * 0.1);
  }

  /** Secuencia de arranque del rack: pitidos ascendentes. */
  arranque() {
    const base = this.listo();
    if (!base) return;
    const t = base.ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this.tono(f, t + i * 0.16, 0.14, { tipo: 'square', volumen: 0.05 }));
    this.ruido(t, 1.2, { frecuencia: 180, tipo: 'lowpass', volumen: 0.12 });
  }

  /** Puerta: soplido que abre (barrido de ruido). */
  puerta() {
    const base = this.listo();
    if (!base || !this.bufferRuido) return;
    const { ctx } = base;
    const t = ctx.currentTime;
    const fuente = ctx.createBufferSource();
    fuente.buffer = this.bufferRuido;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 0.8;
    filtro.frequency.setValueAtTime(300, t);
    filtro.frequency.exponentialRampToValueAtTime(2600, t + 1.1);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.22, t + 0.5);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    fuente.connect(filtro).connect(env).connect(base.salida);
    fuente.start(t);
    fuente.stop(t + 1.4);
  }

  // ---------------------------------------------------------------- música lo-fi

  /** Reproduce (o reanuda) la música. Activa el sonido si estaba apagado. */
  reproducirMusica(pista = this.pista) {
    if (!this.activo) this.activar();
    const ctx = this.ctx!;
    this.pista = pista % PISTAS.length;
    if (this.temporizador !== null) return;

    this.busMusica = ctx.createGain();
    this.busMusica.gain.value = 0.9;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 2400; // sonido apagado, "de cinta"
    this.busMusica.connect(filtro).connect(this.general!);

    // Crepitar de vinilo muy bajo
    this.crepitar = ctx.createBufferSource();
    this.crepitar.buffer = this.bufferRuido;
    this.crepitar.loop = true;
    const filtroCrepitar = ctx.createBiquadFilter();
    filtroCrepitar.type = 'highpass';
    filtroCrepitar.frequency.value = 3500;
    const volCrepitar = ctx.createGain();
    volCrepitar.gain.value = 0.015;
    this.crepitar.connect(filtroCrepitar).connect(volCrepitar).connect(this.busMusica);
    this.crepitar.start();

    this.paso = 0;
    this.siguienteTiempo = ctx.currentTime + 0.1;
    // Planificador con margen: agenda las notas un poco por delante.
    this.temporizador = window.setInterval(() => this.planificar(), 25);
  }

  siguientePista() {
    const nueva = (this.pista + 1) % PISTAS.length;
    this.detenerMusica();
    this.reproducirMusica(nueva);
    return nueva;
  }

  detenerMusica() {
    if (this.temporizador !== null) window.clearInterval(this.temporizador);
    this.temporizador = null;
    try {
      this.crepitar?.stop();
    } catch {
      // ya estaba detenido
    }
    this.crepitar = null;
    this.busMusica?.disconnect();
    this.busMusica = null;
  }

  private planificar() {
    const ctx = this.ctx;
    const bus = this.busMusica;
    if (!ctx || !bus) return;
    const corchea = 60 / TEMPO / 2;
    while (this.siguienteTiempo < ctx.currentTime + 0.15) {
      const t = this.siguienteTiempo;
      const enCompas = this.paso % 8;
      const acorde = PISTAS[this.pista][Math.floor(this.paso / 8) % 4];

      // Acorde de piano eléctrico al inicio de cada compás (y un eco suave)
      if (enCompas === 0 || enCompas === 5) {
        acorde.forEach((nota, i) =>
          this.tono(hz(nota), t + i * 0.012, corchea * (enCompas === 0 ? 5 : 3), {
            tipo: i % 2 ? 'triangle' : 'sine',
            volumen: enCompas === 0 ? 0.07 : 0.04,
            ataque: 0.02,
            destino: bus,
          }),
        );
      }
      // Bajo
      if (enCompas === 0 || enCompas === 3 || enCompas === 6) {
        this.tono(hz(acorde[0] - 12), t, corchea * 1.6, { tipo: 'sine', volumen: 0.16, destino: bus });
      }
      // Bombo en 1 y 3 (con un "swing" perezoso)
      if (enCompas === 0 || enCompas === 4 || enCompas === 7) {
        const bombo = ctx.createOscillator();
        const env = ctx.createGain();
        bombo.frequency.setValueAtTime(120, t);
        bombo.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        env.gain.setValueAtTime(0.35, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        bombo.connect(env).connect(bus);
        bombo.start(t);
        bombo.stop(t + 0.25);
      }
      // Caja en 2 y 4
      if (enCompas === 2 || enCompas === 6) this.ruido(t, 0.16, { frecuencia: 1800, q: 0.6, volumen: 0.12, destino: bus });
      // Hi-hat en cada corchea, las impares un poco retrasadas
      const swing = this.paso % 2 ? corchea * 0.12 : 0;
      this.ruido(t + swing, 0.04, { frecuencia: 8000, q: 1.2, volumen: this.paso % 2 ? 0.03 : 0.05, tipo: 'highpass', destino: bus });

      this.siguienteTiempo += corchea;
      this.paso++;
    }
  }
}

export const audio = new AudioEstudio();
export const cantidadPistas = PISTAS.length;
