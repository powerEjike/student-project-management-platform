import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
function render(){ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);}
if(import.meta.env.VITE_USE_EMULATORS==='true'){
 import('./emulatorSetup').then(({connectLocalFirestore})=>{connectLocalFirestore();render();}).catch(()=>{
  document.getElementById('root')!.textContent='Local test services could not start. Check the Firebase emulators and refresh.';
 });
}else render();
