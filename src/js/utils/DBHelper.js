import config from '../config';

class DBHelper {
  static get BASE_URL() {
    return `${config.HOST}${config.PORT && `:${config.PORT}`}`;
  }

  static get DB_URL(){
    return `./data/restaurants.json`;
  }

  static restaurantImgUrl({ photograph }, relative = true) {
    return (relative)
     ? `./images/${photograph}`
     : `${this.BASE_URL}/images/${photograph}`;
  }

  static restaurantUrl({ id }, relative = true) {
    return (relative)
     ? `./restaurant.html?id=${id}`
     : `${this.BASE_URL}/restaurant.html?id=${id}`;
  }

  static fetchRestaurants() {
    return fetch(this.DB_URL)
      .then(response => {
        if(!response.ok) {
          throw Error('Unable to retrieve restaurant data');
        }
        
        return response.json();
      })
      .then(results => results.restaurants)
      .catch(console.error);
  }

  static fetchRestaurant(id) {
    return this.fetchRestaurants()
      .then(restaurants => restaurants.filter(r => r.id === id)[0]);
  }

  static calculateAverageReview(restaurantId) {
    return this.fetchRestaurant(restaurantId)
      .then(({ reviews }) => {
        if (!reviews) return 0;

        // Stand back, we're going to try mathematics!
        return Math.max(
                Math.round(
                  (reviews.reduce((a, c) => a + c.rating, 0) / reviews.length) * 10
                ) / 10, 1
              ).toFixed(1);
      })
      .catch(console.error);
  }
};

export default DBHelper;
