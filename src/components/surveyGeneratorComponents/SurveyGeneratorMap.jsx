import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';

const SurveyGeneratorMap = ({ locations, onClose }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const GREEN_COLOR = '#5DA781';

  // Coordonnées de Fianarantsoa
  const fianarantsoa = {
    lat: -21.4557,
    lng: 47.2901,
  };

  useEffect(() => {
    // Charger Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=marker`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        initializeMap();
      };

      script.onerror = () => {
        console.error('Erreur lors du chargement de Google Maps');
        setMapError(true);
      };

      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        // Créer la carte
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 11,
          center: fianarantsoa,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#c9c9c9' }],
            },
            {
              featureType: 'administrative',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#999' }],
            },
          ],
        });

        // Ajouter les marqueurs pour chaque localité
        if (locations && locations.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();

          locations.forEach((location, index) => {
            const lat = location.latitude || fianarantsoa.lat;
            const lng = location.longitude || fianarantsoa.lng;
            const position = { lat, lng };

            // Créer un marqueur
            const marker = new window.google.maps.Marker({
              position: position,
              map: map,
              title: location.name,
              label: {
                text: String(index + 1),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: GREEN_COLOR,
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              },
            });

            // Créer une InfoWindow
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 12px;
                  max-width: 250px;
                  color: #333;
                ">
                  <div style="
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 8px;
                    color: ${GREEN_COLOR};
                  ">
                    ${location.name}
                  </div>
                  <div style="font-size: 12px; line-height: 1.6; color: #666;">
                    <div style="margin-bottom: 4px;">
                      <strong>Code:</strong> ${location.pcode}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>District:</strong> ${location.adm2}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>Région:</strong> ${location.adm1}
                    </div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                      <strong>Coordonnées:</strong>
                      <div>${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              `,
            });

            // Ajouter le listener pour afficher l'InfoWindow au clic
            marker.addListener('click', () => {
              // Fermer toutes les autres InfoWindows
              infoWindow.open(map, marker);
            });

            // Afficher l'InfoWindow au survol sur desktop
            marker.addListener('mouseover', () => {
              infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
              infoWindow.close();
            });

            bounds.extend(position);
          });

          // Centrer la vue sur tous les marqueurs
          if (locations.length > 1) {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
          } else {
            map.setCenter(locations[0]);
            map.setZoom(12);
          }
        }

        setMapLoaded(true);
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setMapError(true);
      }
    };

    loadGoogleMaps();
  }, [locations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6" style={{ color: GREEN_COLOR }} />
            <h2 className="text-lg font-semibold text-gray-900">
              Lieux d'enquête
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Map Container */}
        {mapError ? (
          <div className="flex-1 min-h-96 flex items-center justify-center bg-gray-100">
            <div className="text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-gray-900 font-medium">
                Erreur de chargement de la carte
              </p>
              <p className="text-sm text-gray-600">
                Vérifiez votre clé API Google Maps dans les variables d'environnement.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Définissez <code className="bg-gray-200 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> dans votre <code className="bg-gray-200 px-2 py-1 rounded">.env</code>
              </p>
            </div>
          </div>
        ) : !mapLoaded ? (
          <div className="flex-1 min-h-96 flex items-center justify-center bg-gray-100">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-700">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="flex-1 min-h-96 bg-gray-100"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Info Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-300">
          <p className="text-sm text-gray-700 text-center font-medium">
            {locations?.length || 0} localité(s) identifiée(s) autour de
            Fianarantsoa
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Cliquez ou survolez les marqueurs pour plus d'informations
          </p>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: GREEN_COLOR,
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
              <span className="text-xs text-gray-600">Zone d'enquête</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyGeneratorMap;