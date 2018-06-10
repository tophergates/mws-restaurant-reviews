import L from 'leaflet';

// Workaround to get markers working with leaflet when 
// bundling javascript with Webpack. Attribution:
// https://github.com/PaulLeCam/react-leaflet/issues/255
import marker from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker,
    shadowUrl: markerShadow
});

class Map {
  constructor(mount, options) {
    const defaultOptions = {
      center: [40.722216, -73.987501],
      zoom: 12,
      scrollWheelZoom: false,
    };

    options = Object.assign({}, defaultOptions, options);

    // Create the map
    this._map = L.map(mount, options);
    this._markers = [];

    // Add map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      foo: 'bar'
    }).addTo(this.Map);
  }

  addMarkers(markers, callback) {
    const bounds = new L.LatLngBounds();

    this._markers = markers.map(({position, content }) => {
      bounds.extend(position);
      return this.addMarker(position, content, callback);
    });

    if (this._markers.length > 0) {
      this.Map.fitBounds(bounds);
      this.Map.setZoom(12);
    }
  }

  addMarker(position, content = null, callback) {
    return L.marker(position)
      .addTo(this.Map)
      .bindPopup(content)
      .on('click', event => {
        this.Map.setView(event.target.getLatLng());

        if (callback) {
          return callback(event);
        }
      });
  }

  removeMarkers() {
    this._markers.forEach(marker => {
      this.Map.removeLayer(marker);
    });
  }

  get Map() {
    return this._map;
  }
}

export default Map;
