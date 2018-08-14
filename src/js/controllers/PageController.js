import registerSW from '../utils/registerSW';

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
   * Lazy loads page controller depending on current route
   */
  loadCurrentRoute() {
    switch (this.currentRoute()) {
      case '/':
        import(/*webpackChunkName: "home" */ './IndexController').then(IndexController => {
          IndexController.default.init();
        });

        break;
      case '/restaurant':
        import(/*webpackChunkName: "restaurant" */ './RestaurantController').then(
          RestaurantController => {
            RestaurantController.default.init();
          }
        );

        break;
    }
  }
};

export default PageController;
