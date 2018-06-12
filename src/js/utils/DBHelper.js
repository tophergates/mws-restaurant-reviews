import idb from "idb";
import config from '../config';

const dataFrom = ([cachePromise, fetchPromise], where) => {
  return new Promise((resolve, reject) => {
    fetchPromise
      .then(data => {
        if (data && data.length) {
          resolve(data);
        } else {
          cachePromise
          .then(data => {
            if (data && data.length) {
              resolve(data);
            }
          })
          .catch(reject);
        }
      })
      .catch(error => {
        cachePromise
        .then(data => {
          if (data && data.length) {
            resolve(data);
          } else {
            reject(error);
          }
        })
        .catch(reject);
      });
  });
}

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
      return Promise.reject(new Error('Unable to fetch. Enpoint was not specified.'));
    }

    return new Promise((resolve, reject) => {
      fetch(url).then(res => {
        if (res.ok) {
          resolve(res.json());
        }
        
        reject(new Error('Unable to fetch the requested data'));
      }).catch(reject);
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

  static fetchRestaurants(favorites = false) {
    // Fetch restaurants from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/restaurants`)
      .then(restaurants => {
        if (restaurants) {
          return this._fetchReviews().then(reviews => {
            // Iterate through each restaurant
            return Promise.all(restaurants.map(restaurant => {
              // Get the reviews for just this restaurant and 
              // calculate the average review score.
              const filteredReviews = reviews.filter(review => review.restaurant_id === restaurant.id);
              restaurant.averageReview = this._calcAverageReview(filteredReviews);

              // Write the restaurant data to cache for offline use
              return DBInstance.writeData('restaurants', restaurant).then(() => restaurant);
            }));
          });
        }
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('restaurants');

    // Return from fetch or cache if that fails
    // Filter for favorites if requested
    return dataFrom([cachePromise, fetchPromise], 'fetchRestaurants')
      .then(res => favorites ? res.filter(r => r.is_favorite) : res);
  }

  static fetchRestaurant(restaurantId) {
    if (!restaurantId) {
      return Promise.reject(new Error('Unable to fetch a restaurant without an ID'));
    };
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/restaurants/${restaurantId}`)
      .then(restaurant => {
        if (restaurant) {
          return this._fetchRestaurantReviews(restaurant.id)
            .then(reviews => {
              restaurant.averageReview = this._calcAverageReview(reviews);
              return DBInstance.writeData('restaurants', restaurant)
                .then(() => {
                  restaurant.reviews = reviews;
                  return [restaurant];
                });
            });
        }
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('restaurants', restaurantId)
      .then(restaurant => {
        if (restaurant && !restaurant.reviews) {
          return DBInstance.readData('reviews')
            .then(reviews => {
              restaurant.reviews = reviews.filter(r => r.restaurant_id === restaurant.id);
              return [restaurant];
            });
        }

        return [restaurant];
      });

    // Return the data that returns first
    return dataFrom([cachePromise, fetchPromise], 'fetchRestaurant')
      .then(restaurant => restaurant[0]);
  }

  static _fetchReviews() {
    // Fetch reviews from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews`)
      .then(reviews => {
        if (reviews) {
          return Promise.all(reviews.map(review => {
            return DBInstance.writeData('reviews', review).then(() => review);
          }));
        }
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('reviews');

    // Return the data that returns first
    return dataFrom([cachePromise, fetchPromise], 'fetchReviews');
  }

  static _fetchRestaurantReviews(restaurantId) {
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews/?restaurant_id=${restaurantId}`)
      .then(reviews => {
        if (reviews) {
          return Promise.all(reviews.map(review => {
            return DBInstance.writeData('reviews', review).then(() => review);
          }));
        }
      });

    const cachePromise = DBInstance.readData('reviews')
      .then(reviews => {
        if (reviews) {
          return reviews.filter(r => r.restaurant_id === restaurantId);
        }

        return [];
      });

    // Return the data that returns first
    return dataFrom([cachePromise, fetchPromise], 'fetchRestaurantReviews');
  }

  static fetchReview(reviewId) {
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews/${reviewId}`)
      .then(review => DBInstance.writeData('reviews', review).then(() => review));

    const cachePromise = DBInstance.readData('reviews', reviewId);

    return dataFrom([cachePromise, fetchPromise], 'fetchReview');
  }

  static _calcAverageReview(reviews, maxReview = 5) {
    return (
      (reviews.map(review => review.rating)
        .reduce((a, b) => a + +b, 0) / (reviews.length * maxReview) * 100)
    );
  }
}

export default DBHelper;
