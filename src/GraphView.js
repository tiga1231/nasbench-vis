import * as d3 from "d3";


d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


function drag(simulation){
  function dragstarted(d) {
    if (!d3.event.active && simulation)
      simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  function dragended(d) {
    if (!d3.event.active && simulation)
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

  updateScale(width, height){
    this.sx = d3.scaleLinear()
      .domain([0,1,2,3])
      .range([15, width/4,  width/2, width-15]);
    this.sy = d3.scaleLinear()
      .domain([0,1,2,3])
      .range([15, height-15, height/2, height/2]);
  }


  constructor(kwargs){

    this.sc = d3.scaleOrdinal(
      ['black', 'white', d3.schemeAccent[0], d3.schemeAccent[1], d3.schemeAccent[3]]
    ).domain(['none', 'skip_connect', 'nor_conv_1x1', 'nor_conv_3x3', 'avg_pool_3x3'])

    this.data = kwargs.data; 
    this.i = kwargs.i || 0;

    if(kwargs.svg === undefined){
      this.width = kwargs.width || 500;
      this.height = kwargs.height || 500;
      this.svg = d3.select('body').append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', '#444');
    }else{
      this.svg = kwargs.svg;
      this.width = +this.svg.attr('width');
      this.height = +this.svg.attr('height');
    }

    this.updateScale(this.width, this.height);

    this.graph = this.makeGraph(this.data[this.i]); 


   

    this.svg.append('defs').html(`
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="2" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 l0,4 l6,-2 z" fill="#fff" />
    </marker>`);

   
    this.simulation = d3.forceSimulation(this.graph.nodes)
      .force('link', d3.forceLink(this.graph.edges)
        .id(d=>d.id)
        .distance(link=>
          Math.min(this.height, this.width)/10 
          * Math.sqrt(Math.abs(link.source.id - link.target.id))
        )
      )
      .force('charge', d3.forceManyBody()
        .strength(d=>{
          let r = -(6-Math.abs(d.id - this.graph.nodes.length/2)) * 750;
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
      this.simulation.stop();

    
    this.plot();
  }

  makeGraph(ops, baseGraph){
    let res = baseGraph || {};
    res.nodes = res.nodes ? res.nodes : [];
    let n = ops.length;
    ops = [
      [null, ops[0], ops[1], ops[3]],
      [null,  null,  ops[2], ops[4]],
      [null,  null,  null,   ops[5]],
      [null,  null,  null,   null  ]
    ];
    for(let i=0; i<ops[0].length; i++){
      if(res.nodes[i] !== undefined){
        res.nodes[i].id = i;
      }else{
        res.nodes.push({
          id: i,
        });
        res.nodes[i].x = this.sx(i);
        res.nodes[i].y = this.sy(i);
      }
    }

    res.edges = res.edges ? res.edges : [];
    //complete DAG
    let k=0;
    for (let i=0; i<res.nodes.length; i++){
      for (let j=i+1; j<res.nodes.length; j++){
        let a = {source: i, target: j, op:ops[i][j]};
        if(res.edges[k] !== undefined){
          res.edges[k].source = a.source;
          res.edges[k].target = a.target;
          res.edges[k].op = a.op;
        }else{
          res.edges.push(a);
        }
        k+=1;
      }
    }
    return res;
  }


  updateGraph(i){
    this.graph = this.makeGraph(this.data[i], this.graph);
    this.simulation.nodes(this.graph.nodes);
    this.simulation.force('link').links(this.graph.edges);
    this.plot();
  }

  plot(){
    
    this.svg.selectAll('.link')
    .data(this.graph.edges)
    .exit()
    .remove();

    let newLinks = this.svg.selectAll('.link')
    .data(this.graph.edges)
    .enter()
    .append('g')
    .attr('class', 'link');

    newLinks.append('text')
    .attr('alignment-baseline', `baseline`)
    .attr('text-anchor', `middle`);

    newLinks.append('line')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrow)');

    this.links = this.svg.selectAll('.link');

    this.links.selectAll('line')
    .attr('stroke', (d,i)=>{
      return this.sc(d.op);
    });

    this.links
    .selectAll('text')
    .attr('fill', d=>this.sc(d.op))
    .text(d=>d.op);


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

    // this.nodes.selectAll('text').text(d=>Math.random());
    this.nodes.selectAll('circle').attr('fill', 'white')
    this.nodes.moveToFront();

    
    this.nodes
    .each((d,i)=>{
      d.pos = [this.sx(i), this.sy(i)];
    });
    

    this.nodes
    // .attr('transform', d=>`translate(${d.x}, ${d.y})`);
    .attr('transform', (d,i)=>`translate(${d.pos[0]}, ${d.pos[1]})`);

    this.links
    .selectAll('line')
    // .attr("x1", d => d.source.x)
    // .attr("y1", d => d.source.y)
    // .attr("x2", d => d.target.x)
    // .attr("y2", d => d.target.y);
    .attr("x1", d => d.source.pos[0])
    .attr("y1", d => d.source.pos[1])
    .attr("x2", d => d.target.pos[0])
    .attr("y2", d => d.target.pos[1]);
    this.links
    .selectAll('text')
    // .attr('transform', d=>`translate(${0.7*d.source.x+0.3*d.target.x},${0.7*d.source.y+0.3*d.target.y})`);
    .attr('transform', d=>`translate(${0.3*d.source.pos[0]+0.7*d.target.pos[0]},${0.3*d.source.pos[1]+0.7*d.target.pos[1]-5})`);
    
    let links = this.links;
    this.nodes.call(
      d3.drag()
      .on('drag', function(){
        d3.select(this).each(d=>{
          d.pos[0] += d3.event.dx;
          d.pos[1] += d3.event.dy;
        })
        .attr('transform', (d,i)=>`translate(${d.pos[0]}, ${d.pos[1]})`);

        links
        .selectAll('line')
        .attr("x1", d => d.source.pos[0])
        .attr("y1", d => d.source.pos[1])
        .attr("x2", d => d.target.pos[0])
        .attr("y2", d => d.target.pos[1]);
        links
        .selectAll('text')
        .attr('transform', d=>`translate(${0.3*d.source.pos[0]+0.7*d.target.pos[0]},${0.3*d.source.pos[1]+0.7*d.target.pos[1]-5})`);
      })
    );



    // this.simulation.stop();
    // this.simulation.on("tick", () => {
    //   this.links
    //   .selectAll('line')
    //   .attr("x1", d => d.source.x)
    //   .attr("y1", d => d.source.y)
    //   .attr("x2", d => d.target.x)
    //   .attr("y2", d => d.target.y);
    //   this.links
    //   .selectAll('text')
    //   .attr('transform', d=>`translate(${0.7*d.source.x+0.3*d.target.x},${0.7*d.source.y+0.3*d.target.y})`);
    //   this.nodes
    //   .attr('transform', d=>`translate(${d.x}, ${d.y})`)
    // });
    // this.simulation
    // .alphaDecay(0.01)
    // .alpha(0.5)
    // .alphaTarget(0.0)
    // .restart();
    // this.nodes.call(drag(this.simulation));

  }
}