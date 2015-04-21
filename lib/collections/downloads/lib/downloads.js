module.exports = {
  c: 0,
  collection: {},

  get: function (id){

    if(id)
      return this.collection[id];
    else
      return this.collection;
  },

  /**
   * Each download will have a 'getStats' method which will be called
   * in here
   */
  getStats: function (id){
    if(id){
      var download = this.get(id);

      if(!download) return {};

      return download.getStats();
    }
    else {
      var downloads = this.get();

      var stats = [];
      for(var id in downloads)
        stats.push(downloads[id].getStats());

      return stats;
    }
  },

  add: function (o){
    o = o || {};

    this.collection[this.c] = o; // new Download

    this.c += 1;
  },

  delete: function (){

  }
};