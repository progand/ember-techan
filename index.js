/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-techan',
  included: function(app) {
    this._super.included(app);
    app.import(app.bowerDirectory + '/d3/d3.min.js');
    app.import(app.bowerDirectory + '/techan/dist/techan.min.js');
  }
};
