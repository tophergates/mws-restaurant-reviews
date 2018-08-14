import dateformat from 'dateformat';

import {
  DBHelper,
  getUrlParameter,
  lazyLoadImages,
  makeImage,
  makeStarRating,
  Map
} from '../utils';
import '../../styles/restaurant.scss';

const restaurantImageHTML = ({ id, altText }, className) => {
  const image = makeImage({
    id,
    src: DBHelper.restaurantImgUrl({ id, size: 'small' }),
    sizes: '100vw',
    alt: altText,
    className
  });

  return `<div class="restaurant__image-container">${image}</div>`;
};

const restaurantHeaderHTML = ({
  address,
  name,
  cuisine_type: cuisine,
  operating_hours: hours,
  is_favorite
}) => {
  const daysOfTheWeek = Object.keys(hours);
  const todayNum = new Date().getDay();
  const currentDay = daysOfTheWeek[todayNum > 0 ? todayNum - 1 : todayNum];
  const favoriteClass = `restaurant__favorite ${is_favorite}` || `restaurant__favorite false`;
  const favoriteText = is_favorite === 'true' ? 'Favorite' : 'Make a Favorite';
  const favoriteAria = is_favorite === 'true' ? 'Remove as a favorite' : 'Mark as a favorite';

  return `
    <div class="restaurant__header">
      <div class="restaurant__name">
        <h2 class="restaurant__name--text">${name}</h2>
        <button aria-label="${favoriteAria}" class="${favoriteClass}">♥ ${favoriteText}</button> 
      </div>
      <address class="restaurant__address">${address}</address>
      <span class="restaurant__cuisine">${cuisine}</span>
      <p class="restaurant__hours-today">Hours today:
        <span class="hours-today__text">${hours[currentDay]}</span>
      </p>
    </div>
  `;
};

const restaurantAverageRatingHTML = (reviews, averageReview) => {
  const starRating = makeStarRating(averageReview);
  const link = `<a href="#reviews" title="Skip to customer reviews" class="star-rating__link">${
    reviews.length
  } reviews</a>`;

  return `
    <div class="restaurant__star-rating">
      ${starRating}
      ${link}
    </div>
  `;
};

const restaurantOperatingHoursHTML = operatingHours => {
  const tableHeaders = [];
  const tableBody = [];

  for (let day in operatingHours) {
    const html = operatingHours[day].includes(',')
      ? operatingHours[day].replace(', ', '<br>')
      : operatingHours[day];

    tableHeaders.push(`<th>${day}</th>`);
    tableBody.push(`<td data-th="${day}">${html}</td>`);
  }

  return `
    <table class="restaurant__hours">
      <thead>${tableHeaders.join('')}</thead>
      <tbody>${tableBody.join('')}</tbody>
    </table>
  `;
};

const restaurantDetailsHTML = ({ operating_hours }) => {
  const operatingHours = restaurantOperatingHoursHTML(operating_hours);

  return `
    <div class="restaurant__details">
      <div class="restaurant__hours-container">
        <h3 class="subheading">Operating Hours</h3>
        ${operatingHours}
      </div>
    </div>
  `;
};

const restaurantSectionHTML = restaurant => {
  const html = [];

  html.push(restaurantHeaderHTML(restaurant));
  html.push(restaurantImageHTML(restaurant, 'restaurant__image'));
  html.push(restaurantAverageRatingHTML(restaurant.reviews, restaurant.averageReview));
  html.push(restaurantDetailsHTML(restaurant));

  return html.join('');
};

const reviewFormHTML = () => {
  const options = [];

  for (let i = 1; i <= DBHelper.MAX_REVIEW_SCORE; i++) {
    options.push(
      `<option value=${i}>${Array(i)
        .fill('★')
        .join('')}</option>`
    );
  }

  return `
    <div class="review-form__container">
      <h4 class="review-form__title">Add Review</h4>
      <form class="review-form">
        <div class="review-form__row">
          <label for="author">Author:</label>
          <input type="text" name="name" id="author" required>
        </div>
        <div class="review-form__row">
          <label for="rating">Rating:</label>
          <select aria-label="Select rating" id="rating" name="rating" required>
            ${options.join('')}
          </select>
        </div>
        <div class="review-form__row">
          <label for="comments">Comments:</label>
          <textarea id="comments" name="comments" required></textarea>
        </div>
        <div class="review-form__row">
          <button class="submit-button">Submit</button>
        </div>
      </form>
    </div>
  `;
};

const reviewItemHTML = ({ comments, createdAt, name, rating, pending }) => {
  return `
    <li class="restaurant__review${pending === true ? ' offline' : ''}">
      <div class="review__top">
        <p class="review__username">${name}</p>
        <div class="star-rating" aria-label="User rating: ${rating}">
          ${makeStarRating((rating / DBHelper.MAX_REVIEW_SCORE) * 100)}
        </div>
      </div>
      <div class="review__body">
        <p class="review__date">${dateformat(new Date(createdAt), 'mm/dd/yyyy h:MM TT')}</p>
        <p class="review__comment">${comments}</p>
      </div>
    </li>
  `;
};

const reviewsHTML = reviews => {
  const html = [];

  if (!reviews || (reviews && reviews.length === 0)) {
    html.push(
      `<p class="restaurant-reviews__empty">There are currently no reviews for this restaurant. Yours could be first!</p>`
    );
    return html.join('');
  }

  html.push(`<ul class="restaurant__reviews">`);
  html.push(reviews.map(reviewItemHTML).join(''));
  html.push(`</ul>`);

  return html.join('');
};

const reviewsSectionHTML = reviews => {
  const html = [];

  html.push(`<h3 class="subheading">User Reviews</h3>`);
  html.push(reviewFormHTML());
  html.push(reviewsHTML(reviews));

  return html.join('');
};

const RestaurantController = {
  state: {
    restaurant: null,
    errors: [],
    isLoading: true,
    online: navigator.onLine
  },

  map: null,

  elements: {
    breadcrumbs: document.querySelector('.breadcrumbs'),
    restaurantContainer: document.querySelector('.restaurant'),
    reviewsContainer: document.querySelector('.restaurant__reviews-container')
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
    this.render();
    const restaurantId = +getUrlParameter('id');

    if (!restaurantId) {
      this.setState(({ errors, isLoading }) => ({
        errors: [...errors, `A restaurant ID was not specified.`],
        isLoading: !isLoading
      }));

      return;
    }

    DBHelper.fetchRestaurantWithReviews(restaurantId)
      .then(restaurant => {
        this.setState(({ isLoading }) => ({
          restaurant,
          errors: [],
          isLoading: !isLoading
        }));

        this.loadMap();
      })
      .catch(() => {
        this.setState(({ errors, isLoading }) => ({
          errors: [...errors, `Oh no! We were unable to locate the restaurant you requested.`],
          isLoading: !isLoading
        }));
      });

    window.addEventListener('online', this.addPendingReviews.bind(this));
  },

  /**
   * Checks if the the loading state is true or if there are errors.
   * If loading or there are errors, it returns false. Otherwise, true.
   * This also populates the restaurant result element depending on the state.
   */
  notLoadingNoErrors() {
    const { isLoading, errors } = this.state;
    const { restaurantContainer } = this.elements;

    if (isLoading) {
      restaurantContainer.innerHTML = `<p class="restaurant-result info">Loading restaurant...</p>`;
      return false;
    } else if (errors && errors.length > 0) {
      const html = errors.map(error => `<p>${error}</p>`).join('');
      restaurantContainer.innerHTML = `<div class="restaurant-result error">${html}</div>`;
      return false;
    }

    return true;
  },

  updatePage() {
    const { name } = this.state.restaurant;
    const { breadcrumbs } = this.elements;

    document.title += ` | ${name}`;

    breadcrumbs.innerHTML = `
      <ol class="breadcrumbs__nav-list">
        <li class="breadcrumbs__nav-item">
          <a href="./" class="breadcrumbs__link" title="Return to the Restaurant Reviews home page">Home</a>
        </li>
        <li class="breadcrumbs__nav-item" aria-current="page">${name}</li>
      </ol>
    `;
  },

  populateRestaurant() {
    const { restaurant } = this.state;
    const { restaurantContainer } = this.elements;

    restaurantContainer.innerHTML = restaurantSectionHTML(restaurant);
    lazyLoadImages();
  },

  loadMap() {
    const { latlng } = this.state.restaurant;

    // Create the map
    this.map = new Map(document.querySelector('.restaurant__map'), {
      zoom: 16,
      center: [latlng.lat, latlng.lng],
      dragging: false
    });

    // Add a marker
    this.map.addMarkers(
      [
        {
          position: [latlng.lat, latlng.lng]
        }
      ],
      event => event.target.closePopup()
    );
  },

  populateReviews() {
    const { reviews } = this.state.restaurant;
    const { reviewsContainer } = this.elements;

    reviewsContainer.innerHTML = reviewsSectionHTML(reviews);
  },

  addNewReview(event) {
    event.preventDefault();

    const { name, rating, comments } = event.target.elements;
    const review = {
      restaurant_id: this.state.restaurant.id,
      rating: +rating.value,
      name: name.value,
      comments: comments.value.substring(0, 300),
      createdAt: new Date()
    };

    DBHelper.addRestaurantReview(review).then(updatedReviews => {
      const { restaurant } = this.state;

      if (updatedReviews && Array.isArray(updatedReviews)) {
        restaurant.reviews = updatedReviews;
      } else {
        restaurant.reviews.push(Object.assign(review, { pending: true }));
      }

      restaurant.averageReview = DBHelper.calculateAverageReview(restaurant.reviews);
      this.setState(() => ({ restaurant }));
    });
  },

  addPendingReviews() {
    if (navigator.onLine) {
      const { restaurant } = this.state;

      DBHelper.addPendingReviews(restaurant.id).then(updatedReviews => {
        if (Array.isArray(updatedReviews) && updatedReviews.length > 0) {
          this.setState(({ restaurant }) => {
            restaurant.reviews = updatedReviews;
            restaurant.averageReview = DBHelper.calculateAverageReview(restaurant.reviews);

            return { restaurant };
          });
        }
      });
    }
  },

  handleFavoriteChange() {
    const { id, is_favorite } = this.state.restaurant;
    const favorite = is_favorite === 'true' ? true : false;

    DBHelper.setFavoriteRestaurant(id, !favorite).then(newRestaurant => {
      console.log(newRestaurant.is_favorite);

      this.setState(({ restaurant }) => ({
        restaurant: Object.assign({}, restaurant, { is_favorite: newRestaurant.is_favorite })
      }));
    });
  },

  /**
   * Kicks of rendering the page. It is called whenever the state is updated.
   */
  render() {
    if (this.notLoadingNoErrors()) {
      // Update breadcrumbs and page title
      this.updatePage();

      // Populate the restaurants list and lazy load the images
      this.populateRestaurant();
      this.populateReviews();

      document
        .querySelector('.review-form')
        .addEventListener('submit', this.addNewReview.bind(this));

      document
        .querySelector('.restaurant__favorite')
        .addEventListener('click', this.handleFavoriteChange.bind(this));
    }
  }
};

export default RestaurantController;
