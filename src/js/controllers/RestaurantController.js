import config from '../config';
import DBHelper from '../utils/DBHelper';
import Map from '../utils/Map';
import loadGoogleMaps from '../utils/loadGoogleMaps';
import getUrlParameter from '../utils/getUrlParameter';

/**
 * Called when Google Maps API is ready
 * @global
 */
self.initMap = () => {
  RestaurantController.loadMap();
};

/**
 * Calculates average rating percentage
 */
const averageRating = reviews => {
  const TOP_RATING = 5;
  const total = reviews.reduce((acc, review) => {
    return acc + review.rating;
  }, 0);

  return (total / (reviews.length * TOP_RATING) * 100);
};

/**
 * Generates the HTML output for the operating hours table
 */
const generateHoursHtml = operatingHours => {
  const docFrag = document.createDocumentFragment();
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const thead = document.createElement('thead');
  const thead_tr = tr.cloneNode();
  const tbody = document.createElement('tbody');
  const tbody_tr = tr.cloneNode();
  const th = document.createElement('th');
  const td = document.createElement('td');

  table.className = 'restaurant__hours';

  thead.appendChild(thead_tr);
  tbody.appendChild(tbody_tr);

  for (let day in operatingHours) {
    let day_th = th.cloneNode();
    let day_td = td.cloneNode();

    day_th.textContent = day;
    day_td.innerHTML = (operatingHours[day].includes(',') ? operatingHours[day].replace(', ', '<br>') : operatingHours[day]);
    day_td.setAttribute('data-th', day);

    thead_tr.appendChild(day_th);
    tbody_tr.appendChild(day_td);
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  docFrag.appendChild(table);
  
  return docFrag;
};

/**
 * Generates the stars used for the ratings
 */
const generateStarsHtml = () => {
  const RATING_LIMIT = 5;
  const star = document.createElement('span');
  const docFrag = document.createDocumentFragment();

  star.textContent = '★';
  
  for (let i=RATING_LIMIT; i>0; i--) {
    let tmp = star.cloneNode(true);
    docFrag.appendChild(tmp);
  }

  return docFrag;
}

/**
 * Generates the HTML output for a star rating
 */
const generateStarRatingHtml = rating => {
  const div = document.createElement('div');

  const container = div.cloneNode();
  const top = div.cloneNode();
  const bottom = div.cloneNode();

  container.className = 'star-rating__container';

  top.className = 'star-rating__top';
  top.style.width = `${rating}%`;
  top.appendChild(generateStarsHtml());
  container.appendChild(top);

  bottom.className = 'star-rating__bottom';
  bottom.appendChild(generateStarsHtml());
  container.appendChild(bottom);

  return container;
};

/**
 * Generates the HTML output for a review
 */
const generateReviewHtml = review => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  const p = document.createElement('p');
  const reviewTop = div.cloneNode();
  const reviewBody = div.cloneNode();
  const username = p.cloneNode();
  const starRating = div.cloneNode();
  const date = p.cloneNode();
  const comment = p.cloneNode();

  li.className = 'restaurant__review';
  reviewTop.className = 'review__top';
  reviewBody.className = 'review__body';

  // Review Top
  username.textContent = review.name;
  username.className = 'review__username';
  reviewTop.appendChild(username);

  starRating.className = 'star-rating';
  starRating.setAttribute('aria-label', `User rating: ${review.rating}`);
  starRating.appendChild(generateStarRatingHtml((review.rating / 5) * 100));
  reviewTop.appendChild(starRating);
  
  // Review Body
  date.textContent = review.date;
  date.className = 'review__date';
  comment.innerHTML = review.comments;
  comment.className = 'review__comment';
  reviewBody.appendChild(date);
  reviewBody.appendChild(comment);

  li.appendChild(reviewTop);
  li.appendChild(reviewBody);

  return li;
};

/**
 * The restaurant page controller
 */
const RestaurantController = {
  map: null,
  restaurant: null,
  pageElements: {
    breadcrumbs: document.querySelector('.breadcrumbs__nav-list'),
    restaurantContainer: document.querySelector('.restaurant'),
    restaurantName: document.querySelector('.restaurant__name'),
    restaurantCuisine: document.querySelector('.restaurant__cuisine'),
    restaurantHoursToday: document.querySelector('.hours-today__text'),
    restaurantAddress: document.querySelector('.restaurant__address'),
    restaurantNeighborhood: document.querySelector('.restaurant__neighborhood'),
    restaurantStarRating: document.querySelector('.restaurant__star-rating'),
    restaurantHoursContainer: document.querySelector('.restaurant__hours-container'),
    restaurantImageContainer: document.querySelector('.restaurant__image-container'),
    reviewsContainer: document.querySelector('.restaurant__reviews-container'),
  },

  /**
   * Page controller entry point to begin rendering page elements
   */
  render() {
    const restaurantId = +getUrlParameter('id');

    if (!restaurantId) {
      console.error('The restaurant ID could not be located');
      return;
    }

    DBHelper.fetchRestaurant(restaurantId)
      .then(restaurant => {
        if (!restaurant) {
          console.error(`Unable to retrieve a restaurant with the ID ${restaurantId}`);
          return;
        }

        loadGoogleMaps();
        this.restaurant = restaurant;
        document.title += ` | ${this.restaurant.name}`;

        this.fillBreadcrumb();
        this.renderRestaurant();
      })
      .catch(console.error);
  },

  /**
   * Renders restaurant information
   */
  renderRestaurant() {
    // Populate restaurant content
    this.generateImage();
    this.populateHeader();
    this.generateAverageRating();
    this.populateAddress();
    this.populateDetails();
    this.renderReviews();
  },

  /**
   * Populates the restaurant header with content
   */
  populateHeader() {
    const { restaurantName, restaurantCuisine, restaurantHoursToday } = this.pageElements;
    const { name, cuisine_type: cuisine, operating_hours: operatingHours } = this.restaurant;
    const daysOfTheWeek = Object.keys(operatingHours);
    const currentDay = daysOfTheWeek[new Date().getDay() - 1];
    
    restaurantName.textContent = name;
    restaurantCuisine.textContent = cuisine;
    restaurantHoursToday.textContent = operatingHours[currentDay];
  },

  /**
   * Generates an IMG element for the current restaurant
   */
  generateImage() {
    const { restaurantImageContainer } = this.pageElements;
    const { altText } = this.restaurant;
    const image = document.createElement('img');

    image.src = DBHelper.restaurantImgUrl(this.restaurant);
    image.alt = altText;
    image.className = 'restaurant__image';
    image.onload = event => {
      restaurantImageContainer.appendChild(image);
    };
  },

  /**
   * Generates the average star rating
   */
  generateAverageRating() {
    const { restaurantStarRating } = this.pageElements;
    const { reviews } = this.restaurant;
    const rating = averageRating(reviews);
    const link = document.createElement('a');

    // Add stars
    restaurantStarRating.appendChild(generateStarRatingHtml(rating));

    // Add link
    link.setAttribute('href', '#reviews');
    link.setAttribute('title', 'Skip to customer reviews');
    link.className = 'star-rating__link';
    link.textContent = `${reviews.length} reviews`;

    restaurantStarRating.appendChild(link);
  },

  /**
   * Populates the restaurant address and neighborhood
   */
  populateAddress() {
    const { restaurantAddress, restaurantNeighborhood } = this.pageElements;
    const { address, neighborhood } = this.restaurant;

    restaurantAddress.textContent = address;
    restaurantNeighborhood.textContent = neighborhood;
  },

  /**
   * Populates restaurant details section
   */
  populateDetails() {
    const { restaurantHoursContainer } = this.pageElements;
    const { operating_hours: operatingHours } = this.restaurant;

    restaurantHoursContainer.appendChild(generateHoursHtml(operatingHours));
  },
  
  /**
   * Renders reviews if there are any
   */
  renderReviews() {
    const { reviews } = this.restaurant;
    const { reviewsContainer } = this.pageElements;
    const docFrag = document.createDocumentFragment();

    if (!reviews) {
      const paragraph = document.createElement('p');

      paragraph.textContent = `${this.restaurant.name} does not have any reviews`;
      paragraph.className = 'restaurant-reviews__empty';
      reviewsContainer.appendChild(paragraph);

      return;
    }

    const reviewsList = document.createElement('ul');
    reviewsList.className = 'restaurant__reviews';

    reviews.forEach(review => {
      docFrag.appendChild(generateReviewHtml(review));
    });

    reviewsList.appendChild(docFrag);
    reviewsContainer.appendChild(reviewsList);
  },

  /**
   * Populates the page breadcrumbs
   */
  fillBreadcrumb() {
    const { breadcrumbs } = this.pageElements;
    const li = document.createElement('li');
    
    li.textContent = this.restaurant.name;
    li.classList.add('breadcrumbs__nav-item');
    li.setAttribute('aria-current', 'page');

    breadcrumbs.appendChild(li);
  },

  /**
   * Called by initMap once Google Maps API is ready.
   * Create a new map and updates it
   */
  loadMap() {
    this.map = new Map(null, {
      zoom: 16,
      center: this.restaurant.latlng,
      scrollwheel: false,
    }, () => {
      // Add a title to the map iframe
      const mapFrame = document.querySelector('.map iframe');
      mapFrame.title = "Restaurant Location";
    });

    this.restaurant && this.updateMap();
  },

  /**
   * Updates the Google Map
   */
  updateMap() {
    if (!this.map) {
      return;
    }

    this.map.addMarker({
      position: this.restaurant.latlng,
      content: {}
    });
  }
}

export default RestaurantController;
