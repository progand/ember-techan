import Ember from 'ember';
import layout from './template';
import BaseChart from '../../base-chart';

export default BaseChart.extend({
  layout: layout,
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
  zoom: Ember.computed(function () {
    return d3.behavior.zoom().on('zoom', () => this.send('redraw'));
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
      .yAnnotation(this.get('ohlcAnnotation'))
      .on('enter', () => this.send('enter'))
      .on('out', () => this.send('out'))
      .on('move', function() { self.send('move', ...arguments); });
  }),
  didInsertElement() {
    this._super(...arguments);
    const candlestick = this.get('candlestick');
    const svg = this.get('svg');
    const width = this.get('width');
    const height = this.get('height');
    const x = this.get('x');
    const y = this.get('y');
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

    const data = this.get('mappedData').sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

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

    svg.append('rect')
      .attr('class', 'pane')
      .attr('width', width)
      .attr('height', height)
      .call(this.get('zoom'));

    this.send('redraw');

    this.get('zoom').x(x.zoomable().clamp(false)).y(y);

    setInterval(() => {
      const item = data[Math.floor(Math.random() * data.length)];

      data.push({
        date: new Date(),
        open: +item.open,
        high: +item.high,
        low: +item.low,
        close: +item.close,
        volume: +item.volume
      });
      this.set('mappedData', data);
      this.send('redraw');
    }, 1000);

  },
  actions: {
    redraw() {
      const candlestick = this.get('candlestick');
      const crosshair = this.get('crosshair');
      const volume = this.get('volume');
      const yVolume = this.get('yVolume');
      const data = this.get('mappedData');
      const svg = this.get('svg');
      const yAxis = this.get('yAxis');
      const xAxis = this.get('xAxis');
      const x = this.get('x');
      const y = this.get('y');
      const accessor = candlestick.accessor();

      x.domain(data.map(accessor.d));
      y.domain(techan.scale.plot.ohlc(data, accessor).domain());
      yVolume.domain(techan.scale.plot.volume(data).domain());

      svg.select('g.candlestick').call(candlestick);
      svg.append('g').attr("class", "crosshair").call(crosshair);
      svg.select('g.volume').call(volume);
      svg.select('g.y.axis').call(yAxis);
      svg.select('g.x.axis').call(xAxis);
    },
    enter() {
      const coordsText = this.get('coordsText');
      coordsText.style("display", "inline");
      this.set('coordsText', coordsText);
    },
    move(coords) {
      const coordsText = this.get('coordsText');
      const timeAnnotation = this.get('timeAnnotation');
      const ohlcAnnotation = this.get('ohlcAnnotation');
      coordsText.text(
        timeAnnotation.format()(coords[0]) + ", " + ohlcAnnotation.format()(coords[1])
      );
      this.set('coordsText', coordsText);
    },
    out() {
      const coordsText = this.get('coordsText');
      coordsText.style("display", "none");
      this.set('coordsText', coordsText);
    },
    click(coords) {
      alert(coords);
    }

  }
});
