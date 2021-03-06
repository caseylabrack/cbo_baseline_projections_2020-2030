const margin = {top: 0, bottom : 0, left: 0, right: 0}

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

const parseNumber = string => +string.replace(/,/g, "")

// roundToPrecision :: Number -> Number -> String
const roundToPrecision = precis => x => {
  const sign = x > 0 ? 1 : -1 // javascript rounds in the positive direction always when faced with .5. this is a fix for that
  return (Math.round(Math.abs(x) * Math.pow(10, precis)) / Math.pow(10, precis) * sign).toFixed(precis)
},
roundTo10th = roundToPrecision(1),
roundTo100th = roundToPrecision(2)

const colors = ["#608443", "#927fcc", "#8f8b36", "#bb7c3e", "#71c4d7", "#63d5b4", "#c575af", "#449c6d", "#d78875", "#9cc883", "#cfb6d9", "#d5be75", "#8c7d95", "#bebfa6", "#5a8b87", "#977d60", "#666"],
funcColors = d3.scaleOrdinal().range(colors)

d3.csv("data-spread.csv")
.then(data => {

  funcColors.domain(data.map(d => d.func))
  d3.select("#legend").html(() => `${data.map(d => `<span style="background: ${funcColors(d.func)}; color: ${d3.hcl(funcColors(d.func)).l > 60 ? "#222" : "#fff"}; padding: 6px;">${d.fullname}</span>`).join(" ")}`).style("display", "none")
  d3.select("#legendToggle").on("click", function () {
    d3.event.preventDefault();
    d3.select("#legend").style("display", function () { return d3.select(this).style("display") == "none" ? "block" : "none"})
  })

  let root = d3.hierarchy({values: data}, d => d.values)
  .sum(d => +d["2020"])
  .sort((a, b) => b.height - a.height || b.value - a.value)
  treemap(root)

  const animation = () => {

    const nextYear = d3.select("input[name='yearSelect']:checked").node().value==2020 ? "2030" : "2020"
    d3.select(`input[value='${nextYear}']`).property("checked", true)
    root.sum(d => +d[nextYear])
    treemap(root)
    update()
  }

  let interval = d3.interval(animation, 2000)

  d3.selectAll('input[name="yearSelect"]')
  .on("click", function (d) {

    interval.stop();
    d3.select("#restartAnimation").style("display", "inline");

    root.sum(d => +d[d3.select(this).node().value])
    treemap(root)
    update()
  })

  d3.select("#restartAnimation").on("click", function (d){

    d3.event.preventDefault()
    interval.stop()
    interval = d3.interval(animation, 2000)
    d3.select(this).style("display", "none")
  })

  update()

  function update () {

    svg.selectAll("g.leaf")
    .data(root.leaves(), d => d.data.func)
    .join(
      enter =>
      enter
      .append("g").classed("leaf", true)
      .call(g => g.append("rect")
        .attr("id", d => `rect-${d.data.func}`)
        .style("fill", d => funcColors(d.data.func))
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0))
      .call(g => g.append("clipPath")
        .attr("id", d => "clip-" + d.data.func)
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0))
      .call(g => g.append("text")
        .attr("clip-path", d => `url(#clip-${d.data.func})`)
        .style("fill", d => d3.hcl(funcColors(d.data.func)).l > 60 ? d3.hcl(0,0,30) : d3.hcl(0,0,95))
          .call(text => text.append("tspan")
            .classed("funcName", true)
            .attr("x", d => d.x0 + 2)
            .attr("y", d => d.y0 + 14)
            .text(d => d.data.label))
          .call(text => text.append("tspan")
            .classed("funcTotal", true)
            .attr("x", d => d.x0 + 2)
            .attr("y", d => d.y0 + 28)
            .text(d => roundTo10th(d.data[`share${d3.select("input[name='yearSelect']:checked").node().value}`] * 100)))),

      update =>
      update
      .call(update => update.select("rect")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0))
      .call(update => update.select("clipPath")
        .select("rect")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0))
      .call(update => update.select("tspan")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr('x', d => d.x0 + 2)
        .attr('y', d => d.y0 + 14))
      .call(update => update.select(".funcTotal")
        .transition()
        .duration(1e3)
        .ease(d3.easeLinear)
        .attr('x', d => d.x0 + 2)
        .attr('y', d => d.y0 + 28)
        .tween("text", function(d) {
          const i = d3.interpolate(parseNumber(this.textContent), d.data[`share${d3.select("input[name='yearSelect']:checked").node().value}`] * 100)
          return function(t) { this.textContent = roundTo10th(i(t)) }
        }))
    )
  }
})
