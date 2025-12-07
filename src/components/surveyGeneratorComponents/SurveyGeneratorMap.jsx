import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, AlertCircle, Loader2 } from 'lucide-react';

const SurveyGeneratorMap = ({ locations, onClose }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);

  const GREEN_COLOR = '#5DA781';

  // Centre par défaut (Madagascar global)
  const defaultCenter = {
    lat: -18.7669,
    lng: 46.8691,
  };

  // Tracé SVG pour une grande épingle pointue
  const PIN_SVG_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

  useEffect(() => {
    let intervalId = null;

    // 1. Fonction pour effectuer le Géocodage (Nom -> Coordonnées)
    const geocodeLocation = (geocoder, map, location, index, bounds) => {
      return new Promise((resolve) => {
        // Construction de l'adresse pour aider Google
        const addressQuery = `${location.name}, ${location.adm2 || ''}, ${location.adm1 || ''}, Madagascar`;

        geocoder.geocode({ address: addressQuery }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const position = results[0].geometry.location;

            // Création du marqueur avec SVG personnalisé
            const marker = new window.google.maps.Marker({
              map: map,
              position: position,
              title: location.name,
              label: {
                text: String(index + 1),
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'sans-serif'
              },
              icon: {
                path: PIN_SVG_PATH,
                fillColor: GREEN_COLOR,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 2.5,
                anchor: new window.google.maps.Point(12, 23),
                labelOrigin: new window.google.maps.Point(12, 9)
              },
              zIndex: 999 - index,
            });

            // InfoWindow
            const contentString = `
              <div style="padding: 8px; color: #333; font-family: sans-serif; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: ${GREEN_COLOR}; font-weight: bold; font-size: 16px;">
                  ${index + 1}. ${location.name}
                </h3>
                <p style="margin: 0 0 5px 0; font-size: 13px; color: #555; line-height: 1.4;">
                   ${results[0].formatted_address}
                </p>
                ${location.adm2 ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                   District: <strong>${location.adm2}</strong><br/>
                   Région: <strong>${location.adm1 || 'N/A'}</strong>
                </div>` : ''}
              </div>
            `;

            const infoWindow = new window.google.maps.InfoWindow({
              content: contentString,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            bounds.extend(position);
            resolve(true);
          } else {
            console.warn(`Géocodage échoué pour ${location.name}: ${status}`);
            resolve(false); 
          }
        });
      });
    };

    // 2. Initialisation de la carte (Appelée une fois l'API prête)
    const initMap = async () => {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      try {
        // CORRECTION MAJEURE: On vérifie l'existence du constructeur avant d'instancier
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 6,
          center: defaultCenter,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapId: 'SURVEY_MAP_GEN_V2', 
        });

        const geocoder = new window.google.maps.Geocoder();
        const bounds = new window.google.maps.LatLngBounds();

        if (locations && locations.length > 0) {
          const promises = locations.map((loc, idx) => 
            geocodeLocation(geocoder, map, loc, idx, bounds)
              .then(res => {
                setGeocodingProgress(prev => prev + 1);
                return res;
              })
          );

          await Promise.all(promises);

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            // Petit hack pour éviter le zoom trop fort si un seul point
            const listener = window.google.maps.event.addListener(map, "idle", () => { 
              if (map.getZoom() > 14) map.setZoom(14); 
              window.google.maps.event.removeListener(listener); 
            });
          }
        }
        
        setMapLoaded(true);

      } catch (error) {
        console.error('Erreur exécution initMap:', error);
        setMapError(true);
      }
    };

    // 3. Logique de chargement robuste avec Intervalle
    const loadScript = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Clé API manquante");
        setMapError(true);
        return;
      }

      // Fonction pour vérifier si Google Maps est PRÊT (pas juste chargé)
      const checkGoogleMapsLoaded = () => {
        // On vérifie spécifiquement que le constructeur Map existe
        if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.Geocoder) {
          if (intervalId) clearInterval(intervalId);
          initMap();
          return true;
        }
        return false;
      };

      // Si déjà chargé et prêt
      if (checkGoogleMapsLoaded()) return;

      // Sinon, on charge le script si ce n'est pas déjà fait
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        // Ajout de libraries=places,marker pour être sûr
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setMapError(true);
        document.head.appendChild(script);
      }

      // On lance un intervalle pour vérifier toutes les 100ms si l'API est prête
      // C'est ce qui répare l'erreur "is not a constructor"
      intervalId = setInterval(checkGoogleMapsLoaded, 100);
    };

    loadScript();

    // Nettoyage lors du démontage du composant
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [locations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: GREEN_COLOR }} />
            <h2 className="text-lg font-semibold text-gray-900">
              Carte des localités
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100 w-full">
          {mapError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
              <p className="font-semibold text-gray-900">Erreur Google Maps</p>
              <p className="text-sm text-gray-600 mt-1">
                Vérifiez votre clé API et l'activation de "Geocoding API".
              </p>
            </div>
          ) : (
            <>
              {!mapLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 space-y-3">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  <p className="text-sm text-gray-600 font-medium">
                    Localisation des lieux en cours...
                    {locations && locations.length > 0 && (
                      <span className="block text-xs text-gray-400 mt-1">
                        {geocodingProgress} / {locations.length} trouvés
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div ref={mapRef} className="w-full h-full" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t text-center text-xs text-gray-500 flex justify-between px-6">
            <span>{locations?.length || 0} lieux demandés</span>
            <span className="text-green-700 font-medium flex items-center gap-1">
              <MapPin size={12} /> Mode: Géocodage par nom
            </span>
        </div>
      </div>
    </div>
  );
};

export default SurveyGeneratorMap;