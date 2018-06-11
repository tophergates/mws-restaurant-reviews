import {
  DBHelper,
  lazyLoadImages,
  makeImage, 
  makeStarRating,
  Map,
} from '../utils';

import '../../styles/home.scss';

/**
 * Utility function to populate a select box with values.
 */
const populateSelectBox = (selectEl, values) => {
  // Create a document fragment and option element
  const docFrag = document.createDocumentFragment();
  const optionEl = document.createElement('option');

  // Add an option for each value
  values.forEach(value => {
    // Clone the option element
    let option = optionEl.cloneNode();

    // Set the textContent and value
    option.textContent = value;
    option.value = value;

    // Append the option to the document fragment
    docFrag.appendChild(option);
  });

  // Append the document fragment to the select box
  selectEl.appendChild(docFrag);
};

/**
 * Creates an image inside of a container
 * Displays a loading spinner before the image 
 * has finished loading.
 */
const createImage = ({ id, altText }, className) => {
  const imageContainer = document.createElement('div');
  const loadingIndicator = document.createElement('span');

  imageContainer.className = 'image__container';
  loadingIndicator.className = 'spinner';
  imageContainer.appendChild(loadingIndicator);
  imageContainer.appendChild(makeImage({
    id,
    src: DBHelper.restaurantImgUrl({id, size: 'small' }),
    sizes: "100vw",
    alt: altText,
    className
  }, image => {
    loadingIndicator.parentNode && 
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    
    imageContainer.appendChild(image);
  }));
  
  return imageContainer;
};

/**
 * Generates the html for one restaurant list item.
 */
const createRestaurant = restaurant => {
  // Create the necessary elements for later
  const span = document.createElement('span');
  const li = document.createElement('li');
  const body = document.createElement('div');
  const name = document.createElement('h2');
  const neighborhood = span.cloneNode();
  const address = document.createElement('address');
  const more = document.createElement('a');
  let avgReview;

  // Give the list item a class
  li.classList.add('restaurants-list__item');

  // Content body
  body.className = 'restaurant-item__info';

  // Restaurant title
  name.textContent = restaurant.name;
  name.className = 'restaurant-item__title';

  // Restaurant neighborhood
  neighborhood.textContent = restaurant.neighborhood;
  neighborhood.className = 'restaurant-item__neighborhood';

  // Restaurant address
  address.className = 'restaurant-item___address';
  address.textContent = restaurant.address;

  // Average Review
  avgReview = makeStarRating(restaurant.averageReview);
  avgReview.setAttribute('aria-label', 'Average review');

  // View More button
  more.textContent = 'Details';
  more.href = DBHelper.restaurantUrl(restaurant);
  more.title = `View additional details about ${restaurant.name}`;
  more.className = 'restaurant-item__detail-link';

  // Append content to the body
  body.append(name);
  body.append(avgReview);
  body.append(neighborhood);
  body.append(address);
  body.append(more);

  li.append(createImage(restaurant, 'restaurant-item__image'));
  li.append(body);

  return li;
};

const IndexController = {
  map: null,
  restaurants: null,
  pageElements: {
    cuisineSelect: document.getElementById('cuisine'),
    filterForm: document.querySelector('.filters'),
    neighborhoodSelect: document.getElementById('neighborhood'),
    restaurantsList: document.querySelector('.restaurants-list'),
    restaurantResultCount: document.querySelector('.restaurant-count'),
  },
  
  render() {
    DBHelper.fetchRestaurants()
      .then(restaurants => {
        const { mobileButtonBar, filterForm } = this.pageElements;

        // Save restaurants for later
        this.restaurants = restaurants;

        // Populate filters and display the restaurants
        this.populateFilterForm();
        this.populateRestaurantsList();
        this.loadMap();

        // Attach event listeners for the mobile view
        filterForm.addEventListener('change', this.handleFilterUpdates.bind(this));
      })
      .catch(console.error);
  },

  populateFilterForm() {
    const neighborhoods = [...new Set(this.restaurants.map(r => r.neighborhood))];
    const cuisines = [...new Set(this.restaurants.map(r => r.cuisine_type))];
    const { neighborhoodSelect, cuisineSelect } = this.pageElements;

    populateSelectBox(neighborhoodSelect, neighborhoods);
    populateSelectBox(cuisineSelect, cuisines);
  },

  handleFilterUpdates(event) {
    const { neighborhoodSelect, cuisineSelect } = this.pageElements;
    const neighborhood = neighborhoodSelect[neighborhoodSelect.selectedIndex].value;
    const cuisine = cuisineSelect[cuisineSelect.selectedIndex].value;

    DBHelper.fetchRestaurants()
      .then(restaurants => {
        if (!restaurants) throw Error('Restaurants could not be displayed');

        restaurants = (cuisine !== 'all') ? 
          restaurants.filter(r => r.cuisine_type === cuisine) : 
          restaurants;
        
        restaurants = (neighborhood !== 'all') ?
          restaurants.filter(r => r.neighborhood === neighborhood) :
          restaurants;
        
        this.restaurants = restaurants;
        this.populateRestaurantsList();
      })
      .catch(console.error);
    
    event.stopPropagation();
  },

  populateRestaurantsList() {
    if (this.restaurants) {
      const { restaurantsList, restaurantResultCount } = this.pageElements;
      const docFrag = document.createDocumentFragment();
      const rCount = this.restaurants.length;

      this.restaurants.forEach(r => {
        docFrag.appendChild(createRestaurant(r));
      });

      this.resetRestaurants();

      restaurantsList.appendChild(docFrag);
      restaurantResultCount.innerHTML = `
        Displaying <span class="restaurant-count__text">${rCount}</span> 
        restaurant${rCount === 1 ? '' : 's'}
      `;

      lazyLoadImages();
      this.updateMap();
    }
  },

  resetRestaurants() {
    const { restaurantsList, restaurantResultCount } = this.pageElements;
    restaurantsList.innerHTML = '';
    restaurantResultCount.innerHTML = 'Displaying <span class="restaurant-count__text">0</span> restaurants';
  },

  updateMap() {
    if (!this.map) {
      return;
    }

    const markers = this.restaurants.map(r => ({
      position: r.latlng,
      content: `
        <div class="infoWindow">
          <h2 class="infoWindow__title">${r.name}</h2>
          <address class="infoWindow__address">${r.address}</address>
          <a href="${DBHelper.restaurantUrl(r)}" class="infoWindow__link" title="View more information about ${r.name}">View Details</a>
        </div>
      `
    }));

    this.resetMap();
    this.map.addMarkers(markers);
  },

  loadMap() {
    this.map = new Map(document.querySelector('.map'));
    this.restaurants && this.updateMap();
  },

  resetMap() {
    this.map && this.map.removeMarkers();
  }
};

export default IndexController;
