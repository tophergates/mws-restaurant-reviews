import idb from "idb";
import config from '../config';

class Database {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.db = this._createDB();
  }

  /**
   * Creates the database instances and returns a database Promise
   */
  _createDB() {
    return idb.open(this.name, this.version, db => {
      switch (db.oldVersion) {
        case 0:
          // Create object stores
          db.createObjectStore('restaurants', { keyPath: 'id' });
          db.createObjectStore('reviews', { keyPath: 'id' });
      }
    });
  }

  writeData(storeName, data) {
    return this.db.then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(data);
      return tx.complete;
    });
  }

  readData(storeName, key) {
    return this.db.then(db => {
      if (!key) {
        return db.transaction(storeName).objectStore(storeName).getAll();
      }

      return db.transaction(storeName).objectStore(storeName).get(key);
    })
  }
}

const DBInstance = new Database('rr-db', 1);

class DBHelper {
  static _fetchData(url) {
    if (!url) {
      return new Error('Unable to fetch. Enpoint was not specified.');
    }

    return fetch(url).then(res => {
      return res.ok ? res.json() : new Error('Unable to fetch the requested data');
    });
  }

  static get BASE_URL() {
    return `${config.HOST}${config.PORT && `:${config.PORT}`}`;
  }
  
  static get DB_URL(){
    return `${config.SERVER}`;
  }
  
  static restaurantImgUrl({ id, size }, relative = true) {
    return (relative)
     ? `./images/${id}-${size}.jpg`
     : `${this.BASE_URL}/images/${id}-${size}.jpg`;
  }

  static restaurantUrl({ id }, relative = true) {
    return (relative)
     ? `./restaurant.html?id=${id}`
     : `${this.BASE_URL}/restaurant.html?id=${id}`;
  }

  static _appendAverageScore(restaurants) {
    // Add an average review score for each restaurant. 
    // We'll need this for the star ratings
    return restaurants.length ? Promise.all(restaurants.map(r => {
      return this.averageReview(r.id).then(score => {
        r.averageReview = score;
        return r;
      });
    })) : restaurants;
  }

  static fetchRestaurants(favorites = false) {
    // Attempt to fetch from network
    return this._fetchData(`${this.DB_URL}/restaurants`)
      .then(restaurants => {
        // Calculate and append the average review score
        if (restaurants) {
          return this._appendAverageScore(restaurants);
        }
      })
      .then(restaurants => {
        // Update the database
        restaurants.forEach(restaurant => {
          DBInstance.writeData('restaurants', restaurant);
        });

        return restaurants;
      })
      .then(restaurants => {
        // Return the restaurants or favorites if asked for
        return (
          favorites ?
            restaurants.filter(r => r.is_favorite) :
            restaurants
        );        
      })

      // Fallback to IndexedDB if the network fetch fails
      .catch(error => {
        return DBInstance.readData('restaurants')
          .then(restaurants => {
            return (
              favorites ? 
                restaurants.filter(r => r.is_favorite) :
                restaurants
            );
          });
      });
  }

  static fetchRestaurant(restaurantId) {
    if (!restaurantId) {
      return Promise.resolve();
    };

    // Attempt to fetch from network
    return this._fetchData(`${this.DB_URL}/restaurants/${restaurantId}`)
      .then(restaurant => {
        if (restaurant) {
          return this.fetchReviews(restaurant.id)
            .then(reviews => {
              restaurant.reviews = reviews;
              return restaurant;
            })
        }
      })
      .then(restaurant => {
        return this._appendAverageScore([restaurant]);
      })
      .then(restaurant => {
        // Update the database
        DBInstance.writeData('restaurants', restaurant[0]);
        return restaurant[0];
      })

      // Fallback to IndexedDB if the network fetch fails
      .catch(error => {
        return DBInstance.readData('restaurants', restaurantId)
          .then(restaurant => {
            return DBInstance.readData('reviews')
              .then(reviews => {
                restaurant.reviews = reviews.filter(r => r.restaurant_id === restaurant.id);
                return restaurant;
              });
          });
      });
  }

  static async fetchReviews(restaurantId, reviewId) {
    const BASE_URL = this.DB_URL;
    let reviews;
    let networkFetch = false;

    if (reviewId) {
      // Get a specific review
      reviews = await DBInstance.readData('reviews', reviewId);

      if (!reviews || !reviews.length) {
        networkFetch = true;
        reviews = await this._fetchData(`${BASE_URL}/reviews/${reviewId}`);
      }
    } else if (restaurantId) {
      // Get reviews for one restaurant
      reviews = await DBInstance.readData('reviews');
      reviews = reviews.length ? reviews.filter(r => r.restaurant_id === restaurantId) : [];
      
      if (!reviews || !reviews.length) {
        networkFetch = true;
        reviews = await this._fetchData(`${BASE_URL}/reviews/?restaurant_id=${restaurantId}`);
      }
    } else {
      // Get all reviews
      reviews = await DBInstance.readData('reviews');

      if (!reviews || !reviews.length) {
        networkFetch = true;
        reviews = await this._fetchData(`${BASE_URL}/reviews/`);
      }
    }

    if (networkFetch && reviews.length > 0) {
      // Store the fetched data in the db for later
      reviews.forEach(review => {
        DBInstance.writeData('reviews', review);
      });
    }

    return reviews;
  }

  static async fetchReviewScores(restaurantId) {
    const reviews = await this.fetchReviews(restaurantId);
    return reviews.map(review => review.rating);
  }

  static async averageReview(restaurantId, maxReview = 5) {
    // Get the ratings and then total up all the review scores
    const ratings = await this.fetchReviewScores(restaurantId);
    const total = ratings.reduce((a, b) => a + +b, 0);

    // Multiply number of ratings by the maximum review, then divide by the total
    // Finally, multiply by 100 to find the percentage. This percentage is used 
    // to determine the width of the star ratings
    return (total / (ratings.length * maxReview) * 100);
  }
}

export default DBHelper;
