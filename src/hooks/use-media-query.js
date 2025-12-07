import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
  // ✅ Initialiser avec la valeur correcte dès le départ
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    // Synchronisation initiale
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener pour les changements
    const listener = (e) => setMatches(e.matches);

    // Utiliser addEventListener (moderne)
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]); // ✅ CORRECTION: Retirer 'matches' des dépendances

  return matches;
};

export default useMediaQuery;
