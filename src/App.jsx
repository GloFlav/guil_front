import './App.css';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/Sidebar';

// Composants toujours chargés
import AppSidebar from './components/common/app-sidebar';
import usePageViews from './hooks/usePageViews';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ✅ LAZY LOADING - Pages chargées à la demande
// Auth pages
const GenerateurQuestionnaire = lazy(() => import('./pages/surveyGenerator/surveyGenerator'));
const AnalyseDeDonnees = lazy(() => import('./pages/dataAnalysis/DataAnalysis'));

function App() {
  usePageViews();
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="content-with-inset">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* ===== ROUTES PUBLIQUES ===== */}
              <Route path="/generateur-questionnaire" element={<GenerateurQuestionnaire />} />
              <Route path="/analyse-de-donnees" element={<AnalyseDeDonnees />} />

              {/* ===== 404 NOT FOUND ===== */}
            </Routes>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;