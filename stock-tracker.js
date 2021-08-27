function stockTracker() {

    //create svg attributes
    const margin = { top: 50, left: 50, bottom: 50, right: 50 },
        width = 900 - margin.right - margin.left,
        height = 900 - margin.top - margin.bottom;

    //append the svg
    const svg = d3.select("body")
        .append("svg")
        .attr("width",width+margin.left+margin.right)
        .attr("height",height+margin.top+margin.bottom)
        .append("g")
        .attr("transform",`translate(${margin.left},${margin.top})`);

    //create date parsers
    const formatTime = d3.timeParse("%Y-%m-%d");
    const bisect = d3.bisector(d => d.time).left;
    const formatDate = d3.timeFormat("%d %b %Y");
    
    //create event listener when user enter stock symbol
    d3.select("#stockSymbol").on("submit", function(event){
        
        //store the value the user entered
        const userInput = event.path[0][0].value;
       
        //prevent page from reloading
        event.preventDefault();

        //load the line chart with stock symbol the user entered
        loadChart(userInput)
    })

    //create the chart function
    function loadChart(symbol) {

        //removes existing chart and creates new line chart with new stock data
        d3.selectAll("g > *").remove();

        //chart heading
        svg.append("text")
            .attr("x",0)
            .attr("y",0)
            .style("font-family","monospace")
            .style("font-size","2em")
            .text(`${symbol} stock price chart 2000-2020.`)
        
        //create tooltip function    
        const hoverTooltip = toolTip();

        //api to collect stock data
        d3.csv(`https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=VICAOWBD0SPXQQO4&datatype=csv`,d => {
        return {
            time: formatTime(d.timestamp),
            open: +d.open,
            close: +d.close,
            high: +d.high,
            low: +d.low,
            volume: +d.volume
        }
    })
    .then(function(data){

        //sort the loaded stock data
        data.sort((a,b) => d3.ascending(a.time,b.time));

        //d3 time scale to create axis and plot line chart
        const x = d3.scaleTime()
           .domain(d3.extent(data,d => d.time))
           .range([margin.left,width-margin.right]);

        //d3 linear scale to parse price points
        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d.close))
            .range([height-margin.bottom,margin.top]);

        //chart x-axis
        const xAxis = g => g.attr("transform", `translate(0,${height-margin.bottom})`)
            .call(d3.axisBottom(x));

        //chart y-axis
        const yAxis = g => g.attr("transform",`translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        //d3 line to create line chart
        const line = d3.line()
            .x(d => x(d.time))
            .y(d => y(d.close))
            .curve(d3.curveMonotoneX);

        //append x-axis and styling
        svg.append("g")
            .call(xAxis)
            .style("color","716F81")
            .style("font-weight","bold");
            
        //annotate x-axis
        svg.append("text")
            .attr("x",width/2)
            .attr("y",height)
            .text("Year")
            .style("text-anchor","middle")
            .style("font-size","1.5em")
            .style("font-weight","bold");

        //append y-axis and styling
        svg.append("g")
            .call(yAxis)
            .style("font-weight","bold")
            .style("color","#716F81");

        //annotate y-axis
        svg.append("text")
            .attr("x",-height/2+50)
            .attr("y",-5)
            .text("Price")
            .style("text-anchor","end")
            .style("font-size","1.5em")
            .attr("transform","rotate(-90)")
            .style("font-weight","bold");

        //append the line and create event listener for tooltip
        svg.append("path")
            .datum(data)
            .attr("d", line)
            .style("fill","none")
            .style("stroke-width","2.8px")
            .style("stroke","#2C394B")
            .on("mouseover", function mouseover(event){

                //collect the point the user is hovering on
                let x0 = x.invert(d3.pointer(event,this)[0]),
                    i = bisect(data, x0, 1),
                    d0 = data[i - 1],
                    d1 = data[i],
                   d = x0 - d0.time > d1.time - x0 ? d1 : d0;

                //append tooltip details of stock information
                hoverTooltip.select('.toolTipTable').style("border-spacing",0);
                hoverTooltip.selectAll('td').style("padding","3px").style("border-bottom","1px solid white");
                hoverTooltip.select('.symbol').text(symbol+': '+formatDate(d.time));
                hoverTooltip.select('.symbol-open-value').text(d.open);
                hoverTooltip.select('.symbol-close-value').text(d.close);
                hoverTooltip.select('.symbol-high-value').text(d.high);
                hoverTooltip.select('.symbol-low-value').text(d.low);
                hoverTooltip.transition().duration(500).style("opacity","1");
            })
            .on("mousemove", function mousemove(event){
                //tooltip position on mousemove
                hoverTooltip.style('top',`${event.pageY-150}px`).style('left',`${event.pageX}px`);
            })
            .on("mouseout", function mouseout(event){
                //tooltip disappears
                hoverTooltip.transition().duration(500).style("opacity","0").style("pointer-events","none");
            })    
    })
    }

    //load the chart with initial Eli Lilly data
    loadChart("LLY")

    //create tooltip function
    function toolTip() {
        d3.selectAll('.stockTooltip').remove()

        let hoverTooltip = d3.select("body")
            .append("div")
            .attr("class","stockTooltip")
            .style("position","absolute")
            .style("height","auto")
            .style("padding","10px")
            .style("min-width","100px")
            .style("background-color","#5C527F")
            .style("color","white")
            .style("opacity","0");

        hoverTooltip.html("<span class='symbol'></span><table class='toolTipTable'><tr><td class='symbol-open'>Open: </td><td class='symbol-open-value'></td></tr><tr><td class='symbol-close'>Close: </td><td class='symbol-close-value'></td></tr><tr><td class='symbol-high'>High: </td><td class='symbol-high-value'></td></tr><tr><td class='symbol-low'>Low: </td><td class='symbol-low-value'></td></tr></table>")

        return hoverTooltip;
    }

}