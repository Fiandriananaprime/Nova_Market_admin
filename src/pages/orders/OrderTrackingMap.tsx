import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { Compass, Maximize2, Minimize2, Navigation, Route, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TrackingPoint } from '@/type/order/order';
import './orderTrackingMap.css';

type Position = [number, number];

const DEFAULT_CENTER: Position = [-18.8925, 47.521];

function isValidPoint(point: TrackingPoint): boolean {
  return Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && point.longitude >= -180
    && point.longitude <= 180;
}

function MapViewport({
  positions,
  currentPosition,
  isFollowing,
}: {
  positions: Position[];
  currentPosition: Position | null;
  isFollowing: boolean;
}) {
  const map = useMap();
  const hasInitialView = useRef(false);

  useEffect(() => {
    if (hasInitialView.current || positions.length === 0) return;

    hasInitialView.current = true;
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [48, 48], maxZoom: 15 });
    } else {
      map.setView(positions[0], 15);
    }
  }, [map, positions]);

  useEffect(() => {
    if (isFollowing && currentPosition) {
      map.flyTo(currentPosition, Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [currentPosition, isFollowing, map]);

  return null;
}

function MapSizeUpdater({ fullscreen }: { fullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [fullscreen, map]);

  return null;
}

function MapActions({
  positions,
  currentPosition,
  isFollowing,
  onToggleFollowing,
  onStopFollowing,
  fullscreen,
  onToggleFullscreen,
}: {
  positions: Position[];
  currentPosition: Position | null;
  isFollowing: boolean;
  onToggleFollowing: () => void;
  onStopFollowing: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const map = useMap();
  const { t } = useTranslation();

  const fitRoute = () => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [48, 48], maxZoom: 15 });
    } else if (positions.length === 1) {
      map.flyTo(positions[0], 15, { duration: 0.8 });
    } else {
      map.setView(DEFAULT_CENTER, 13);
    }
    onStopFollowing();
  };

  const centerCurrent = () => {
    if (currentPosition) {
      map.flyTo(currentPosition, Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  };

  return (
    <div className="absolute right-3 top-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={fitRoute}
          aria-label={t('Fit delivery route')}
          title={t('Fit delivery route')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-card"
        >
          <Compass size={16} className="text-primary" />
          <span className="hidden sm:inline">{t('Overview')}</span>
        </button>
        <button
          type="button"
          onClick={centerCurrent}
          disabled={!currentPosition}
          aria-label={t('Center on courier')}
          title={t('Center on courier')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary px-3 text-xs font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Navigation size={16} />
          <span className="hidden sm:inline">{t('Center')}</span>
        </button>
        <button
          type="button"
          onClick={onToggleFollowing}
          aria-pressed={isFollowing}
          aria-label={t(isFollowing ? 'Stop following courier' : 'Follow courier')}
          title={t(isFollowing ? 'Stop following courier' : 'Follow courier')}
          disabled={!currentPosition}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-md backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isFollowing
              ? 'border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-300'
              : 'border-border/80 bg-card/95 text-foreground hover:bg-card'
          }`}
        >
          <Route size={16} />
          <span className="hidden sm:inline">
            {t(isFollowing ? 'Following' : 'Follow')}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={t(fullscreen ? 'Close map fullscreen' : 'Open map fullscreen')}
          title={t(fullscreen ? 'Close map fullscreen' : 'Open map fullscreen')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-card"
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span className="hidden sm:inline">{t(fullscreen ? 'Exit fullscreen' : 'Fullscreen')}</span>
        </button>
      </div>
    </div>
  );
}

export function OrderTrackingMap({
  orderId,
  points,
  currentLocation,
  destination,
  status,
  loading,
}: {
  orderId: string;
  points: TrackingPoint[];
  currentLocation?: TrackingPoint | null;
  destination: { latitude?: number | null; longitude?: number | null };
  status: string;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [inlineHost, setInlineHost] = useState<HTMLDivElement | null>(null);

  const validPoints = useMemo(() => points.filter(isValidPoint), [points]);
  const currentPosition = useMemo<Position | null>(() => {
    if (currentLocation && isValidPoint(currentLocation)) {
      return [currentLocation.latitude, currentLocation.longitude];
    }

    const latestPoint = validPoints.at(-1);
    return latestPoint ? [latestPoint.latitude, latestPoint.longitude] : null;
  }, [currentLocation, validPoints]);
  const destinationPosition = useMemo<Position | null>(() => {
    const { latitude, longitude } = destination;
    if (
      typeof latitude !== 'number'
      || typeof longitude !== 'number'
      || !Number.isFinite(latitude)
      || !Number.isFinite(longitude)
      || latitude < -90
      || latitude > 90
      || longitude < -180
      || longitude > 180
    ) {
      return null;
    }

    return [latitude, longitude];
  }, [destination]);
  const route = useMemo(() => {
    const positions = validPoints.map(
      (point): Position => [point.latitude, point.longitude],
    );
    const latest = positions.at(-1);

    if (
      currentPosition
      && (!latest || latest[0] !== currentPosition[0] || latest[1] !== currentPosition[1])
    ) {
      positions.push(currentPosition);
    }

    return positions;
  }, [currentPosition, validPoints]);
  const viewPositions = useMemo(
    () => destinationPosition ? [...route, destinationPosition] : route,
    [destinationPosition, route],
  );

  useEffect(() => {
    if (!fullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreen]);

  const mapPanel = (
    <section
      aria-label={t('Delivery route')}
      className={
        fullscreen
          ? 'fixed inset-0 z-[1200] flex h-dvh w-screen flex-col overflow-hidden bg-background'
          : 'mb-5 overflow-hidden rounded-xl border border-border bg-card'
      }
    >
      {fullscreen && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary-foreground">
              {t('Delivery tracking')} #{orderId}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('Delivery status')}: {status}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label={t('Close map fullscreen')}
            title={t('Close map fullscreen')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-secondary-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
      )}

      <div className={fullscreen ? 'relative min-h-0 flex-1' : 'relative h-[460px] sm:h-[540px] lg:h-[620px]'}>
        <MapContainer
          center={currentPosition ?? destinationPosition ?? DEFAULT_CENTER}
          zoom={currentPosition ? 14 : 13}
          scrollWheelZoom
          className="admin-order-leaflet-map"
        >
          <TileLayer
            attribution='Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <MapViewport
            positions={viewPositions}
            currentPosition={currentPosition}
            isFollowing={isFollowing}
          />
          <MapSizeUpdater fullscreen={fullscreen} />
          {route.length > 1 && (
            <Polyline
              positions={route}
              pathOptions={{ color: '#147d76', weight: 5, opacity: 0.9 }}
            />
          )}
          {route.length > 1 && (
            <CircleMarker
              center={route[0]}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#147d76', fillOpacity: 1 }}
            >
              <Popup>{t('Route start')}</Popup>
            </CircleMarker>
          )}
          {currentPosition && (
            <CircleMarker
              center={currentPosition}
              radius={10}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#e11d48', fillOpacity: 1 }}
            >
              <Popup>
                <div>
                  <p className="font-semibold">{t('Current location')}</p>
                  <p>{currentPosition[0].toFixed(5)}, {currentPosition[1].toFixed(5)}</p>
                </div>
              </Popup>
            </CircleMarker>
          )}
          {destinationPosition && (
            <CircleMarker
              center={destinationPosition}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }}
            >
              <Popup>{t('Destination')}</Popup>
            </CircleMarker>
          )}
          <MapActions
            positions={viewPositions}
            currentPosition={currentPosition}
            isFollowing={isFollowing}
            onToggleFollowing={() => setIsFollowing((value) => !value)}
            onStopFollowing={() => setIsFollowing(false)}
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((value) => !value)}
          />
        </MapContainer>

        {loading && (
          <span className="absolute left-3 top-3 z-[1000] rounded-lg bg-card/95 px-3 py-2 text-xs font-medium text-primary shadow">
            {t('Refreshing location...')}
          </span>
        )}

        {route.length === 0 && (
          <span className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-card/95 px-3 py-2 text-center text-xs font-medium text-secondary-foreground shadow">
            {t('No tracking coordinates available')}
          </span>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] hidden items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs text-secondary-foreground shadow-md backdrop-blur sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
          {t('Route start')}
          <span className="ml-2 h-2.5 w-2.5 rounded-full bg-rose-600" />
          {t('Current location')}
          {destinationPosition && (
            <>
              <span className="ml-2 h-2.5 w-2.5 rounded-full bg-blue-600" />
              {t('Destination')}
            </>
          )}
        </div>
      </div>

      {!fullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs">
          <span className="font-medium text-secondary-foreground">
            {t('Delivery status')}: {status}
          </span>
          <span className="text-muted-foreground">
            {currentPosition
              ? `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`
              : t('Location unavailable')}
          </span>
        </div>
      )}
    </section>
  );

  return (
    <>
      <div ref={setInlineHost} className={fullscreen ? 'h-0' : undefined} />
      {inlineHost && createPortal(mapPanel, fullscreen ? document.body : inlineHost)}
    </>
  );
}
