import { useBook } from './hooks/useBook';
import { Editor } from './editor/Editor';
import { Icon } from './components/Icon';

export default function App() {
  const { data, error, retry } = useBook();
  if (error) return <main className="load-screen"><Icon name="info" size={36} /><h1>No se pudo abrir el libro</h1><p>Revisa los archivos indicados y vuelve a intentarlo.</p><pre>{error}</pre><button className="button" onClick={retry}>Volver a cargar</button></main>;
  if (!data) return <main className="load-screen" role="status"><Icon name="book" size={40} /><h1>Abriendo tu libro…</h1><p>Leyendo el contenido local.</p></main>;
  return <Editor data={data} />;
}
