import { registerSW } from '../utils';

const PageController = {
  render() {
    // Register the Service Worker
    registerSW();

    // Load the current route
    this.loadCurrentRoute();
  },

  /**
   * Determines the current route based on the URI
   */
  currentRoute() {
    return window.location.pathname.replace(/\.[^/.]+$/, '');
  },

  /**
   * Prompts the user to install on home screen
   */
  displayInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      event.prompt();
    });
  },

  /**
   * Lazy loads page controller depending on current route
   */
  loadCurrentRoute() {
    switch(this.currentRoute()) {
      case '/':
        import(/*webpackChunkName: "home" */ './IndexController')
          .then(IndexController => {
            IndexController.default.render();
          });

        break;
      case '/restaurant':
        import(/*webpackChunkName: "restaurant" */ './RestaurantController')
          .then(RestaurantController => {
            // Show the deferred prompt
            this.displayInstallPrompt();

            RestaurantController.default.render();
          });

        break;
    }
  }
};

export default PageController;