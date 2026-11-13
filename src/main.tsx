import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/editor.css';
import './styles/book.css';
import './styles/print.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
