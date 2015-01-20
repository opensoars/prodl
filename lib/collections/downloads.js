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
   */
  getStats: function (id){
    if(id){
      var download = this.get(id);

      return download.getStats();
    }
    else {
      var downloads = this.get();

      var stats = [];
      for(var id in downloads)
        stats.push(downloads[id].getStats());
    }
  },

  add: function (){
    this.collection[this.c] = {}; // new Download

    this.c += 1;
  },

  delete: function (){

  }
};