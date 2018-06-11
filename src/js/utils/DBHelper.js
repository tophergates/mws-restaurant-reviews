import idb from "idb";
import config from '../config';

// Used to return the first fulfilled promise
// Adapted from jfriend00's response on StackOverflow.
// Attribution: https://stackoverflow.com/questions/39940152/get-first-fulfilled-promise
const firstPromise = promises => {
  return new Promise((resolve, reject) => {
    if (!promises || !promises.length) {
      return reject(new Error('firstPromise() expects an array of promises'));
    }

    let errors = [];
    let errorCount = 0;

    promises.forEach((promise, idx) => {
      Promise.resolve(promise).then(resolve, error => {
        errors[idx] = error;
        errorCount++;

        if (errorCount === promises.length) {
          reject(errors);
        }
      })
    });
  });
};

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

  static _appendAverageScore(restaurants) {
    return restaurants.length ? Promise.all(restaurants.map(r => {
      return this.averageReview(r.id).then(score => {
        r.averageReview = score;
        return r;
      });
    })) : Promise.resolve(restaurants);
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
    let network = false;
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/restaurants`)
      .then(restaurants => {
        // Append the average scores for later
        if (restaurants) {
          return this._appendAverageScore(restaurants);
        }
      }).then(restaurants => {
        // Update the cached data
        return Promise.all(restaurants.map(restaurant => {
          return DBInstance.writeData('restaurants', restaurant);
        })).then(restaurants => {
          // Set network flag to true
          network = true;
          return restaurants;
        })
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('restaurants')
      .then(restaurants => {
        // If the network fetch hasnt returned yet, 
        // return data from the cache.
        if (!network) {
          return restaurants;
        }
      });

    // Return the data that returns first
    return firstPromise([fetchPromise, cachePromise])
      .then(res => favorites ? res.filter(r => r.is_favorite) : res);
  }

  static fetchRestaurant(restaurantId) {
    if (!restaurantId) {
      return Promise.reject(new Error('Unable to fetch a restaurant without an ID'));
    };

    let network = false;
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/restaurants/${restaurantId}`)
      .then(restaurant => {
        if (restaurant) {
          return this._appendAverageScore([restaurant]);
        }
      })
      .then(restaurant => {
        return DBInstance.writeData('restaurants', restaurant[0])
          .then(_ => {
            return this.fetchRestaurantReviews(restaurant[0].id)
              .then(reviews => {
                restaurant[0].reviews = reviews;
                return restaurant[0];
              });
          });
      })
      .then(restaurant => {
        return Promise.all(restaurant.reviews.map(review => {
          return DBInstance.writeData('reviews', review);
        })).then(_ => {
          // Set network flag to true
          network = true;
          return restaurant;
        });
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('restaurants', restaurantId)
      .then(restaurant => {
        // If the network fetch hasnt returned yet, 
        // return data from the cache.
        if (!network) {
          return restaurant;
        }
      })
      .then(restaurant => {
        return DBInstance.readData('reviews')
          .then(reviews => {
            restaurant.reviews = reviews.filter(r => r.restaurant_id === restaurant.id);
            return restaurant;
          });
      });

    // Return the data that returns first
    return firstPromise([fetchPromise, cachePromise]);
  }

  static fetchReviews() {
    let network = false;
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews`)
      .then(reviews => {
        // Update the cached data
        return Promise.all(reviews.map(review => {
          return DBInstance.writeData('reviews', review);
        })).then(reviews => {
          // Set network flag to true
          network = true;

          return reviews;
        });
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('reviews')
      .then(reviews => {
        // If the network fetch hasnt returned yet, 
        // return data from the cache.
        if (!network) {
          return reviews;
        }
      });

    // Return the data that returns first
    return firstPromise([fetchPromise, cachePromise]);
  }

  static fetchRestaurantReviews(restaurantId) {
    let network = false;
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews/?restaurant_id=${restaurantId}`)
      .then(reviews => {
        if (reviews) {
          // Update the cached data
          return Promise.all(reviews.map(review => {
            return DBInstance.writeData('reviews', review);
          }));
        }

        return [];
      })
      .then(reviews => {
        network = true;
        return reviews;
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('reviews')
      .then(reviews => {
        // If the network fetch hasnt returned yet, 
        // return data from the cache.
        if (!network) {
          return reviews;
        }
      })
      .then(reviews => {
        if (reviews) {
          return reviews.filter(r => r.restaurant_id === restaurantId);
        }

        return [];
      });

    // Return the data that returns first
    return firstPromise([fetchPromise, cachePromise]);
  }

  static fetchReview(reviewId) {
    let network = false;
    
    // Fetch from network
    const fetchPromise = this._fetchData(`${this.DB_URL}/reviews/${reviewId}`)
      .then(review => {
        // Update the cached data
        return DBInstance.writeData('reviews', review)
          .then(_ => {
            network = true;
            return review;
          });
      });

    // Fetch data from the cache at the same time
    const cachePromise = DBInstance.readData('reviews', reviewId)
      .then(review => {
        // If the network fetch hasnt returned yet, 
        // return data from the cache.
        if (!network) {
          return review;
        }
      });

    // Return the data that returns first
    return firstPromise([fetchPromise, cachePromise]);
  }

  static fetchReviewScores(restaurantId) {
    if (!restaurantId) Promise.resolve(0);

    return this.fetchRestaurantReviews(restaurantId)
      .then(reviews => {
        if (reviews) {
          return reviews.map(review => review.rating);
        }
      })
  }

  static averageReview(restaurantId, maxReview = 5) {
    return this.fetchReviewScores(restaurantId)
      .then(ratings => {
        const total = ratings.reduce((a, b) => a + +b, 0);
        return (total / (ratings.length * maxReview) * 100);
      });
  }
}

export default DBHelper;
