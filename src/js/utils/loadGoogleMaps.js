import config from '../config';

/**
 * Appends the Google Maps API script at the end of the document.body 
 * or the specified node, if provided.
 * @param {HTMLElement} node 
 */
const loadGoogleMaps = (node = document.body) => {
  const script = document.createElement('script');

  script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${config.MAPS_KEY}&callback=initMap`);
  script.setAttribute('async', '');
  script.setAttribute('defer', '');
  node.appendChild(script);
};

export default loadGoogleMaps;
