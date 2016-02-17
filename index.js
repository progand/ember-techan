/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-techan-js',
  included: function(app) {
    this._super.included(app);
    app.import({
      development: app.bowerDirectory + '/d3/d3.js',
      production: app.bowerDirectory + '/d3/d3.min.js'
    });
    app.import({
      development: app.bowerDirectory + '/techan/dist/techan.js',
      production: app.bowerDirectory + '/techan/dist/techan.min.js'
    });
  }
};
