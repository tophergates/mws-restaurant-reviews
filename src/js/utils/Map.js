class Map {
  constructor(mount, options) {
    const defaultOptions = { 
      zoom: 12, 
      center: {
        lat: 40.722216,
        lng: -73.987501
      }, 
      disableDefaultUI: true,
      scrollwheel: false,
    };
    
    this._options = Object.assign({}, defaultOptions, options);
    this.element = mount || document.getElementById('map');

    this._googleMap = new google.maps.Map(this.element, this._options);
    this.markers = [];
    this.lastMarker = null;
  }

  get GoogleMap() {
    return this._googleMap;
  }

  addMarkers(data, onClick) {
    let bounds = new google.maps.LatLngBounds();
    this.markers = data.map(item => {
      let marker = this.addMarkerWithInfoWindow(item, onClick);
      bounds.extend(marker.position);

      return marker;
    });

    // Fit the map to the boundaries of the markers
    if (this.markers.length > 0) {
      this.GoogleMap.fitBounds(bounds);
      this.GoogleMap.setZoom(this._options.zoom);
    }
  }

  addMarker({ position, content }) {
    return new google.maps.Marker({
      animation: google.maps.Animation.DROP,
      map: this.GoogleMap,
      position,
      content,
    });
  }

  addMarkerWithInfoWindow(item, onClick) {
    // Create a new marker and define marker properties
    const marker = this.addMarker(item);

    // Create a new infowindow
    const infoWindow = new google.maps.InfoWindow();
    const wrapper = document.createElement('div');

    wrapper.className = 'infoWindow';
    wrapper.appendChild(marker.content);
    infoWindow.setContent(wrapper);

    marker.addListener('click', () => {
      // Close the most recently opened infowindow
      this.lastMarker && this.lastMarker.close();

      // Reset the last clicked infowindow to this one
      this.lastMarker = infoWindow;

      // Pan the map to the center of the clicked marker
      this.GoogleMap.panTo(marker.getPosition());

      // Pan the map downward to accommodate the info window
      this.GoogleMap.panBy(0, -150);

      // Show the infowindow
      onClick(infoWindow, marker);
    });

    return marker;
  }

  resetMarkers() {
    this.markers.forEach((marker, i) => {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    });

    this.markers = [];
  }
}

export default Map;
