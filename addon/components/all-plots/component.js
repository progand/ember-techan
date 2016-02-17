import Ember from 'ember';
import layout from './template';
/* d3 global */
export default Ember.Component.extend({
  identificator: null,
  tagName: '',
  layout: layout,
  baseWidth: 960,
  baseHeight: 500,
  data: [],
  closeAnnotationValues: [],
  supstanceValues: [],
  trades: [],
  trendlineData: [],
  yAxisText: 'Price',
  dim: {
    margin: {top: 20, right: 50, bottom: 30, left: 50},
    ohlc: {height: 305},
    indicator: {height: 65, padding: 5}
  },
  plotWidth: Ember.computed('baseWidth', 'dim.margin.left', 'dim.margin.right', function () {
    return this.get('baseWidth') - this.get('dim.margin.left') - this.get('dim.margin.right');
  }),
  plotHeight: Ember.computed('baseHeight', 'dim.margin.top', 'dim.margin.bottom', function () {
    return this.get('baseHeight') - this.get('dim.margin.top') - this.get('dim.margin.bottom');
  }),
  'dim.indicator.top': Ember.computed('dim.ohlc.height', 'dim.indicator.padding', function () {
    return this.get('dim.ohlc.height') + this.get('dim.indicator.padding');
  }),
  'dim.indicator.bottom': Ember.computed('dim.indicator.top', 'dim.indicator.height', 'dim.indicator.padding', function () {
    return this.get('dim.indicator.top') + this.get('dim.indicator.height') + this.get('dim.indicator.padding');
  }),
  indicatorTop: Ember.computed('dim.indicator.top', 'dim.indicator.bottom', function () {
    return d3.scale.linear()
      .range([this.get('dim.indicator.top'), this.get('dim.indicator.bottom')]);
  }),
  parseDate: d3.time.format('%d-%b-%y').parse,
  zoom: Ember.computed(function () {
    return d3.behavior.zoom().on('zoom', () => this.send('draw'));
  }),
  zoomPercent: Ember.computed(function () {
    return d3.behavior.zoom();
  }),
  x: Ember.computed('plotWidth', function () {
    return techan.scale.financetime().range([0, this.get('plotWidth')]);
  }),
  y: Ember.computed('dim.ohlc.height', function () {
    return d3.scale.linear().range([this.get('dim.ohlc.height'), 0]);
  }),
  yPercent: Ember.computed('y', function () {
    return this.get('y').copy();
  }),
  yVolume: Ember.computed('y', function () {
    const y = this.get('y');
    return d3.scale.linear().range([y(0), y(0.2)]);
  }),
  candlestick: Ember.computed('x', 'y', function () {
    return techan.plot.candlestick().xScale(this.get('x')).yScale(this.get('y'));
  }),
  tradearrow: Ember.computed('x', 'y', function () {
    const x = this.get('x');
    const y = this.get('y');
    return techan.plot.tradearrow()
      .xScale(x)
      .yScale(y)
      .y(function (d) {
        // Display the buy and sell arrows a bit above and below the price, so the price is still visible
        if (d.type === 'buy') {
          return y(d.low) + 5;
        }
        if (d.type === 'sell') {
          return y(d.high) - 5;
        }
        else {
          return y(d.price);
        }
      });
  }),
  sma0: Ember.computed('x', 'y', function () {
    return techan.plot.sma().xScale(this.get('x')).yScale(this.get('y'));
  }),
  sma1: Ember.computed('x', 'y', function () {
    return techan.plot.sma().xScale(this.get('x')).yScale(this.get('y'));
  }),
  ema2: Ember.computed('x', 'y', function () {
    return techan.plot.ema().xScale(this.get('x')).yScale(this.get('y'));
  }),
  volume: Ember.computed('candlestick', 'x', 'yVolume', function () {
    return techan.plot.volume()
      .accessor(this.get('candlestick').accessor())
      .xScale(this.get('x'))
      .yScale(this.get('yVolume'));
  }),
  trendline: Ember.computed('x', 'y', function () {
    return techan.plot.trendline().xScale(this.get('x')).yScale(this.get('y'));
  }),
  supstance: Ember.computed('x', 'y', function () {
    return techan.plot.supstance().xScale(this.get('x')).yScale(this.get('y'));
  }),
  xAxis: Ember.computed('x', function () {
    return d3.svg.axis().scale(this.get('x')).orient('bottom');
  }),
  timeAnnotation: Ember.computed('xAxis', 'plotHeight', function () {
    return techan.plot.axisannotation()
      .axis(this.get('xAxis'))
      .format(d3.time.format('%Y-%m-%d %H:%M:%S'))
      .width(65)
      .translate([0, this.get('plotHeight')]);
  }),
  yAxis: Ember.computed('y', function () {
    return d3.svg.axis()
      .scale(this.get('y'))
      .orient('right');
  }),
  ohlcAnnotation: Ember.computed('x', 'yAxis', function () {
    const x = this.get('x');
    return techan.plot.axisannotation()
      .axis(this.get('yAxis'))
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);
  }),
  closeAnnotation: Ember.computed('x', 'yAxis', 'candlestick', function () {
    const x = this.get('x');
    return techan.plot.axisannotation()
      .axis(this.get('yAxis'))
      .accessor(this.get('candlestick').accessor())
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);
  }),
  percentAxis: Ember.computed('yPercent', function () {
    return d3.svg.axis()
      .scale(this.get('yPercent'))
      .orient('left')
      .tickFormat(d3.format('+.1%'));
  }),
  percentAnnotation: Ember.computed('percentAxis', function () {
    return techan.plot.axisannotation().axis(this.get('percentAxis'));
  }),
  volumeAxis: Ember.computed('yVolume', function () {
    return d3.svg.axis()
      .scale(this.get('yVolume'))
      .orient('right')
      .ticks(3)
      .tickFormat(d3.format(',.3s'));
  }),
  volumeAnnotation: Ember.computed('volumeAxis', function () {
    return techan.plot.axisannotation()
      .axis(this.get('volumeAxis'))
      .width(35);
  }),
  macdScale: Ember.computed('indicatorTop', 'dim.indicator.height', function () {
    const indicatorTop = this.get('indicatorTop');
    return d3.scale.linear()
      .range([indicatorTop(0) + this.get('dim.indicator.height'), indicatorTop(0)]);
  }),
  rsiScale: Ember.computed('indicatorTop', 'macdScale', 'dim.indicator.height', function () {
    const indicatorTop = this.get('indicatorTop');
    return this.get('macdScale').copy()
      .range([indicatorTop(1) + this.get('dim.indicator.height'), indicatorTop(1)]);
  }),
  macd: Ember.computed('x', 'macdScale', function () {
    return techan.plot.macd().xScale(this.get('x')).yScale(this.get('macdScale'));
  }),
  macdAxis: Ember.computed('macdScale', function () {
    return d3.svg.axis()
      .scale(this.get('macdScale'))
      .ticks(3)
      .orient('right');
  }),
  macdAnnotation: Ember.computed('x', 'macdAxis', function () {
    const x = this.get('x');
    return techan.plot.axisannotation()
      .axis(this.get('macdAxis'))
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);
  }),
  macdAxisLeft: Ember.computed('macdScale', function () {
    return d3.svg.axis()
      .scale(this.get('macdScale'))
      .ticks(3)
      .orient('left');
  }),
  macdAnnotationLeft: Ember.computed('macdAxisLeft', function () {
    return techan.plot.axisannotation()
      .axis(this.get('macdAxisLeft'))
      .format(d3.format(',.2fs'));
  }),
  rsi: Ember.computed('x', 'rsiScale', function () {
    return techan.plot.rsi()
      .xScale(this.get('x'))
      .yScale(this.get('rsiScale'));
  }),
  rsiAxis: Ember.computed('rsiScale', function () {
    return d3.svg.axis()
      .scale(this.get('rsiScale'))
      .ticks(3)
      .orient('right');
  }),
  rsiAnnotation: Ember.computed('x', 'rsiAxis', function () {
    const x = this.get('x');
    return techan.plot.axisannotation()
      .axis(this.get('rsiAxis'))
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);
  }),
  rsiAxisLeft: Ember.computed('rsiScale', function () {
    return d3.svg.axis()
      .scale(this.get('rsiScale'))
      .ticks(3)
      .orient('left');
  }),
  rsiAnnotationLeft: Ember.computed('rsiAxisLeft', function () {
    return techan.plot.axisannotation()
      .axis(this.get('rsiAxisLeft'))
      .format(d3.format(',.2fs'));
  }),
  ohlcCrosshair: Ember.computed('timeAnnotation', 'ohlcAnnotation', 'percentAnnotation', 'volumeAnnotation', 'plotHeight', function () {
    const timeAnnotation = this.get('timeAnnotation');
    const ohlcAnnotation = this.get('ohlcAnnotation');
    const percentAnnotation = this.get('percentAnnotation');
    const volumeAnnotation = this.get('volumeAnnotation');
    return techan.plot.crosshair()
      .xScale(timeAnnotation.axis().scale())
      .yScale(ohlcAnnotation.axis().scale())
      .xAnnotation(timeAnnotation)
      .yAnnotation([ohlcAnnotation, percentAnnotation, volumeAnnotation])
      .verticalWireRange([0, this.get('plotHeight')]);
  }),
  macdCrosshair: Ember.computed('timeAnnotation', 'macdAnnotation', 'macdAnnotationLeft', 'plotHeight', function () {
    const timeAnnotation = this.get('timeAnnotation');
    const macdAnnotation = this.get('macdAnnotation');
    const macdAnnotationLeft = this.get('macdAnnotationLeft');
    return techan.plot.crosshair()
      .xScale(timeAnnotation.axis().scale())
      .yScale(macdAnnotation.axis().scale())
      .xAnnotation(timeAnnotation)
      .yAnnotation([macdAnnotation, macdAnnotationLeft])
      .verticalWireRange([0, this.get('plotHeight')]);
  }),
  rsiCrosshair: Ember.computed('timeAnnotation', 'rsiAnnotation', 'rsiAnnotationLeft', 'plotHeight', function () {
    const timeAnnotation = this.get('timeAnnotation');
    const rsiAnnotation = this.get('rsiAnnotation');
    const rsiAnnotationLeft = this.get('rsiAnnotationLeft');
    return techan.plot.crosshair()
      .xScale(timeAnnotation.axis().scale())
      .yScale(rsiAnnotation.axis().scale())
      .xAnnotation(timeAnnotation)
      .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
      .verticalWireRange([0, this.get('plotHeight')]);
  }),
  init() {
    this._super(...arguments);
    this.set('identificator', 'plot-' + Math.floor(Math.random() * (9000000 - 1000000) + 1000000))
  },

  didInsertElement() {
    const baseWidth = this.get('baseWidth');
    const baseHeight = this.get('baseHeight');
    const dim = this.get('dim');
    const plotWidth = this.get('plotWidth');
    const plotHeight = this.get('plotHeight');
    const indicatorTop = this.get('indicatorTop');
    const x = this.get('x');
    const candlestick = this.get('candlestick');
    const y = this.get('y');
    const yPercent = this.get('yPercent');
    const yVolume = this.get('yVolume');
    const macdScale = this.get('macdScale');
    const rsiScale = this.get('rsiScale');
    const closeAnnotation = this.get('closeAnnotation');
    const volume = this.get('volume');
    const sma0 = this.get('sma0');
    const sma1 = this.get('sma1');
    const ema2 = this.get('ema2');
    const macd = this.get('macd');
    const rsi = this.get('rsi');
    const ohlcCrosshair = this.get('ohlcCrosshair');
    const macdCrosshair = this.get('macdCrosshair');
    const rsiCrosshair = this.get('rsiCrosshair');
    const trendline = this.get('trendline');
    const supstance = this.get('supstance');
    const supstanceData = this.get('supstanceValues');
    const tradearrow = this.get('tradearrow');
    const zoom = this.get('zoom');
    const zoomPercent = this.get('zoomPercent');
    const parseDate = this.get('parseDate');
    const trades = this.get('trades');
    const trendlineData = this.get('trendlineData');

    const svg = d3.select('#' + this.get('identificator'))
      .attr('width', baseWidth)
      .attr('height', baseHeight);

    const defs = svg.append('defs');

    defs.append('clipPath')
      .attr('id', 'ohlcClip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plotWidth)
      .attr('height', dim.ohlc.height);

    defs.selectAll('indicatorClip').data([0, 1])
      .enter()
      .append('clipPath')
      .attr('id', function (d, i) {
        return 'indicatorClip-' + i;
      })
      .append('rect')
      .attr('x', 0)
      .attr('y', function (d, i) {
        return indicatorTop(i);
      })
      .attr('width', plotWidth)
      .attr('height', dim.indicator.height);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + plotHeight + ')');

    const ohlcSelection = svg.append('g')
      .attr('class', 'ohlc')
      .attr('transform', 'translate(0,0)');

    ohlcSelection.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(' + x(1) + ',0)')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -12)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(this.get('yAxisText'));

    ohlcSelection.append('g')
      .attr('class', 'close annotation up');

    ohlcSelection.append('g')
      .attr('class', 'volume')
      .attr('clip-path', 'url(#ohlcClip)');

    ohlcSelection.append('g')
      .attr('class', 'candlestick')
      .attr('clip-path', 'url(#ohlcClip)');

    ohlcSelection.append('g')
      .attr('class', 'indicator sma ma-0')
      .attr('clip-path', 'url(#ohlcClip)');

    ohlcSelection.append('g')
      .attr('class', 'indicator sma ma-1')
      .attr('clip-path', 'url(#ohlcClip)');

    ohlcSelection.append('g')
      .attr('class', 'indicator ema ma-2')
      .attr('clip-path', 'url(#ohlcClip)');

    ohlcSelection.append('g')
      .attr('class', 'percent axis');

    ohlcSelection.append('g')
      .attr('class', 'volume axis');

    const indicatorSelection = svg.selectAll('svg > g.indicator').data(['macd', 'rsi']).enter()
      .append('g')
      .attr('class', function (d) {
        return d + ' indicator';
      });

    indicatorSelection.append('g')
      .attr('class', 'axis right')
      .attr('transform', 'translate(' + x(1) + ',0)');

    indicatorSelection.append('g')
      .attr('class', 'axis left')
      .attr('transform', 'translate(' + x(0) + ',0)');

    indicatorSelection.append('g')
      .attr('class', 'indicator-plot')
      .attr('clip-path', function (d, i) {
        return 'url(#indicatorClip-' + i + ')';
      });

    // Add trendlines and other interactions last to be above zoom pane
    svg.append('g')
      .attr('class', 'crosshair ohlc');

    svg.append('g')
      .attr('class', 'tradearrow')
      .attr('clip-path', 'url(#ohlcClip)');

    svg.append('g')
      .attr('class', 'crosshair macd');

    svg.append('g')
      .attr('class', 'crosshair rsi');

    svg.append('g')
      .attr('class', 'trendlines analysis')
      .attr('clip-path', 'url(#ohlcClip)');
    svg.append('g')
      .attr('class', 'supstances analysis')
      .attr('clip-path', 'url(#ohlcClip)');

    const accessor = candlestick.accessor(),
      indicatorPreRoll = 0;  // Don't show where indicators don't have data

    const data = this.get('data').map(function (d) {
      return {
        date: parseDate(d.date),
        open: +d.open,
        high: +d.high,
        low: +d.low,
        close: +d.close,
        volume: +d.volume
      };
    }).sort(function (a, b) {
      return d3.ascending(accessor.d(a), accessor.d(b));
    });

    x.domain(techan.scale.plot.time(data).domain());
    y.domain(techan.scale.plot.ohlc(data.slice(indicatorPreRoll)).domain());
    yPercent.domain(techan.scale.plot.percent(y, accessor(data[indicatorPreRoll])).domain());
    yVolume.domain(techan.scale.plot.volume(data).domain());

    const macdData = techan.indicator.macd()(data);
    macdScale.domain(techan.scale.plot.macd(macdData).domain());
    const rsiData = techan.indicator.rsi()(data);
    rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());

    svg.select('g.candlestick').datum(data).call(candlestick);
    svg.select('g.close.annotation').datum(this.get('closeAnnotationValues')).call(closeAnnotation);
    svg.select('g.volume').datum(data).call(volume);
    svg.select('g.sma.ma-0').datum(techan.indicator.sma().period(10)(data)).call(sma0);
    svg.select('g.sma.ma-1').datum(techan.indicator.sma().period(20)(data)).call(sma1);
    svg.select('g.ema.ma-2').datum(techan.indicator.ema().period(50)(data)).call(ema2);
    svg.select('g.macd .indicator-plot').datum(macdData).call(macd);
    svg.select('g.rsi .indicator-plot').datum(rsiData).call(rsi);

    svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);
    svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
    svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
    svg.select("g.trendlines").datum(trendlineData).call(trendline).call(trendline.drag);
    svg.select("g.supstances").datum(supstanceData).call(supstance).call(supstance.drag);

    svg.select("g.tradearrow").datum(trades).call(tradearrow);

    const zoomable = x.zoomable();
    zoomable.domain([indicatorPreRoll, data.length]); // Zoom in a little to hide indicator preroll
    this.set('svg', svg);

    this.send('draw');

    // Associate the zoom with the scale after a domain has been applied
    zoom.x(zoomable).y(y);
    zoomPercent.y(yPercent);
  },
  actions: {
    draw() {
      const svg = this.get('svg');
      const zoomPercent = this.get('zoomPercent');
      const zoom = this.get('zoom');
      const xAxis = this.get('xAxis');
      const yAxis = this.get('yAxis');
      const volumeAxis = this.get('volumeAxis');
      const percentAxis = this.get('percentAxis');
      const macdAxis = this.get('macdAxis');
      const rsiAxis = this.get('rsiAxis');
      const macdAxisLeft = this.get('macdAxisLeft');
      const rsiAxisLeft = this.get('rsiAxisLeft');
      const candlestick = this.get('candlestick');
      const closeAnnotation = this.get('closeAnnotation');
      const volume = this.get('volume');
      const sma0 = this.get('sma0');
      const sma1 = this.get('sma1');
      const ema2 = this.get('ema2');
      const macd = this.get('macd');
      const rsi = this.get('rsi');
      const ohlcCrosshair = this.get('ohlcCrosshair');
      const macdCrosshair = this.get('macdCrosshair');
      const rsiCrosshair = this.get('rsiCrosshair');
      const trendline = this.get('trendline');
      const supstance = this.get('supstance');
      const tradearrow = this.get('tradearrow');

      zoomPercent.translate(zoom.translate());
      zoomPercent.scale(zoom.scale());

      svg.select('g.x.axis').call(xAxis);
      svg.select('g.ohlc .axis').call(yAxis);
      svg.select('g.volume.axis').call(volumeAxis);
      svg.select('g.percent.axis').call(percentAxis);
      svg.select('g.macd .axis.right').call(macdAxis);
      svg.select('g.rsi .axis.right').call(rsiAxis);
      svg.select('g.macd .axis.left').call(macdAxisLeft);
      svg.select('g.rsi .axis.left').call(rsiAxisLeft);
      svg.select('g.candlestick').call(candlestick.refresh);
      svg.select('g.close.annotation').call(closeAnnotation.refresh);
      svg.select('g.volume').call(volume.refresh);
      svg.select('g .sma.ma-0').call(sma0.refresh);
      svg.select('g .sma.ma-1').call(sma1.refresh);
      svg.select('g .ema.ma-2').call(ema2.refresh);
      svg.select('g.macd .indicator-plot').call(macd.refresh);
      svg.select('g.rsi .indicator-plot').call(rsi.refresh);
      svg.select('g.crosshair.ohlc').call(ohlcCrosshair.refresh);
      svg.select('g.crosshair.macd').call(macdCrosshair.refresh);
      svg.select('g.crosshair.rsi').call(rsiCrosshair.refresh);
      svg.select('g.trendlines').call(trendline.refresh);
      svg.select('g.supstances').call(supstance.refresh);
      svg.select('g.tradearrow').call(tradearrow.refresh);
    },
    reset() {
      const zoom = this.get('zoom');
      zoom.scale(1);
      zoom.translate([0, 0]);
      this.send('draw');
    }
  }
});