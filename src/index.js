import config from './js/config';
import PageController from './js/controllers/PageController';
import { registerSW } from './js/utils';
import './styles/main.scss';

// If we are in production, register the service worker
if (config.MODE === 'production') {
  registerSW();
}

// Render the application
PageController.render();
