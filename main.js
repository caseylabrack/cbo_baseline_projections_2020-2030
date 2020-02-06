const width =   800,
      height =  600

const colors = ["#608443",
"#927fcc",
"#8f8b36",
"#5e8ecd",
"#bb7c3e",
"#71c4d7",
"#cc687c",
"#63d5b4",
"#c575af",
"#449c6d",
"#d78875",
"#9cc883",
"#cfb6d9",
"#d5be75",
"#8c7d95",
"#bebfa6",
"#5a8b87",
"#977d60"]

const labels = d3.scaleOrdinal()
  .domain(["050", "150", "250", "270", "300", "350", "370", "400", "450", "500", "550", "570", "600", "650", "700", "750", "800", "900", "920", "950"])
  .range(["National Defense","Intl. Affairs","Science","Energy","Environ.","Agri.","Commerce","Transportation","Regional Development","Social Services","Health","Medicare","Income Security","Social Security","Veterans Benefits","Justice","Gov.","Net Interest","Allowances","Undistributed Offsetting Receipts"])

const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height)

const treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .padding(1)
    .round(true)

const parseNumber = string => +string.replace(/,/g, "")

const funcColors = d3.scaleOrdinal().range(colors)

// d3.csv("data.csv", ({year, func, value}) => ({year: year, func: func, value: +value}))
d3.csv("data-spread.csv")
  .then(data => {

    funcColors.domain(data.map(d => d.func))

    let index = 0
    let root = d3.hierarchy({values: data}, d => d.values)
                            .sum(d => +d["2020"])
                            .sort((a, b) => b.height - a.height || b.value - a.value)
    update(root, "2020")

    d3.interval(elapsed => {
      index++;
      update(root, index % 2 == 0 ? "2020" : "2030")
    }, 2000)

    function update (root, key) {

      root.sum(d => d[key])
      treemap(root)

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
      // .style("fill", d3.hcl(0,0,20))
      .style("fill", d => d3.hcl(funcColors(d.data.func)).l > 60 ? d3.hcl(0,0,30) : d3.hcl(0,0,95) )

      label.append("tspan")
        .classed("funcName", true)
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 14)
        .text(d => labels(d.data.func))

      label.append("tspan")
        .classed("funcTotal", true)
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 28)
        .text(d => d.value)

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
              const i = d3.interpolate(parseNumber(this.textContent), d.value);
              return function(t) { this.textContent = d3.format(",d")(i(t)); };
            })
    }
  })
