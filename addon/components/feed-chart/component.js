import Ember from 'ember';
import layout from './template';
import BaseChart from '../../base-chart';

export default BaseChart.extend({
  layout: layout,
  storage: Ember.inject.service('techan-storage'),
  candlestick: Ember.computed(function() {
    return techan.plot.candlestick()
      .xScale(this.get('x'))
      .yScale(this.get('y'));
  }),
  yVolume: Ember.computed('y', function () {
    let y = this.get('y');
    return d3.scale.linear().range([y(0), y(0.2)]);
  }),
  volume: Ember.computed(function() {
    const yVolume = this.get('yVolume');
    return techan.plot.volume()
      .xScale(this.get('x'))
      .yScale(yVolume);
  }),
  ohlcAnnotation: Ember.computed(function() {
    return techan.plot.axisannotation()
      .axis(this.get('yAxis'))
      .format(d3.format(',.2fs'));
  }),
  timeAnnotation: Ember.computed(function() {
    return techan.plot.axisannotation()
      .axis(this.get('xAxis'))
      .format(d3.time.format('%Y-%m-%d'))
      .width(65)
      .translate([0, this.get('height')]);
  }),
  crosshair: Ember.computed(function() {
    const self = this;
    return techan.plot.crosshair()
      .xScale(this.get('x'))
      .yScale(this.get('y'))
      .xAnnotation(this.get('timeAnnotation'))
      .yAnnotation(this.get('ohlcAnnotation'));
  }),
  didInsertElement() {
    this._super(...arguments);
    const candlestick = this.get('candlestick');
    const svg = this.get('svg');
    const width = this.get('width');
    const height = this.get('height');
    const x = this.get('x');
    const y = this.get('y');
    const yVolume = this.get('yVolume');
    const accessor = candlestick.accessor();
    svg.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', y(1))
      .attr('width', width)
      .attr('height', y(0) - y(1));

    this.set('coordsText', svg.append('text')
      .style("text-anchor", "end")
      .attr("class", "coords")
      .attr("x", width - 5)
      .attr("y", 15));

    const data = this.get('mappedData')
      .sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    svg.append('g').datum(data).attr('class', 'candlestick').attr('clip-path', 'url(#clip)');
    svg.append('g').datum(data).attr('class', 'volume').attr('clip-path', 'url(#clip)');

    svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')');

    svg.append('g')
      .attr('class', 'y axis')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Price ($)');

    this.send('redraw');

    this.get('storage').on('newItem', (item) => {
      const dataFromStore = this.get('mappedData');
      dataFromStore.shift();
      dataFromStore.push(item);
      this.set('mappedData', dataFromStore);
      svg.select('g.candlestick').datum(dataFromStore);
      svg.select('g.volume').datum(dataFromStore);
      x.domain(dataFromStore.map(accessor.d));
      y.domain(techan.scale.plot.ohlc(dataFromStore, accessor).domain());
      yVolume.domain(techan.scale.plot.volume(dataFromStore).domain());

      this.send('redraw')
    });
  },
  actions: {
    redraw() {
      const candlestick = this.get('candlestick');
      const crosshair = this.get('crosshair');
      const volume = this.get('volume');
      const svg = this.get('svg');
      const yAxis = this.get('yAxis');
      const xAxis = this.get('xAxis');

      svg.select('g.candlestick').call(candlestick);
      svg.select('g.crosshair').call(crosshair);
      svg.select('g.volume').call(volume);
      svg.select('g.y.axis').call(yAxis);
      svg.select('g.x.axis').call(xAxis);
    }

  }
});
