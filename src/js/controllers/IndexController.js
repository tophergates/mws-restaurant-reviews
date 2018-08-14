import { DBHelper, makeImage, lazyLoadImages, populateSelectBox, Map } from '../utils';
import '../../styles/home.scss';

const restaurantImageHTML = ({ id, altText }, className) => {
  const image = makeImage({
    id,
    src: DBHelper.restaurantImgUrl({ id, size: 'small' }),
    sizes: '100vw',
    alt: altText,
    className
  });

  return `
    <div class="image__container">
      ${image}
    </div>
  `;
};

const restaurantItemHTML = restaurant => {
  const { id, address, name, neighborhood } = restaurant;
  const url = DBHelper.restaurantUrl(id);

  // TODO: Figure out how to include star ratings
  return `
    <li class="restaurants-list__item">
      ${restaurantImageHTML(restaurant, 'restaurant-item__image')}
      <div class="restaurant-item__info">
        <h2 class="restaurant-item__title">${name}</h2>
        <span class="restaurant-item__neighborhood">${neighborhood}</span>
        <address class="restaurant-item___address">${address}</address>
        <a class="restaurant-item__detail-link" href="${url}" title="View additional details about ${name}">Details</a>
      </div>
    </li>
  `;
};

const restaurantListHTML = restaurants => {
  return restaurants.map(restaurantItemHTML).join('');
};

const IndexController = {
  state: {
    restaurants: null,
    errors: [],
    neighborhoodFilter: '',
    cuisineFilter: '',
    isLoading: true
  },

  map: null,

  elements: {
    cuisineSelect: document.getElementById('cuisine'),
    filterForm: document.querySelector('.filters'),
    neighborhoodSelect: document.getElementById('neighborhood'),
    restaurantsList: document.querySelector('.restaurants-list'),
    restaurantResult: document.querySelector('.restaurant-result')
  },

  /**
   * Sets the state and rerenders.
   * @param {function} fn
   */
  setState(fn) {
    const prevState = this.state;
    this.state = Object.assign(prevState, fn(prevState));
    this.render();
  },

  /**
   * Initiates the first render, then attempts to fetch restaurants update the state.
   */
  init() {
    const { filterForm } = this.elements;

    this.map = new Map(document.querySelector('.map'));
    this.render();

    DBHelper.fetchRestaurants()
      .then(restaurants => {
        this.setState(({ isLoading }) => ({
          restaurants,
          errors: [],
          isLoading: !isLoading
        }));
      })
      .catch(error => {
        this.setState(({ errors, isLoading }) => ({
          errors: [...errors, error],
          isLoading: !isLoading
        }));
      });

    filterForm.addEventListener('change', this.handleFilterUpdates.bind(this));
  },

  /**
   * Checks if the the loading state is true or if there are errors.
   * If loading or there are errors, it returns false. Otherwise, true.
   * This also populates the restaurant result element depending on the state.
   */
  notLoadingNoErrors() {
    const { isLoading, errors } = this.state;
    const { restaurantResult } = this.elements;

    restaurantResult.className = 'restaurant-result';

    if (isLoading) {
      restaurantResult.classList.add('info');
      restaurantResult.textContent = 'Please wait while we whip up something delicious...';
      return false;
    } else if (errors && errors.length > 0) {
      const html = errors.map(error => `<span>${error}</span>`).join('');
      restaurantResult.classList.add('error');
      restaurantResult.innerHTML = html;
      return false;
    }

    return true;
  },

  populateFilterForm() {
    const { cuisineFilter, neighborhoodFilter, restaurants } = this.state;
    const neighborhoods = [...new Set(restaurants.map(r => r.neighborhood))];
    const cuisines = [...new Set(restaurants.map(r => r.cuisine_type))];
    const { neighborhoodSelect, cuisineSelect } = this.elements;

    populateSelectBox(neighborhoodSelect, neighborhoods, neighborhoodFilter);
    populateSelectBox(cuisineSelect, cuisines, cuisineFilter);
  },

  handleFilterUpdates(event) {
    event.stopPropagation();

    const { neighborhoodSelect, cuisineSelect } = this.elements;
    const neighborhoodFilter = neighborhoodSelect[neighborhoodSelect.selectedIndex].value;
    const cuisineFilter = cuisineSelect[cuisineSelect.selectedIndex].value;

    this.setState(() => ({
      neighborhoodFilter,
      cuisineFilter
    }));
  },

  updateMap(restaurants) {
    if (!this.map) return;

    const markers = restaurants.map(r => ({
      position: r.latlng,
      content: `
        <div class="infoWindow">
          <h2 class="infoWindow__title">${r.name}</h2>
          <address class="infoWindow__address">${r.address}</address>
          <a href="${DBHelper.restaurantUrl(
            r.id
          )}" class="infoWindow__link" title="View more information about ${
        r.name
      }">View Details</a>
        </div>
      `
    }));

    // Reset the map
    this.map.removeMarkers();

    // Add the new markers
    this.map.addMarkers(markers);
  },

  filterRestaurants() {
    const { cuisineFilter, neighborhoodFilter, restaurants } = this.state;
    let filteredRestaurants = [...restaurants];

    if (neighborhoodFilter && neighborhoodFilter !== '') {
      // Filter restaurants by neighborhood
      filteredRestaurants = filteredRestaurants.filter(r => r.neighborhood === neighborhoodFilter);
    }

    if (cuisineFilter && cuisineFilter !== '') {
      // Filter restaurants by cuisine
      filteredRestaurants = filteredRestaurants.filter(r => r.cuisine_type === cuisineFilter);
    }

    return filteredRestaurants;
  },

  populateRestaurantsList() {
    const { restaurantResult, restaurantsList } = this.elements;
    const filteredRestaurants = this.filterRestaurants();
    const rCount = filteredRestaurants && filteredRestaurants.length;

    this.updateMap(filteredRestaurants);
    restaurantResult.innerHTML = `
      Displaying <span class="restaurant-count">${rCount}</span>
      delicious restaurant${rCount === 1 ? '' : 's'}
    `;
    restaurantsList.innerHTML = restaurantListHTML(filteredRestaurants);
    lazyLoadImages();
  },

  /**
   * Kicks of rendering the page. It is called whenever the state is updated.
   */
  render() {
    if (this.notLoadingNoErrors()) {
      // Populate the restaurant filters
      this.populateFilterForm();

      // Populate the restaurants list and lazy load the images
      this.populateRestaurantsList();
    }
  }
};

export default IndexController;
