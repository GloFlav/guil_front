import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx'
// import Accueil from './pages/accueil/Accueil.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {HeroUIProvider} from '@heroui/react'
import { SocketProvider } from '@/context/SocketProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename='/'>
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <SocketProvider>
          <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover style={{ zIndex: 100000 }} />
          <App />
        </SocketProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  </BrowserRouter>,
)
