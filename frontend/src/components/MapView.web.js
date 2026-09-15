<<<<<<< HEAD
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_CENTER = [0, 0];

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span aria-hidden="true" style="display:block;width:24px;height:24px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;box-shadow:0 2px 7px rgba(0,0,0,.35);transform:rotate(-45deg)"><span style="display:block;width:6px;height:6px;background:white;border-radius:50%;margin:6px"></span></span>`,
    iconAnchor: [12, 24],
    iconSize: [24, 24],
    popupAnchor: [0, -25],
  });
}

function currentLocationIcon() {
  return L.divIcon({
    className: '',
    html: '<span aria-hidden="true" style="display:block;width:16px;height:16px;background:#2676ff;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(38,118,255,.24)"></span>',
    iconAnchor: [11, 11],
    iconSize: [22, 22],
  });
}

function MapClickHandler({ onMapPress }) {
  useMapEvents({
    click(event) {
      onMapPress({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.latitude, location.longitude], 14);
  }, [location, map]);
  return null;
}

export default function PlatformMap({
  location,
  pins,
  onMapPress,
  onDeletePin,
  onEditPin,
  onExternalMapStatusChange,
  reloadToken,
}) {
  const { theme, colors } = useTheme();
  const markerIcon = useMemo(() => pinIcon(colors.primary), [colors.primary]);
  const userIcon = useMemo(() => currentLocationIcon(), []);
  const tileErrorRef = useRef(false);
  const tileEventHandlers = useMemo(
    () => ({
      load: () =>
        onExternalMapStatusChange(tileErrorRef.current ? 'unavailable' : 'available'),
      loading: () => {
        tileErrorRef.current = false;
        onExternalMapStatusChange('loading');
      },
      tileerror: () => {
        tileErrorRef.current = true;
        onExternalMapStatusChange('unavailable');
      },
    }),
    [onExternalMapStatusChange],
  );
  const center = location ? [location.latitude, location.longitude] : DEFAULT_CENTER;

  useEffect(() => {
    onExternalMapStatusChange('loading');
  }, [onExternalMapStatusChange, reloadToken]);

  return (
    <div style={{ height: '100%', position: 'relative', width: '100%' }}>
      <MapContainer
        center={center}
        preferCanvas
        scrollWheelZoom
        style={{ background: colors.background, height: '100%', width: '100%' }}
        zoom={location ? 14 : 2}
      >
=======
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_CENTER = [0, 0];

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span aria-hidden="true" style="display:block;width:24px;height:24px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;box-shadow:0 2px 7px rgba(0,0,0,.35);transform:rotate(-45deg)"><span style="display:block;width:6px;height:6px;background:white;border-radius:50%;margin:6px"></span></span>`,
    iconAnchor: [12, 24],
    iconSize: [24, 24],
    popupAnchor: [0, -25],
  });
}

function currentLocationIcon() {
  return L.divIcon({
    className: '',
    html: '<span aria-hidden="true" style="display:block;width:16px;height:16px;background:#2676ff;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(38,118,255,.24)"></span>',
    iconAnchor: [11, 11],
    iconSize: [22, 22],
  });
}

function MapClickHandler({ onMapPress }) {
  useMapEvents({
    click(event) {
      onMapPress({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.latitude, location.longitude], 14);
  }, [location, map]);
  return null;
}

export default function PlatformMap({ location, pins, onMapPress, onDeletePin, onEditPin }) {
  const { theme, colors } = useTheme();
  const markerIcon = useMemo(() => pinIcon(colors.primary), [colors.primary]);
  const userIcon = useMemo(() => currentLocationIcon(), []);
  const center = location ? [location.latitude, location.longitude] : DEFAULT_CENTER;

  return (
    <div style={{ height: '100%', position: 'relative', width: '100%' }}>
      <MapContainer
        center={center}
        preferCanvas
        scrollWheelZoom
        style={{ background: colors.background, height: '100%', width: '100%' }}
        zoom={location ? 14 : 2}
      >
>>>>>>> c231a7b (feat: frontend v2)
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className={theme === 'dark' ? 'mappin-dark-tiles' : ''}
          crossOrigin
<<<<<<< HEAD
          eventHandlers={tileEventHandlers}
          key={`tiles-${reloadToken}`}
          maxZoom={19}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapPress={onMapPress} />
        <RecenterMap location={location} />

        {location ? (
          <Marker icon={userIcon} position={[location.latitude, location.longitude]} zIndexOffset={1000}>
=======
          maxZoom={19}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapPress={onMapPress} />
        <RecenterMap location={location} />

        {location ? (
          <Marker icon={userIcon} position={[location.latitude, location.longitude]} zIndexOffset={1000}>
>>>>>>> c231a7b (feat: frontend v2)
            <Popup>Você está aqui</Popup>
          </Marker>
        ) : null}

        {pins.map((pin) => (
          <Marker icon={markerIcon} key={pin._id} position={[pin.latitude, pin.longitude]}>
            <Popup>
              <div style={{ minWidth: 170 }}>
                <strong style={{ color: '#12213a', display: 'block', fontSize: 15 }}>{pin.name}</strong>
                <p style={{ color: '#40516a', margin: '6px 0 10px', whiteSpace: 'pre-wrap' }}>{pin.description}</p>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button
                    aria-label={`Editar ${pin.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditPin(pin);
                    }}
                    style={{ background: 'transparent', border: 0, color: '#2676ff', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    aria-label={`Excluir ${pin.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeletePin(pin);
                    }}
                    style={{ background: 'transparent', border: 0, color: '#b42318', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style>
        {`.leaflet-top.leaflet-left { top: 72px; }
          ${theme === 'dark' ? '.mappin-dark-tiles { filter: brightness(.72) contrast(1.18) saturate(.65); }' : ''}`}
      </style>
    </div>
  );
}
