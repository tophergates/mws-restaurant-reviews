import config from './js/config';
import PageController from './js/controllers/PageController';
import registerSW from './js/utils/registerSW';
import './styles/main.scss';

/**
 * TODO LIST
 * 1. Home Page
 *    - Functionality
 *      - Finish the IndexController
 * 
 *    - Accessibility
 *      - Make the filter, map, and list buttons accessible
 * 
 * 2. Restaurant Page
 *    -
 * 
 * 3. Minify Output
 *    - JSON minifaction
 *    - Image minification
 */



// If we are in production, register the service worker
if (config.MODE === 'production') {
  registerSW();
}

// Render the application
PageController.render();
