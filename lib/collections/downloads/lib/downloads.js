module.exports = {
  /**
   * Download counter, makes sure each download gets an unique id
   * in the collection
   * @public
   */
  c: 0,

  /**
   * Contains all downloads. Mapped by id.
   * @public
   */
  collection: {},

  /**
   * Returns a single download or the whole download collection.
   * @param {number} id - Download id to get.
   * @return {object} - Download if id specified else whole collection.
   * @public
   */
  get: function (id){
    if(id)
      return this.collection[id];
    else
      return this.collection;
  },

  /**
   * Each download will have a 'getStats' method which will be called
   * in here. This function will return all the wanted data about the
   * download.
   * @param {number} id - Download ID to get stats from.
   * @return {object} stats - Download stats.
   */
  getStats: function (id){
    if(id){
      var download = this.get(id);

      if(!download) return {};

      return download.getStats();
    }
    else {
      var downloads = this.get();

      //
      // Do we really want an array as response?
      //
      var stats = [];
      for(var id in downloads)
        stats.push(downloads[id].getStats());

      return stats;
    }
  },

  /**
   * Adds a download to the collection.
   * @param {object} dl - Download to add
   * @return {object} this - Whole download collection, allows for chain calls.
   */
  add: function (dl){
    dl = dl || {};

    this.collection[this.c] = dl;

    this.c += 1;

    return this;
  },

  /**
   * Deletes a download from the collection.
   * @param {number} id - 
   */
  delete: function (id){
    /**
     * DELETE IT
     * WORKING ON IT
     */
    console.log(id);

  }
};