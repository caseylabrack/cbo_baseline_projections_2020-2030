const margin = {top: 40, bottom : 0, left: 0, right: 0}

// console.log(d3.select("svg").property("parentNode").offsetWidth, window.innerWidth)

const elementWidth = d3.select("svg").property("parentNode").offsetWidth

const width   =   elementWidth - margin.left - margin.right,
      height  =   600 - margin.top - margin.bottom

const svg = d3.select("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

const treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .padding(1)
    .round(true)

const parseNumber = string => +string.replace(/,/g, ""),
      formatWithComma = d3.format(",d")

const colors = ["#608443", "#927fcc", "#8f8b36", "#5e8ecd", "#bb7c3e", "#71c4d7", "#cc687c", "#63d5b4", "#c575af", "#449c6d", "#d78875", "#9cc883", "#cfb6d9", "#d5be75", "#8c7d95", "#bebfa6", "#5a8b87", "#977d60"],
      funcColors = d3.scaleOrdinal().range(colors)

d3.csv("data-spread.csv")
  .then(data => {

    funcColors.domain(data.map(d => d.func))
    d3.select("#legend").html(() => `${data.map(d => `<span style="background: ${funcColors(d.func)}; color: white; padding: 6px;">${d.fullname}</span>`).join(" ")}`).style("display", "none")
    d3.select("#legendToggle").on("click", function () {
      d3.event.preventDefault();
      d3.select("#legend").style("display", function () { console.log(d3.select(this).style("display")); return d3.select(this).style("display") == "none" ? "block" : "none"})
    })

    let index = 0
    let root = d3.hierarchy({values: data}, d => d.values)
                            .sum(d => +d["2020"])
                            .sort((a, b) => b.height - a.height || b.value - a.value)
    treemap(root)

    const animation = () => {
          index++;
          root.sum(d => +d[index % 2 == 0 ? "2020" : "2030"])
          treemap(root)
          update()

          dateHighlighter
            .transition().duration(1e3).ease(d3.easeLinear)
            .attr("x", () => index % 2 == 0? 1 : 75 - 51/2)
        }

    let interval = d3.interval(animation, 2000)

    d3.select("svg")
    .append("g").selectAll("text")
    .data(["2020", "2030"]).enter()
      .append("text")
        .classed("dates", true)
        .text(d => d)
        .attr("x", (d,i) => 25 + (i ? 50 : 0))
        .attr("y", 20)
        .attr("fill", d3.hcl(0,0,30))
        .on("click", datum => {
          interval.stop();
          restartAnimationButton.style("display", "block");

          index++;
          root.sum(d => +d[datum])
          treemap(root)
          update()

          dateHighlighter
            .transition().duration(1e3).ease(d3.easeLinear)
            .attr("x", () => datum == "2020" ? 1 : 75 - 51/2)
       })

    const restartAnimationButton = d3.select("svg").append("text").text("restart animation?").attr("x", 110).attr("y", 20).attr("fill", d3.hcl(200,50,30))
      .style("font-size", ".6em").style("font-family", "Oswald").style("font-weight", 300).style("display", "none").style("cursor", "pointer")
      .on("click", function (d) { interval.stop(); interval = d3.interval(animation, 2000); d3.select(this).style("display", "none")})
    const dateHighlighter = d3.select("svg").append("rect").attr("x", 1).attr("y", 1).attr("width", "51").attr("height", "25").style("fill", "none").style("stroke", d3.hcl(0,0,80)).style("pointer-events", "none")

    update()

    function update () {

      let leaves = svg.selectAll("g.leaf")
        .data(root.leaves(), d => d.data.func)

      let leavesEntering = leaves
        .enter().append("g").classed("leaf", true)

      leavesEntering
        .append("rect")
        .attr("id", d => `rect-${d.data.func}`)
        .style("fill", d => funcColors(d.data.func))
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)

    leavesEntering
      .append("clipPath")
        .attr("id", d => "clip-" + d.data.func)
          .append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)

    var label = leavesEntering.append("text")
      .attr("clip-path", d => `url(#clip-${d.data.func})`)
      .style("fill", d => d3.hcl(funcColors(d.data.func)).l > 60 ? d3.hcl(0,0,30) : d3.hcl(0,0,95) )

      label.append("tspan")
        .classed("funcName", true)
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 14)
        .text(d => d.data.label)

      label.append("tspan")
        .classed("funcTotal", true)
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 28)
        .text(d => formatWithComma(d.value/1e3))

      leaves
        .select("rect")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)

      leaves
        .select("clipPath")
          .select("rect")
          .transition()
          .duration(1e3)
          .ease(d3.easeLinear)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)

      leaves
        .select("tspan")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr('x', d => d.x0 + 2)
        .attr('y', d => d.y0 + 14)

      leaves
        .select(".funcTotal")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr('x', d => d.x0 + 2)
        .attr('y', d => d.y0 + 28)
        .tween("text", function(d) {
              const i = d3.interpolate(parseNumber(this.textContent), d.value/1e3)
              return function(t) { this.textContent = formatWithComma(i(t)) }
            })
    }
  })
