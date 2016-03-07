import Ember from 'ember';
import layout from './template';

/**
 * Change type, rsi, macd etc. on-the-fly and use redraw method to re-render your charts.
 *
 * @author Andreev <andreev1024@gmail.com>
 * @version ver 1.0 added on 2016-03-05
 * @access  public
 */
export default Ember.Component.extend({
  layout: layout,
  currentUrl: null,
  identificator: null,
  svg: null,
  type: 'candlestick',
  macd: true,
  rsi: true,
  ichimoku: false,
  resetSelector: '.reset',
  allIndicators: { //  edit if u add new indicator
    'macd': {
      'separateClip': true
    },
    'rsi': {
      'separateClip': true
    },
    'ichimoku': {
      'separateClip': false
    }
  },
  enabledIndicators: Ember.computed('macd', 'rsi', 'ichimoku', function() { //  edit if u add new indicator
    const allIndicators = this.get('allIndicators');
    let enabledIndicators = [];
    for (let indicatorName in allIndicators) {
      if (allIndicators.hasOwnProperty(indicatorName) && this.get(indicatorName)) {
        enabledIndicators.push(indicatorName);
      }
    }

    return enabledIndicators;
  }),
  height: 500,
  chartHeight: 305,
  width: 900,
  indicatorHeight: 65,
  indicatorPadding: 5,
  margin: {
    top: 20,
    right: 50,
    bottom: 30,
    left: 50
  },
  _chartHeight: 305,
  dim: Ember.computed('width', 'height', 'margin', '_chartHeight', 'indicatorHeight', 'indicatorPadding', function() {
    return {
      width: this.get('width'),
      height: this.get('height'),
      margin: this.get('margin'),
      chart: {
        height: this.get('_chartHeight')
      },
      indicator: {
        height: this.get('indicatorHeight'),
        padding: this.get('indicatorPadding')
      }
    };
  }),
  actions: {
    redraw() {
      this.get('svg').selectAll('*').remove();
      this.draw();
    }
  },
  init() {
    this._super(...arguments);

    if (!this.get('currentUrl')) {
      throw new Error('Required argument missed: currentUrl')
    }

    this.set('identificator', 'plot-' + Math.floor(Math.random() * (9000000 - 1000000) + 1000000));
  },
  refreshChartHeight() {
    const dim = this.get('dim');
    const allIndicators = this.get('allIndicators');
    const enabledIndicators = this.get('enabledIndicators');
    const fullIndeicatorHeight = dim.indicator.height + dim.indicator.padding;
    let i = 0;
    for (let indicatorName in allIndicators) {
      let propertyIsset = allIndicators.hasOwnProperty(indicatorName);
      let idicatorUseSeparateClip = allIndicators[indicatorName]['separateClip'];
      let isEnable = this.isIndicatorEnable(indicatorName);
      if (propertyIsset && idicatorUseSeparateClip && !isEnable) {
        i++;
      }
    }

    this.set('_chartHeight', this.get('chartHeight') + i * fullIndeicatorHeight);
  },
  didInsertElement() {
    this._super(...arguments);

    const dim = this.get('dim');
    const svg = d3.select('#' + this.get('identificator'))
      .attr('width', dim.width)
      .attr('height', dim.height);

    this.set('svg', svg);
    this.draw();
    
    this.updatePlotWidth = () => {
      Ember.run.bind(this, Ember.run.throttle(this, function () {
        this.set('width', this.$().width());
        this.actions.redraw.apply(this, ...arguments);
      }, 150));
    }
    Ember.$(window).on('resize', this.updatePlotWidth);
    this.updatePlotWidth();
  },
  willDestroyElement() {
    this._super(...arguments);
    Ember.$(window).off('resize', this.updatePlotWidth);
    this.updatePlotWidth = null;
  },
  isIndicatorEnable(indicatorName) {
    return $.inArray(indicatorName, this.get('enabledIndicators')) !== -1;
  },
  getClipUrl(clipId) {
    return "url(" + this.get('currentUrl') + "#" + clipId + ")";
  },
  draw() {
    this.refreshChartHeight();
    const isRsi = this.isIndicatorEnable('rsi');
    const isMacd = this.isIndicatorEnable('macd');
    const isIchimoku = this.isIndicatorEnable('ichimoku');
    const dim = this.get('dim');
    const component = this;

    dim.plot = {
      width: dim.width - dim.margin.left - dim.margin.right,
      height: dim.height - dim.margin.top - dim.margin.bottom
    };
    dim.indicator.top = dim.chart.height + dim.indicator.padding;
    dim.indicator.bottom = dim.indicator.top + dim.indicator.height + dim.indicator.padding;

    const indicatorTop = d3.scale.linear()
      .range([dim.indicator.top, dim.indicator.bottom]);

    const parseDate = d3.time.format("%d-%b-%y").parse;

    const zoom = d3.behavior.zoom()
      .on("zoom", draw);

    const zoomPercent = d3.behavior.zoom();

    const x = techan.scale.financetime()
      .range([0, dim.plot.width]);

    const y = d3.scale.linear()
      .range([dim.chart.height, 0]);

    const yPercent = y.copy(); // Same as y at this stage, will get a different domain later

    const yVolume = d3.scale.linear()
      .range([y(0), y(0.2)]);

    const chartType = this.get('type');

    const chart = techan.plot[chartType]()
      .xScale(x)
      .yScale(y);

    const sma0 = techan.plot.sma()
      .xScale(x)
      .yScale(y);

    const sma1 = techan.plot.sma()
      .xScale(x)
      .yScale(y);

    const ema2 = techan.plot.ema()
      .xScale(x)
      .yScale(y);

    const volume = techan.plot.volume()
      .accessor(chart.accessor()) // Set the accessor to a chart (ohlc) accessor so we get highlighted bars
      .xScale(x)
      .yScale(yVolume);

    const xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    const timeAnnotation = techan.plot.axisannotation()
      .axis(xAxis)
      .format(d3.time.format('%Y-%m-%d'))
      .width(65)
      .translate([0, dim.plot.height]);

    const yAxis = d3.svg.axis()
      .scale(y)
      .orient("right");

    const chartAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);

    const closeAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .accessor(chart.accessor())
      .format(d3.format(',.2fs'))
      .translate([x(1), 0]);

    const percentAxis = d3.svg.axis()
      .scale(yPercent)
      .orient("left")
      .tickFormat(d3.format('+.1%'));

    const percentAnnotation = techan.plot.axisannotation()
      .axis(percentAxis);

    const volumeAxis = d3.svg.axis()
      .scale(yVolume)
      .orient("right")
      .ticks(3)
      .tickFormat(d3.format(",.3s"));

    const volumeAnnotation = techan.plot.axisannotation()
      .axis(volumeAxis)
      .width(35);

    let macdScale;
    let macd;
    let macdAxis;
    let macdAnnotation;
    let macdAxisLeft;
    let macdAnnotationLeft;
    let macdCrosshair;

    if (isMacd) {
      const indicatorIndex = $.inArray('macd', this.get('enabledIndicators'));
      macdScale = d3.scale.linear()
        .range([indicatorTop(indicatorIndex) + dim.indicator.height, indicatorTop(indicatorIndex)]);

      macd = techan.plot.macd()
        .xScale(x)
        .yScale(macdScale);

      macdAxis = d3.svg.axis()
        .scale(macdScale)
        .ticks(3)
        .orient("right");

      macdAnnotation = techan.plot.axisannotation()
        .axis(macdAxis)
        .format(d3.format(',.2fs'))
        .translate([x(1), 0]);

      macdAxisLeft = d3.svg.axis()
        .scale(macdScale)
        .ticks(3)
        .orient("left");

      macdAnnotationLeft = techan.plot.axisannotation()
        .axis(macdAxisLeft)
        .format(d3.format(',.2fs'));

      macdCrosshair = techan.plot.crosshair()
        .xScale(timeAnnotation.axis().scale())
        .yScale(macdAnnotation.axis().scale())
        .xAnnotation(timeAnnotation)
        .yAnnotation([macdAnnotation, macdAnnotationLeft])
        .verticalWireRange([0, dim.plot.height]);
    }

    let rsiScale;
    let rsi;
    let rsiAxis;
    let rsiAnnotation;
    let rsiAxisLeft;
    let rsiAnnotationLeft;
    let rsiCrosshair;

    if (isRsi) {
      const indicatorIndex = $.inArray('rsi', this.get('enabledIndicators'));
      //  macdScale.copy()
      rsiScale = d3.scale.linear()
        .range([indicatorTop(indicatorIndex) + dim.indicator.height, indicatorTop(indicatorIndex)]);

      rsi = techan.plot.rsi()
        .xScale(x)
        .yScale(rsiScale);

      rsiAxis = d3.svg.axis()
        .scale(rsiScale)
        .ticks(3)
        .orient("right");

      rsiAnnotation = techan.plot.axisannotation()
        .axis(rsiAxis)
        .format(d3.format(',.2fs'))
        .translate([x(1), 0]);

      rsiAxisLeft = d3.svg.axis()
        .scale(rsiScale)
        .ticks(3)
        .orient("left");

      rsiAnnotationLeft = techan.plot.axisannotation()
        .axis(rsiAxisLeft)
        .format(d3.format(',.2fs'));

      rsiCrosshair = techan.plot.crosshair()
        .xScale(timeAnnotation.axis().scale())
        .yScale(rsiAnnotation.axis().scale())
        .xAnnotation(timeAnnotation)
        .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
        .verticalWireRange([0, dim.plot.height]);
    }

    const chartCrosshair = techan.plot.crosshair()
      .xScale(timeAnnotation.axis().scale())
      .yScale(chartAnnotation.axis().scale())
      .xAnnotation(timeAnnotation)
      .yAnnotation([chartAnnotation, percentAnnotation, volumeAnnotation])
      .verticalWireRange([0, dim.plot.height]);

    let svg = this.get('svg');
    const defs = svg.append("defs");

    defs
      .append("clipPath")
      .attr("id", "chartClip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dim.plot.width)
      .attr("height", dim.chart.height);

    const indicators = this.get('enabledIndicators');
    defs.selectAll("indicatorClip").data(Object.keys(indicators))
      .enter()
      .append("clipPath")
      .attr("id", function(d, i) {
        return "indicatorClip-" + i;
      })
      .append("rect")
      .attr("x", 0)
      .attr("y", function(d, i) {
        return indicatorTop(i);
      })
      .attr("width", dim.plot.width)
      .attr("height", dim.indicator.height);

    svg = svg.append("g")
      .attr("transform", "translate(" + dim.margin.left + "," + dim.margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + dim.plot.height + ")");

    const chartSelection = svg.append("g")
      .attr("class", "chart")
      .attr("transform", "translate(0,0)");

    chartSelection.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + x(1) + ",0)")
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -12)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price ($)");

    chartSelection.append("g")
      .attr("class", "close annotation up");

    chartSelection.append("g")
      .attr("class", "volume")
      .attr("clip-path", this.getClipUrl('chartClip'));

    chartSelection.append("g")
      .attr("class", chartType)
      .attr("clip-path", this.getClipUrl('chartClip'));

    chartSelection.append("g")
      .attr("class", "indicator sma ma-0")
      .attr("clip-path", this.getClipUrl('chartClip'));

    chartSelection.append("g")
      .attr("class", "indicator sma ma-1")
      .attr("clip-path", this.getClipUrl('chartClip'));

    chartSelection.append("g")
      .attr("class", "indicator ema ma-2")
      .attr("clip-path", this.getClipUrl('chartClip'));

    chartSelection.append("g")
      .attr("class", "percent axis");

    chartSelection.append("g")
      .attr("class", "volume axis");

    const indicatorSelection = svg.selectAll("svg > g.indicator")
      .data(indicators)
      .enter()
      .append("g")
      .attr("class", function(d) {
        return d + " indicator";
      });

    indicatorSelection.append("g")
      .attr("class", "axis right")
      .attr("transform", "translate(" + x(1) + ",0)");

    indicatorSelection.append("g")
      .attr("class", "axis left")
      .attr("transform", "translate(" + x(0) + ",0)");

    indicatorSelection.append("g")
      .attr("class", "indicator-plot")
      .attr("clip-path", function(d, i) {
        return component.getClipUrl("indicatorClip-" + i);
      });

    // Add trendlines and other interactions last to be above zoom pane
    svg.append('g')
      .attr("class", "crosshair chart");

    isMacd ? svg.append('g').attr("class", "crosshair macd") : null;
    isRsi ? svg.append('g').attr("class", "crosshair rsi") : null;

    d3.select(this.get('resetSelector')).on("click", reset);

    const accessor = chart.accessor(),
      indicatorPreRoll = 33; // Don't show where indicators don't have data

    const data = this.get('data').map(function(d) {
      return {
        date: parseDate(d.date),
        open: +d.open,
        high: +d.high,
        low: +d.low,
        close: +d.close,
        volume: +d.volume
      };
    }).sort(function(a, b) {
      return d3.ascending(accessor.d(a), accessor.d(b));
    });

    x.domain(techan.scale.plot.time(data).domain());
    y.domain(techan.scale.plot.ohlc(data.slice(indicatorPreRoll)).domain());
    yPercent.domain(techan.scale.plot.percent(y, accessor(data[indicatorPreRoll])).domain());
    yVolume.domain(techan.scale.plot.volume(data).domain());

    let macdData;
    if (isMacd) {
      macdData = techan.indicator.macd()(data);
      macdScale.domain(techan.scale.plot.macd(macdData).domain());
    }

    let rsiData;
    if (isRsi) {
      rsiData = techan.indicator.rsi()(data);
      rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());
    }

    let ichimoku;
    if (isIchimoku) {
      ichimoku = techan.plot.ichimoku()
        .xScale(x)
        .yScale(y);

      const ichimokuData = techan.indicator.ichimoku()(data);

      chartSelection.append("g")
        .datum(ichimokuData)
        .attr("class", "ichimoku")
        .attr("clip-path", this.getClipUrl("chartClip"))
        .call(ichimoku);
    }

    svg.select("g." + chartType).datum(data).call(chart);
    svg.select("g.close.annotation").datum([data[data.length - 1]]).call(closeAnnotation);
    svg.select("g.volume").datum(data).call(volume);
    svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(10)(data)).call(sma0);
    svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(20)(data)).call(sma1);
    svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(50)(data)).call(ema2);
    isMacd ? svg.select("g.macd .indicator-plot").datum(macdData).call(macd) : null;
    isRsi ? svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi) : null;

    svg.select("g.crosshair.chart").call(chartCrosshair).call(zoom);
    isMacd ? svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom) : null;
    isRsi ? svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom) : null;

    const zoomable = x.zoomable();
    zoomable.domain([indicatorPreRoll, data.length]); // Zoom in a little to hide indicator preroll

    draw();

    // Associate the zoom with the scale after a domain has been applied
    zoom.x(zoomable).y(y);
    zoomPercent.y(yPercent);

    function reset() {
      zoom.scale(1);
      zoom.translate([0, 0]);
      draw();
    }

    function draw() {
      zoomPercent.translate(zoom.translate());
      zoomPercent.scale(zoom.scale());

      svg.select("g.x.axis").call(xAxis);
      svg.select("g.chart .axis").call(yAxis);
      svg.select("g.volume.axis").call(volumeAxis);
      svg.select("g.percent.axis").call(percentAxis);

      // We know the data does not change, a simple refresh that does not perform data joins will suffice.

      if (isIchimoku) {
        svg.select("g.ichimoku").call(ichimoku.refresh);
      }

      if (isMacd) {
        svg.select("g.macd .axis.right").call(macdAxis);
        svg.select("g.macd .axis.left").call(macdAxisLeft);

        svg.select("g.macd .indicator-plot").call(macd.refresh);
        svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
      }

      if (isRsi) {
        svg.select("g.rsi .axis.right").call(rsiAxis);
        svg.select("g.rsi .axis.left").call(rsiAxisLeft);

        svg.select("g.rsi .indicator-plot").call(rsi.refresh);
        svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);
      }

      svg.select("g." + chartType).call(chart.refresh);
      svg.select("g.close.annotation").call(closeAnnotation.refresh);
      svg.select("g.volume").call(volume.refresh);
      svg.select("g .sma.ma-0").call(sma0.refresh);
      svg.select("g .sma.ma-1").call(sma1.refresh);
      svg.select("g .ema.ma-2").call(ema2.refresh);
      svg.select("g.crosshair.chart").call(chartCrosshair.refresh);
    }
  }
});
