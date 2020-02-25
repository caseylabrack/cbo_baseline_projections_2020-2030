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

          const nextYear = d3.selectAll("input[name='yearSelect']:checked").node().value==2020 ? "2030" : "2020"
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
