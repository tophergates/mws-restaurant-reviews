import idb from 'idb';

class Database {
  /**
   * Creates a new IndexedDB data store, connects to the data store,
   * and handles all CRUD (create, read, update, and delete) operations.
   * @param {string} dbName The name of the data store.
   * @param {number} version The data store version number. Increment when updating.
   */
  constructor(dbName, version) {
    this.name = dbName;
    this.version = version;
  }

  /**
   * Connects to the database, or creates one
   * @returns {Promise<*>} A Promise that resolves with the database object.
   */
  _connect() {
    return idb.open(this.name, this.version, db => {
      if (!db.objectStoreNames.contains('restaurants')) {
        db.createObjectStore('restaurants', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('reviews')) {
        const reviews = db.createObjectStore('reviews', { keyPath: 'id' });
        reviews.createIndex('restaurant', 'restaurant_id');
      }

      if (!db.objectStoreNames.contains('pending-reviews')) {
        const pendingReviews = db.createObjectStore('pending-reviews', {
          keyPath: 'id',
          autoIncrement: true
        });
        pendingReviews.createIndex('restaurant', 'restaurant_id');
      }
    });
  }

  /**
   * Writes data to the database.
   * @param {string} storeName The name of the data store you wish to write data to.
   * @param {*} data The data you want to insert into the database.
   * @returns {Promise<*>} A Promise that resolves when the transaction completes.
   */
  writeData(storeName, data) {
    return this._connect().then(db => {
      const tx = db.transaction(storeName, 'readwrite');

      // Handle the case when data is an array
      if (Array.isArray(data)) {
        data.forEach(item => tx.objectStore(storeName).put(item));
      } else {
        tx.objectStore(storeName).put(data);
      }

      return tx.complete;
    });
  }

  /**
   * Reads data from the database.
   * @param {*} storeName The name of the data store you wish to read data from.
   * @param {*} key An optional key used to look up specific data records.
   * @returns {Promise<*>} A Promise that resolves with the requested data.
   */
  readData(storeName, key = null, idx = null) {
    return this._connect().then(db => {
      const tx = db.transaction(storeName);
      const store = tx.objectStore(storeName);

      // If there is no key, return all the data.
      if (!key) {
        return store.getAll();
      }

      if (idx) {
        return store.index(idx).getAll(key);
      }

      // Return just the data associated with the specified key.
      return store.get(key);
    });
  }

  deleteData(storeName, key) {
    return this._connect().then(db => {
      const tx = db
        .transaction(storeName, 'readwrite')
        .objectStore(storeName)
        .delete(key);

      return tx.complete;
    });
  }

  clearData(storeName) {
    return this._connect().then(db => {
      const tx = db
        .transaction(storeName, 'readwrite')
        .objectStore(storeName)
        .clear();

      return tx.complete;
    });
  }
}

export default Database;
