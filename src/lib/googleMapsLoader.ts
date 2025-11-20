// Singleton Google Maps Loader to avoid multiple loaders with different options
import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80";

let loaderInstance: Loader | null = null;
let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry", "visualization", "drawing"]
    });
  }
  return loaderInstance;
}

export async function loadGoogleMaps(): Promise<typeof google> {
  if (!loadPromise) {
    const loader = getGoogleMapsLoader();
    loadPromise = loader.load();
  }
  return loadPromise;
}
