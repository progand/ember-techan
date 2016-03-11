/* globals d3,techan */
import Ember from 'ember';
import BaseChart from '../../base-chart';
import layout from './template';

export default BaseChart.extend({
  layout: layout,
  close: Ember.computed(function() {
    return techan.plot.close()
      .xScale(this.get('x'))
      .yScale(this.get('y'));
  }),
  didInsertElement() {
    this._super(...arguments);
    const svg = this.get('svg');
    const x = this.get('x');
    const y = this.get('y');
    const close = this.get('close');
    const xAxis = this.get('xAxis');
    const yAxis = this.get('yAxis');
    const height = this.get('height');

    let accessor = close.accessor();

    let data = this.get('mappedData').sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    x.domain(data.map(accessor.d));
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    svg.append("g")
      .datum(data)
      .attr("class", "close")
      .call(close);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price ($)");
  }
});
