/* globals d3,techan */
import Ember from 'ember';

export default Ember.Component.extend({
  identificator: null,
  baseWidth: 960,
  baseHeight: 500,
  data: [],
  margin: {
    top: 20, right: 20, bottom: 30, left: 50
  },
  parseDate: d3.time.format("%d-%b-%y").parse,
  width: Ember.computed(function () {
    return this.get('baseWidth') - this.get('margin.left') - this.get('margin.right');
  }),
  height: Ember.computed(function () {
    return this.get('baseHeight') - this.get('margin.top') - this.get('margin.bottom');
  }),
  x: Ember.computed(function () {
    return techan.scale.financetime().range([0, this.get('width')]);
  }),
  y: Ember.computed(function () {
    return d3.scale.linear().range([this.get('height'), 0]);
  }),
  xAxis: Ember.computed('x', function () {
    return d3.svg.axis().scale(this.get('x')).orient("bottom");
  }),
  yAxis: Ember.computed('y', function () {
    return d3.svg.axis().scale(this.get('y')).orient("left");
  }),
  emaEnable: true,
  ema: Ember.computed('x', 'y', function () {
    return techan.plot.ema().xScale(this.get('x')).yScale(this.get('y'));
  }),
  smaEnable: true,
  sma: Ember.computed('x', 'y', function () {
    return techan.plot.sma().xScale(this.get('x')).yScale(this.get('y'));
  }),
  init() {
    this._super(...arguments);
    this.set('identificator', 'chart-' + Math.floor(Math.random() * 1000000 - 100000));
    const parseDate = this.get('parseDate');
    const data = this.get('data').map(function(d) {
      return {
        date: parseDate(d.date),
        open: +d.open,
        high: +d.high,
        low: +d.low,
        close: +d.close,
        volume: +d.volume
      };
    });

    this.set('mappedData', data);
  },
  didInsertElement() {
    this._super(...arguments);
    const margin = this.get('margin');
    const svg = d3.select("#" + this.get('identificator'))
      .attr("width", this.get('width') + this.get('margin.left') + this.get('margin.right'))
      .attr("height", this.get('height') + this.get('margin.top') + this.get('margin.bottom'))
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.set('svg', svg);
  }
});