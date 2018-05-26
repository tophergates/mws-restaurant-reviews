import config from '../config';
import DBHelper from '../utils/DBHelper';
import Map from '../utils/Map';
import loadGoogleMaps from '../utils/loadGoogleMaps';

/**
 * Unfortunately we have to attach this function to the global scope.
 * This is a limitation of Google Maps.
 */
self.initMap = () => {
  IndexController.loadMap();
};

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
 * Generates the html for one restaurant list item.
 */
const createRestaurant = restaurant => {
  // Create the necessary elements for later
  const span = document.createElement('span');
  const li = document.createElement('li');
  const image = document.createElement('img');
  const body = document.createElement('div');
  const name = document.createElement('h2');
  const neighborhood = span.cloneNode();
  const address = document.createElement('address');
  const more = document.createElement('a');
  const avgReview = span.cloneNode();

  // Setup the image
  image.className = 'restaurant-item__image';
  image.src = DBHelper.restaurantImgUrl(restaurant);
  image.setAttribute('alt', restaurant.altText);

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
  avgReview.className = 'restaurant-item__review';
  DBHelper.calculateAverageReview(restaurant.id).then(score => {
    avgReview.textContent = score;
    avgReview.setAttribute('aria-label', 'Average review');

    // Append items to the content body
    body.append(name);
    body.append(neighborhood);
    body.append(address);
    name.append(avgReview);
    body.append(more);
  });

  // View More button
  more.textContent = 'Details';
  more.href = DBHelper.restaurantUrl(restaurant);
  more.title = `View additional details about ${restaurant.name}`;
  more.className = 'restaurant-item__detail-link';

  // Once the image has loaded, append all elements to the list item
  image.onload = () => {
    li.append(image);
    li.append(body);
  };

  // Give the list item a class and return it
  li.classList.add('restaurants-list__item');

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
    loadGoogleMaps();
    
    DBHelper.fetchRestaurants()
      .then(restaurants => {
        if (!restaurants) throw Error('Restaurants could not be displayed');

        const { mobileButtonBar, filterForm } = this.pageElements;

        // Save restaurants for later
        this.restaurants = restaurants;

        // Populate filters and display the restaurants
        this.populateFilterForm();
        this.populateRestaurantsList();

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
      content: {
        address: r.address,
        cuisine: r.cuisine_type,
        photo: DBHelper.restaurantImgUrl(r),
        altText: r.altText,
        title: r.name,
        url: DBHelper.restaurantUrl(r),
      }
    }));

    this.resetMap();
    this.map.addMarkers(markers, this.handleMapMarkerClick);
  },

  handleMapMarkerClick(infoWindow, marker) {
    const {
      content: { 
        title, 
        photo, 
        altText,
        address, 
        url 
      }
    } = marker;
  
    // Set content of the info window
    infoWindow.setContent(`
      <div class="infoWindow">
        <img src="${photo}" alt="${altText}" class="infoWindow__image">
        <h2 class="infoWindow__title">${title}</h2>
        <address class="infoWindow__address">${address}</address>
        <a href="${url}" title="View more information about ${title}" class="infoWindow__link">View Details</a>
      </div>
    `);
  
    // Open the info window
    infoWindow.open(marker.map, marker);
  },

  loadMap() {
    this.map = new Map(null, null, () => {
      // Add a title to the map iframe
      const mapFrame = document.querySelector('.map iframe');
      mapFrame.title = "Restaurant Locations";
    });
    this.restaurants && this.updateMap();
  },

  resetMap() {
    this.map && this.map.resetMarkers();
  }
};

export default IndexController;
