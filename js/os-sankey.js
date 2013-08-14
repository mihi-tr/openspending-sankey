
var OpenSpending = OpenSpending || {};


OpenSpending.sankey= function(config) {
  
  var getChildren= function(t) {

    return _.reduce(_.map(t,function(d) { return d.children}), function(x,y) {
      return x.concat(y)}, [])
    }
  
  var getNodes=function(t) {
    return _.map(t,function(d) { return {label: d.label, level: d.level}})}

  var getNodeList=function(t,r) {
    c=getChildren(t);
    if (_.uniq(c).length==0) {
      return _.uniq(r)}
    else {
    nodes=getNodes(c);
    r=_.uniq(r.concat(nodes),function(d) {
       return d.label+"$"+d.level;});
    return getNodeList(c,r);}
    }
  var makeNodeObject=function(l){
    return {nodes: _.map(l,function(d) { return {name: d.label} }),
            nodelookup: _.reduce(_.map(l,function(d,i) { return ([d.label+"$"+d.level, i])}),
              function(x,y) {x[y[0]]=y[1]; return x}, {}),
            links: []
            }
    }
  
  var makeLinkList=function(l,r) {
    c=getChildren(l);
    if (_.uniq(c).length==0) {
      return r}
    else {
      _.each(c, function(s) {
        _.each(s.children, function(d) {
          r.links.push({source: r.nodelookup[s.label+"$"+s.level],
                        target: r.nodelookup[d.label+"$"+d.level],
                        value: d.amount });
          })
        })
        makeLinkList(c,r);
        }
      }
  this.callback=function (tree) {
     nl=getNodeList([tree],[]);
     no=makeNodeObject(nl);
     makeLinkList([tree],no);
     console.log(nl);
     console.log(no);
     var margin= {top: 1, right: 1, bottom: 6, left: 1}
     el=document.getElementById("chart")
      var width= el.offsetWidth - margin.left -margin.right;
      var height = el.offsetHeight - margin.top -margin.bottom;

      var formatNumber= d3.format(",.0f"),
        format=function(d) { return formatNumber(d) + " " + tree.currency },
        color = d3.scale.category20();

      var svg = d3.select("#chart").append("svg")
        .attr("width", width+margin.left+margin.right)
        .attr("height", height+margin.top+margin.bottom)
        .append("g")
        .attr("transform","translate("+margin.left+","+margin.top+")");

      var sankey=d3.sankey()
            .nodeWidth(15)
            .nodePadding(5)
            .size([width,height]);

      var path= sankey.link();

      sankey.nodes(no.nodes)
        .links(no.links)
        .layout(32);

      var link= svg.append("g").selectAll(".link")
        .data(no.links)
        .enter().append("path")
        .attr("class","link")
        .attr("d",path)
        .style("stroke-width", function(d) { return Math.max(1,d.dy); })
        .sort(function(a,b) { return b.dy - a.dy; });

      link.append("title") 
        .text(function(d) {return d.source.name + " - " + d.target.name +
        "\n" + format(d.value); });

      dragmove= function(d) {
        d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y =
        Math.max(0, Math.min(height - d.dy, d3.event.y))) +")");
        sankey.relayout();
        link.attr("d",path);
        }

      var node=svg.append("g").selectAll(".node")
        .data(no.nodes)
        .enter().append("g")
        .attr("class","node")
        .attr("transform", function(d) { return "translate(" + d.x + 
        "," + d.y + ")";})
        .call(d3.behavior.drag().origin(function(d) { return d;})
          .on("dragstart", function() {this.parentNode.appendChild(this); })
          .on("drag", dragmove));

      node.append("rect")
        .attr("height",function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) { return d.color=color(d.name.replace(/ .*/, "")); })
        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
        .append("title")
        .text(function(d) { return d.name +"\n" + format(d.value) });
      
      node.append("text")
        .attr("x",-6)
        .attr("y", function(d) { return d.dy/2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) { return d.name; })
        .filter(function(d) { return d.x < width/2; })
          .attr("x", 6+ sankey.nodeWidth())
          .attr("text-anchor", "start");


        

    }

  config.callback=this.callback;
  
  OpenSpending.Aggregator(config);
  }
