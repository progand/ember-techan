/* globals d3,techan */
import Ember from 'ember';
import layout from './template';
import BaseChart from '../../base-chart';

export default BaseChart.extend({
  layout: layout,
  yAxisText: "",
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
      .format(d3.time.format('%Y-%m-%d %H:%M:%S'))
      .width(65)
      .translate([0, this.get('height')]);
  }),
  crosshair: Ember.computed(function() {
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
    const crosshair = this.get('crosshair');
    const parseDate = this.get('parseDate');
    const accessor = candlestick.accessor();
    const data = this.get('storage').get('data');

    svg.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', y(1))
      .attr('width', width)
      .attr('height', y(0) - y(1));

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
      .text(this.get('yAxisText'));

    svg.append('g').attr("class", "crosshair").call(crosshair);

    this.send('redraw');

    this.get('storage').on('newItem', () => {
      let dataFromStore = this.get('storage').get('data');

      svg.select('g.candlestick').datum(dataFromStore);
      svg.select('g.volume').datum(dataFromStore);
      x.domain(dataFromStore.map(accessor.d));
      y.domain(techan.scale.plot.ohlc(dataFromStore, accessor).domain());
      yVolume.domain(techan.scale.plot.volume(dataFromStore).domain());

      this.send('redraw');
    });
    const predefinedData = this.get('data');
    if (predefinedData instanceof Array || predefinedData.length > 0) {
      this.get('storage').addItems(predefinedData.map((item) => {
        return {
          date: parseDate(item.date),
          open: +item.open,
          high: +item.high,
          low: +item.low,
          close: +item.close,
          volume: +item.volume
        };
      })
      );
    }
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
