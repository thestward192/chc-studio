import { Component, type ReactNode } from 'react';

/** Si una escena 3D falla (contexto WebGL perdido, shader), se quita sin romper la página. */
export class LimiteError extends Component<
  { children: ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
