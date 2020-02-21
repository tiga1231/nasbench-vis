import * as d3 from "d3";


d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};



function drag(simulation){
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  function dragended(d) {
    if (!d3.event.active)
      simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}



export class GraphView{
  constructor(kwargs){
    this.op2text = {
      '-1': 'input', 
      '-2': 'output', 
       '0': 'conv3x3',
       '1': 'conv1x1',
       '2': 'maxpool'
    };
    this.sc = d3.scaleOrdinal(
      ['#eee', '#eee', '#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0']
    )
    .domain([-1, -2, 0, 1, 2]);

    this.data = kwargs.data; 
    this.i = kwargs.i || 0;
    //graph = {nodes:..., edges:...}

    this.width = kwargs.width || 500;
    this.height = kwargs.height || 500;

    this.sx = d3.scaleLinear().domain([0,6]).range([0,this.width]);
    this.sy = d3.scaleLinear().domain([0,6]).range([10,this.height-10]);
    
    this.graph = this.makeGraph(this.data.adjacency[this.i], this.data.operations[this.i]); 


    this.svg = d3.select('body').append('svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .style('background', '#444');

    this.svg.append('defs').html(`
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="2" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 l0,4 l6,-2 z" fill="#fff" />
    </marker>`);

   
    this.simulation = d3.forceSimulation(this.graph.nodes)
      .force('link', d3.forceLink(this.graph.edges)
        .id(d=>d.id)
        .distance(link=>
          Math.min(this.height, this.width)/1000 
          * Math.sqrt(Math.abs(link.source.id - link.target.id))
        )
      )
      .force('charge', d3.forceManyBody()
        .strength(d=>{
          let r = -(6-Math.abs(d.id - this.graph.nodes.length/2)) * 550;
          return r;
        })
      )
      .force('center', d3.forceCenter(this.width/2, this.height/2))
      .force('y', d3.forceY()
        .strength(0.1).y(this.height/2)
      )
      .force('x', d3.forceX()
        .strength(1.7).x(d=>this.sx(d.id))
      );

    
    this.plot();
  }

  makeGraph(adj, op, baseGraph){
    op = op.filter(d=>d!=-3);
    let res = baseGraph || {};
    res.nodes = res.nodes ? res.nodes.slice(0,op.length) : [];
    for(let i=0; i<op.length; i++){
      if(res.nodes[i] !== undefined){
        res.nodes[i].id = i;
        res.nodes[i].op = op[i];
        
      }else{
        res.nodes.push({
          id: i,
          op: op[i],
        });
        res.nodes[i].x = this.sx((Math.random()-0.5)*2 + 2.5);
        res.nodes[i].y = this.sy(i);
      }
    }

    res.edges = [];
    for (let i=0; i<op.length; i++){
      for (let j=0; j<op.length; j++){
        if(adj[i][j] == 1){
          let a = {source: i, target: j};
          res.edges.push(a);
        }
      }
    }
    return res;
  }

  updateGraph(i){
    this.graph = this.makeGraph(this.data.adjacency[i], this.data.operations[i], this.graph);
    this.simulation.nodes(this.graph.nodes);
    this.simulation.force('link').links(this.graph.edges);
    this.plot();
  }

  plot(){

    if(this.graph.nodes.length !== this.sx.domain()[1]){ // number of node changes
      this.sx = d3.scaleLinear().domain([-0.5,this.graph.nodes.length]).range([0,this.width]);
      this.sy = d3.scaleLinear().domain([-0.5,this.graph.nodes.length]).range([0,this.height]);
    }
    
    this.svg.selectAll('.link')
    .data(this.graph.edges)
    .exit()
    .remove();

    this.svg.selectAll('.link')
    .data(this.graph.edges)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke-width', 2)
    .attr('stroke', 'white')
    .attr('marker-end', 'url(#arrow)');
    this.links = this.svg.selectAll('.link');

    this.svg.selectAll('.node')
    .data(this.graph.nodes)
    .exit()
    .remove();
    let newNodes = this.svg.selectAll('.node')
    .data(this.graph.nodes)
    .enter().append('g')
    .attr('class', 'node');
    newNodes.append('circle')
    .attr('r', 8)
    .attr('fill', 'white');
    newNodes.append('text')
    .attr('fill', '#eee')
    .attr('transform', `translate(12,0)`)
    .attr('alignment-baseline', `middle`);

    this.nodes = this.svg.selectAll('.node');
    this.nodes.selectAll('text').text(d=>`${this.op2text[d.op]}`);
    this.nodes.selectAll('circle').attr('fill', d=>this.sc(d.op))
    this.nodes.moveToFront();

    this.simulation.stop();
    this.simulation.on("tick", () => {
      this.links
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
      this.nodes
      .attr('transform', d=>`translate(${d.x}, ${d.y})`)
    });


    this.simulation
    .alphaDecay(0.01)
    .alpha(0.5)
    .alphaTarget(0.0)
    .restart();

    this.nodes.call(drag(this.simulation));

  }
}