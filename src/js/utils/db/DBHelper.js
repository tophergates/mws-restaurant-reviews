import asyncFetch from '../asyncFetch';
import config from '../../config';
import Database from './Database';

class DBHelper {
  /**
   * Provides a layer of abstraction for interacting with the database
   * and fetching network resources.
   */
  constructor() {
    // Reference to an IndexedDB instance.
    this.db = new Database('restaurant-reviews', 3);
  }

  /**
   * Generic fetch method used internally by DBHelper to fetch resources.
   * @param {string} resource The database resource that is being fetched. This value
   * will be appended to the end of the API URL.
   * @param {string} dbStore The name of the database store to read/write data to/from.
   * @param {*} dbKey The key that will be used when retrieving data.
   * @returns {Promise<*>} A Promise that resolves with the requested data or rejects with an error message.
   */
  async _fetchResource(resource, dbStore, dbKey = null, dbIndex = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Retrieve data from the network, write the data to the database for offline use,
        // and then resolve the Promise with the requested data.
        const networkResponse = await asyncFetch(`${this.DB_URL}/${resource}`);
        this.db.writeData(dbStore, networkResponse);

        resolve(networkResponse);
      } catch (error) {
        // If we are here, it is likely there is a network error.
        // Look for data in the database.
        const dbResponse = await this.db.readData(dbStore, dbKey, dbIndex);

        // If there is a database response, we must have data.
        // In that case, resolve the Promise with the data.
        // Otherwise, reject the Promise with the error message.
        dbResponse ? resolve(dbResponse) : reject(error.message);
      }
    });
  }

  calculateAverageReview(reviews, maxReview = this.MAX_REVIEW_SCORE) {
    const reviewSum = reviews.reduce((acc, review) => {
      return acc + review.rating;
    }, 0);
    const averagePercent = (reviewSum / (reviews.length * maxReview)) * 100;

    return averagePercent;
  }

  /**
   * Reaches into the configuration variables and puts together the base URL for the client.
   * @returns {string} The base URL for the client.
   */
  get BASE_URL() {
    return `${config.HOST}${config.PORT && `:${config.PORT}`}`;
  }

  /**
   * Reaches into the configuration variables to pull out the server URL.
   * @returns {string} The URL of the API server.
   */
  get DB_URL() {
    return `${config.SERVER}`;
  }

  get MAX_REVIEW_SCORE() {
    return 5;
  }

  /**
   * Takes in a restaurant object and returns the image URL.
   * @param {object} restaurant The restaurant object, with id and size properties.
   * @param {boolean} relative Whether to return a relative path (true) or absolute path (false). Default is true.
   * @returns {string} The absolute or relative path to the restaurant image.
   */
  restaurantImgUrl({ id, size }, relative = true) {
    return relative ? `./images/${id}-${size}.jpg` : `${this.BASE_URL}/images/${id}-${size}.jpg`;
  }

  /**
   * Takes in a restaurant object and returns the URL to the restaurant page.
   * @param {object} restaurant The restaurant object, with an id property.
   * @param {boolean} relative Whether to return a relative path (true) or absolute path (false). Default is true.
   * @returns {string} The absolute or relative path to the restaurant page.
   */
  restaurantUrl(id, relative = true) {
    return relative ? `./restaurant.html?id=${id}` : `${this.BASE_URL}/restaurant.html?id=${id}`;
  }

  /**
   * Fetches all restaurants. It will attempt to fetch from both the database and the network.
   * If a response is received from the network, the database will be updated and returned.
   * @returns {Promise<[object]>} Returns a Promise that resolves to an array of restaurant objects.
   */
  fetchRestaurants() {
    return this._fetchResource('restaurants', 'restaurants');
  }

  /**
   * Fetches all favorite restaurants. Under the hood, this uses the fetchRestaurants method
   * and then filters the results before returning them.
   * @returns {Promise<[*]>} A Promise that resolves to an array of restaurants.
   */
  fetchFavoriteRestaurants() {
    return new Promise(async (resolve, reject) => {
      try {
        // First fetch all the restaurants.
        const restaurants = await this.fetchRestaurants();

        // Then filter the restaurants for favorites.
        resolve(restaurants.filter(({ is_favorite }) => is_favorite));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Looks for a particular restaurant with the given ID and returns it.
   * @param {number} restaurantId The restaurant ID
   * @return {Promise<object>} Returns a Promise that resolves to a restaurant object
   */
  fetchRestaurant(restaurantId) {
    return this._fetchResource(`restaurants/${restaurantId}`, 'restaurants', restaurantId);
  }

  /**
   * Fetches all restaurant reviews.
   * @returns {Promise<[*]>} A Promise that resolves to an array of review objects.
   */
  fetchReviews() {
    return this._fetchResource('reviews', 'reviews');
  }

  /**
   * Fetches an individual restaurant review.
   * @param {number} reviewId The ID of the review.
   * @returns {Promise<[*]>} A Promise that resolves to a single review object.
   */
  fetchReview(reviewId) {
    return this._fetchResource(`reviews/${reviewId}`, 'reviews', reviewId);
  }

  /**
   * Fetches all reviews for a particular restaurant.
   * @param {number} restaurantId The ID of the restaurant to return reviews for.
   * @returns {Promise<[*]>} A Promise that resolves to an array of review objects.
   */
  fetchRestaurantReviews(restaurantId) {
    return new Promise(async (resolve, reject) => {
      try {
        const reviews = await this._fetchResource(
          `reviews/?restaurant_id=${restaurantId}`,
          'reviews',
          restaurantId,
          'restaurant'
        );
        const pendingReviews = await this.db
          .readData('pending-reviews', restaurantId, 'restaurant')
          .then(reviews => {
            return reviews.map(review => {
              return Object.assign(review, { pending: true });
            });
          });

        resolve([...pendingReviews, ...reviews]);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Fetches a restaurant and all associated reviews.
   * @param {*} restaurantId The ID of the restaurant to return.
   * @returns {Promise<*>} A Promise that resolves to a restaurant object.
   */
  fetchRestaurantWithReviews(restaurantId) {
    return new Promise(async (resolve, reject) => {
      let restaurant;
      let reviews;

      try {
        restaurant = await this.fetchRestaurant(restaurantId);
        reviews = await this.fetchRestaurantReviews(restaurantId);
        restaurant.reviews = reviews || [];
        restaurant.averageReview = this.calculateAverageReview(restaurant.reviews);
        resolve(restaurant);
      } catch (error) {
        if (restaurant) {
          restaurant.reviews = reviews || [];
          restaurant.averageReview = this.calculateAverageReview(restaurant.reviews);
          resolve(restaurant);
        }

        reject(error);
      }
    });
  }

  // TODO: Finish the methods below

  /**
   *
   * @param {object} review
   */
  addRestaurantReview(review) {
    return new Promise(async (resolve, reject) => {
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify(review),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      };

      try {
        // Attempt to post the new review
        await (await fetch(`${this.DB_URL}/reviews`, fetchOptions)).json();
        const updatedReviews = await this.fetchRestaurantReviews(review.restaurant_id);
        resolve(updatedReviews);
      } catch (error) {
        // If that didn't work, save the review to be posted later
        this.db
          .writeData('pending-reviews', review)
          .then(() => {
            resolve(review);
          })
          .catch(() => {
            reject(error);
          });
      }
    });
  }

  /**
   * Updates any reviews that are pending due to being offline.
   * @param {number} restaurantId The ID of the restaurant to return the reviews for.
   */
  addPendingReviews(restaurantId) {
    return new Promise(async (resolve, reject) => {
      if (!navigator.onLine) {
        reject(new Error('Unable to post pending reviews, you are offline.'));
      }

      try {
        const pendingReviews = await this.db.readData('pending-reviews');

        if (Array.isArray(pendingReviews) && pendingReviews.length > 0) {
          await this.db.clearData('pending-reviews');

          Promise.all(
            pendingReviews.map(({ restaurant_id, name, createdAt, comments, rating }) => {
              const fetchOptions = {
                method: 'POST',
                body: JSON.stringify({ restaurant_id, name, comments, createdAt, rating }),
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              };

              return fetch(`${this.DB_URL}/reviews`, fetchOptions);
            })
          ).then(async () => {
            const updatedReviews = await this.fetchRestaurantReviews(restaurantId);
            resolve(updatedReviews);
          });
        }
      } catch (error) {}
    });
  }

  /**
   *
   * @param {number} restaurantId
   */
  setFavoriteRestaurant(restaurantId, is_favorite) {
    return new Promise(async (resolve, reject) => {
      try {
        const networkResponse = await (await fetch(
          `${this.DB_URL}/restaurants/${restaurantId}/?is_favorite=${is_favorite}`,
          {
            method: 'PUT'
          }
        )).json();

        this.db.writeData('restaurants', networkResponse);
        resolve(networkResponse);
      } catch (error) {
        reject(error.message);
      }
    });
  }
}

export default new DBHelper();
