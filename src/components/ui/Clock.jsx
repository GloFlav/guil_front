import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Fonction pour obtenir le nom de la ville à partir de la timezone
const getCityFromTimezone = (timezone) => {
  if (!timezone) return 'Local';
  
  // Extraire la ville de la timezone (ex: "Europe/Paris" → "Paris")
  const parts = timezone.split('/');
  let city = parts[parts.length - 1];
  
  // Remplacer les underscores par des espaces et formater
  city = city.replace(/_/g, ' ');
  
  // Cas spéciaux pour certaines timezones
  const cityMappings = {
    'New_York': 'New York',
    'Los_Angeles': 'Los Angeles',
    'Sao_Paulo': 'São Paulo',
    'Mexico_City': 'Mexico City',
    'Buenos_Aires': 'Buenos Aires',
    'Ho_Chi_Minh': 'Ho Chi Minh Ville',
    'Kuala_Lumpur': 'Kuala Lumpur',
    'Port_of_Spain': 'Port of Spain',
    'Noumea': 'Nouméa',
    'Tahiti': 'Papeete',
    'Marquesas': 'Marquises',
    'Gambier': 'Gambier',
    'Guadeloupe': 'Pointe-à-Pitre',
    'Martinique': 'Fort-de-France',
    'Cayenne': 'Cayenne',
    'Reunion': 'Saint-Denis',
    'Mayotte': 'Mamoudzou',
    'Wallis': 'Mata-Utu',
    'Kerguelen': 'Port-aux-Français',
    'Miquelon': 'Saint-Pierre'
  };
  
  return cityMappings[parts[parts.length - 1]] || city;
};

export const Clock = ({ 
  timezone = null, 
  cityName = null, 
  cabinetName = null,
  utcOffset = null,
  zoneName = null 
}) => {
  // Utiliser la timezone fournie ou celle du navigateur par défaut
  const actualTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const [time, setTime] = useState(DateTime.now().setZone(actualTimezone));
  
  // Déterminer le nom à afficher (priorité à la zone)
  const displayName = zoneName || cityName || getCityFromTimezone(actualTimezone);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(DateTime.now().setZone(actualTimezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [actualTimezone]);

  const jour = jours[time.weekday % 7];
  const heures = time.toFormat('HH');
  const minutes = time.toFormat('mm');
  const secondes = time.toFormat('ss');
  const dateStr = time.setLocale('fr').toFormat('dd LLL yyyy');

  return (
    <div className="clock-wrapper font-mono">
      <div className="clock-time-container">
        <div className="clock-time">
          <span className="clock-city-label" title={zoneName || actualTimezone}>
            {displayName}
            {/* {utcOffset && (
              <span className="text-xs text-gray-400 ml-1">({utcOffset})</span>
            )} */}
          </span>
          {[...heures].map((d, i) => <Digit className="px-[1px]" key={`h${i}`} d={d} />)}
          <span className="clock-colon">:</span>
          {[...minutes].map((d, i) => <Digit className="px-[1px]" key={`m${i}`} d={d} />)}
          <span className="clock-colon">:</span>
          {[...secondes].map((d, i) => <Digit className="px-[1px]" key={`s${i}`} d={d} />)}
        </div>
        <span className="clock-date">{jour}, {dateStr}</span>
      </div>
    </div>
  );
};

const Digit = ({ d }) => (
  <div className="digit-container">
    <div className="digit-slide"><span>{d}</span></div>
  </div>
);