  export function RadarChart(id, data, options) {
    var cfg = {
      // w: Math.min(window.innerWidth * .5, 600),                // Width of the circle
      // h: Math.min(window.innerHeight * .5, 450),                // Height of the circle
      levels: 3,                // How many levels or inner circles should there be drawn
      labelFactor: 1.15,     // How much farther than the radius of the outer circle should the labels be placed
      wrapWidth: 100,         // The number of pixels after which a label needs to be given a new line
      opacityArea: 0.6,     // The opacity of the area of the blob
      dotRadius: 7,             // The size of the colored circles of each blog
      opacityCircles: 0.1,     // The opacity of the circles of each blob
      strokeWidth: 2,         // The width of the stroke around each blob
      roundStrokes: true,    // If true the area and stroke will follow a round path (cardinal-closed)
    };

    // Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
      for (var i in options) {
        if ('undefined' !== typeof options[i]) { cfg[i] = options[i]; }
      }
    }

    // Get the keys (axes) from the first dataset
    var allAxis = Object.keys(data[Object.keys(data)[0]]["normalized"]);

    var dataArray = [];
    var count = 0;  // To ensure unique identifiers for the same player
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var dataPoints = [];
        for (var i = 0; i < allAxis.length; i++) {
          dataPoints.push({
            axis: allAxis[i],
            value: data[key]["normalized"][allAxis[i]],
            originalValue: data[key]["original"][allAxis[i]],
            playerKey: key + "_" + count  // Ensuring unique key by adding a counter
          });
        }
        dataArray.push(dataPoints);
        count++;  // Increment the counter to differentiate between datasets
      }
    }

    // If the supplied maxValue is smaller than the actual one, replace by the max in the data
    var maxValue = Math.max(cfg.maxValue, d3.max(dataArray, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));

    var total = allAxis.length,                    // The number of different axes
        radius = Math.min(cfg.w * .38, cfg.h * .5),     // Radius of the outermost circle
        Format = d3.format('%'),                 // Percentage formatting
        angleSlice = Math.PI * 2 / total;        // The width in radians of each "slice"

    // Scale for the radius
    var rScale = d3.scale.linear()
      .range([0, radius])
      .domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    // Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();

    // Initiate the radar chart SVG
    var svg = d3.select(id).append("svg")
      .attr("width", cfg.w)
      .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
      .attr("class", "radar" + id)
      .style("align-self", "center");

    // Append a g element with an initial scale of 80%    
    var g = svg.append("g")
      .attr("transform", "translate(" + (cfg.w / 2) + "," + (cfg.h / 2 + cfg.margin.top) + ") scale(0.83)");

    // Animate the scale to 100%
    g.transition()
      .duration(800) // Animation duration in milliseconds
      .attr("transform", "translate(" + (cfg.w / 2) + "," + (cfg.h / 2 + cfg.margin.top) + ") scale(1)");

    /////////////////////////////////////////////////////////
    ////////// Glow filter for some extra pizzazz ///////////
    /////////////////////////////////////////////////////////

    // Filter for the outside glow
    var filter = g.append('defs').append('filter').attr('id', 'glow'),
      feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '0.5').attr('result', 'coloredBlur'),
      feMerge = filter.append('feMerge'),
      feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
      feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    // Wrapper for the grid & axes
    var axisGrid = g.append("g").attr("class", "axisWrapper");

    // Draw the background circles
    axisGrid.selectAll(".levels")
      .data(d3.range(1, (cfg.levels + 1)).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", function (d, i) { return radius / cfg.levels * d; })
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", cfg.opacityCircles);

    // Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

    // Append the lines
    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", function (d, i) { return rScale(maxValue * 1.0) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr("y2", function (d, i) { return rScale(maxValue * 1.0) * Math.sin(angleSlice * i - Math.PI / 2); })
      .attr("class", "line")
      .style("stroke", "#121212")
      .style("stroke-width", "4px");

    // Append the labels at each axis
    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "18px")
      .style("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr("y", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2); })
      .text(function (d) { return d })
      .call(wrap, cfg.wrapWidth);

    // The radial line function
    var radarLine = d3.svg.line.radial()
      .interpolate("linear-closed")
      .radius(function (d) { return rScale(d.value); })
      .angle(function (d, i) { return i * angleSlice; });

    if (cfg.roundStrokes) {
      radarLine.interpolate("cardinal-closed");
    }

    // Create a wrapper for the blobs    
    var blobWrapper = g.selectAll(".radarWrapper")
      .data(dataArray)
      .enter().append("g")
      .attr("class", "radarWrapper");

    // Append the backgrounds    
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", function (d, i) { return radarLine(d); })
      .style("fill", function (d, i) { return cfg.color(i); })
      .style("fill-opacity", cfg.opacityArea)
      .on('mouseover', function (d, i) {
        // Dim all blobs
        d3.selectAll(".radarArea")
          .transition().duration(200)
          .style("fill-opacity", 0.1);
        // Bring back the hovered over blob
        d3.select(this)
          .transition().duration(200)
          .style("fill-opacity", 0.7);
      })
      .on('mouseout', function () {
        // Bring back all blobs
        d3.selectAll(".radarArea")
          .transition().duration(200)
          .style("fill-opacity", cfg.opacityArea);
      });

    // Create the outlines    
    blobWrapper.append("path")
      .attr("class", "radarStroke")
      .attr("d", function (d, i) { return radarLine(d); })
      .style("stroke-width", cfg.strokeWidth + "px")
      .style("stroke", function (d, i) { return cfg.color(i); })
      .style("fill", "none")
      .style("filter", "url(#glow)");

    // Append the circles
    blobWrapper.selectAll(".radarCircle")
      .data(function (d, i) { return d; })
      .enter().append("circle")
      .attr("class", "radarCircle")
      .attr("r", cfg.dotRadius)
      .attr("cx", function (d, i) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr("cy", function (d, i) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
      .style("fill", function (d, i, j) { return cfg.color(j); })
      .style("fill-opacity", 0.8);

    // Wrapper for the invisible circles on top
        var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
      .data(dataArray)
      .enter().append("g")
      .attr("class", "radarCircleWrapper");

    // Append tooltips or invisible circles based on 'showValues'
    blobCircleWrapper.selectAll(".radarCircle")
      .data(function (d, i) { return d; })
      .enter().append("circle")
      .attr("class", "radarCircle")
      .attr("r", cfg.dotRadius * 1.5)
      .attr("cx", function (d, i) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr("cy", function (d, i) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function (d, i) {
        if (!cfg.showvalues) { // Only show tooltip on hover if showValues is false
          const newX = parseFloat(d3.select(this).attr('cx'));
          const newY = parseFloat(d3.select(this).attr('cy'));

          let tooltipX, tooltipY;

          // Calculate the angle in degrees
          const angleDeg = i * (360 / total);

          // Determine tooltip position based on angle
          if (angleDeg === 0 || angleDeg === 180) {
            // For 0 and 180 degrees:
            // Player 1 tooltip on the right, Player 2 tooltip on the left
            tooltipX = (d.playerKey.includes('1')) ? newX + 10 : newX - 10;
            tooltipY = newY;
          } else {
            // For other angles:
            // Player 1 tooltip above, Player 2 tooltip below
            tooltipX = newX;
            tooltipY = (d.playerKey.includes('1')) ? newY - 10 : newY + 10;
          }

          tooltip
            .attr('x', tooltipX)
            .attr('y', tooltipY)
            .text(d.originalValue)
            .transition().duration(200)
            .style('opacity', 1)
            .style('stroke', 'none'); // Ensure there is no stroke
        }
      })
      .on("mouseout", function () {
        if (!cfg.showvalues) { // Only hide tooltip on mouseout if showValues is false
          tooltip.transition().duration(200)
            .style("opacity", 0);
        }
      });

    // If showValues is true, append tooltips permanently
    if (cfg.showvalues) {
      blobCircleWrapper.selectAll(".radarText")
        .data(function (d, i) { return d; })
        .enter().append("text")
        .attr("class", "radarTooltip")
        .attr("x", function (d, i) {
          const angleDeg = i * (360 / total);
          const cx = rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
          
          if (angleDeg === 0 || angleDeg === 180) {
            return (d.playerKey.includes('0')) ? cx + 10 : cx - 40; // Right for player1, Left for player2
          } else {
            return cx; // Above or Below for other angles
          }
        })
        .attr("y", function (d, i) {
          const angleDeg = i * (360 / total);
          const cy = rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
    
          if (angleDeg === 0 || angleDeg === 180) {
            return cy; // Tooltip stays at the same Y for 0 and 180
          } else {
            return (d.playerKey.includes('0')) ? cy + 20 : cy - 10; // Above for player1, Below for player2
          }
        })
        .text(function (d) { return d.originalValue; })
        .style("fill", function (d) {
          // Assign color based on playerKey (player 1 or player 2)
          return (d.playerKey.includes('0')) ? cfg.color(0) : cfg.color(1);
        })
        .style("font-size", cfg.tooltipSize)
        .style("stroke", "white") 
        .style("stroke-width", "0.7px")  
        .style("font-weight", "bold")
        .style("opacity", 1); // Keep tooltip visible
    }

    // Set up the small tooltip for when you hover over a circle
    var tooltip = g.append("text")
      .attr("class", "tooltip")
      .style("fill", "white")
      .style("font-size", "20px")
      .style("border-width", "0")
      .style("opacity", 0); // Tooltip starts hidden, shown only on hover

    // Set up the small tooltip for when you hover over a circle
    var tooltip = g.append("text")
    .attr("class", "tooltip")
    .style("fill", "white")
    .style("font-size", "20px")
    .style("border-width", "0")
    .style("opacity", 0); // Tooltip starts hidden, shown only on hover


    // Taken from http://bl.ocks.org/mbostock/7555321
    // Wraps SVG text    
    function wrap(text, width) {
      text.each(function () {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.4, // ems
          y = text.attr("y"),
          x = text.attr("x"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }
  }
