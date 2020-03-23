import * as gl_utils from "./gl_utils";
import getGLprog from "webgl-utils";
import {zip} from './utils';
import * as utils from './utils';

const DPR = window.devicePixelRatio;
const CLEAR_COLOR = utils.bg_color;

export class LinkedView{

  constructor(x,y, kwargs){
    this.kwargs = kwargs || {};
    var vertexShader = require("./shader/scatter-plot-shader.vs");
    var fragmentShader = require("./shader/scatter-plot-shader.fs");


    this.container = kwargs.container;
    this.graphView = kwargs.graphView;

    this.width = parseFloat(this.container.style('width'));
    this.height = parseFloat(this.container.style('height'));
    this.widthRatio = this.width / window.innerWidth;
    this.heightRatio = this.height / window.innerHeight;

    this.margin = kwargs.margin ||  [0.1, 0.9, 0.1, 0.9];//[left, right, bottom, top]
    this.ylim = kwargs.ylim;
    this.xlim = kwargs.xlim;
    this.pointSize = kwargs.pointSize || 100.0;
    this.parent = kwargs.parent || null;
    this.id = kwargs.id || "" + Math.floor(Math.random() * 1e9);
    this.mode = kwargs.mode || 'point';
    
    this.xLabel = kwargs.xLabel;
    this.yLabel = kwargs.yLabel;
    if (kwargs.colors === undefined){
      this.colors = Array(x.length).fill([0.5,0.5,1.0]);
    }else if (typeof(kwargs.colors) === 'string'){
      let c = d3.color(kwargs.colors);
      this.colors = Array(x.length).fill([c.r/255, c.g/255, c.b/255]);
    }else{
      this.colors = kwargs.colors;
    }

    this.zoom = kwargs.zoom ? d3.zoom().scaleExtent([0.5, 40]) : null;
    this.scale = 1.0;

    if(this.mode == 'point'){
      this.x = x;
      this.y = y;
    }else{
      this.x = x.map(d=>[d[0], d[1], d[1], d[2], d[2], d[3]]);
      this.y = y.map(d=>[d[0], d[1], d[1], d[2], d[2], d[3]]);
    }
    this.container
    .attr('class', 'plot')
    .attr('id', this.id);

    this.overlay = this.container
    .append('svg')
    .attr('id', this.id + '-overlay')
    .attr('class', 'overlay')
    .attr('width', this.width)
    .attr('height', this.height);
    
    this.highlighter = this.overlay
    .append('circle')
    .attr('r', this.pointSize)
    .attr('fill', 'none')
    .attr('stroke-width', 2)
    .attr('stroke', '#ffffff')
    .style('opacity', 0.0);

    this.canvas = this.container
    .append('canvas')
    .attr('width', this.width*DPR)
    .attr('height', this.height*DPR)
    .style('width', this.width)
    .style('height', this.height);

    this.gl = this.initGL(this.canvas.node(), fragmentShader, vertexShader);

    if(this.mode == 'point'){
      this.selected = Array(this.x.length).fill(true);
    }else{ //line
      this.selected = Array(this.x.length * 6).fill(true);
    }

    if(this.zoom){
      this.zoom.on('zoom', ()=>{
        let transform = d3.event.transform;
        this.sx.domain(transform.rescaleX(this.sx0).domain());
        this.sy.domain(transform.rescaleY(this.sy0).domain());
        this.gx.call(this.ax);
        this.gy.call(this.ay);
        gl_utils.update_uniform(this.gl, 'u_extent_x', this.sx.domain());
        gl_utils.update_uniform(this.gl, 'u_extent_y', this.sy.domain());
        gl_utils.update_uniform(this.gl, 'u_pointsize', this.pointSize * window.devicePixelRatio * Math.sqrt(transform.k));
        this.highlighter.attr('r', this.pointSize * Math.sqrt(transform.k));
        this.plot(false, false);
        this.parent.hover(this.hoverIndex);
      });
      this.overlay.call(this.zoom);
    }
    
    this.plot(true, true);

    window.addEventListener('resize', this.onResize.bind(this));
  }//end constructor


  onResize(){
    this.width = this.container.node().clientWidth;
    this.height = this.container.node().clientHeight;
    
    this.width = this.widthRatio * window.innerWidth;
    this.height = this.heightRatio * window.innerHeight;

    this.overlay
    .attr('width', this.width)
    .attr('height', this.height);

    this.canvas
    .attr('width', this.width*DPR)
    .attr('height', this.height*DPR)
    .style('width', this.width)
    .style('height', this.height);

    this.plot(true, true);
  }
  
  plot(shouldUpdateCanvas=true, shouldUpdateSvg=true){
    let x = this.x;
    let y = this.y;
    let n = x.length;

    let gl = this.gl;
    let margin = this.margin;
    let pointSize = this.pointSize;

    //data
    this.xy = zip(x.flat(),y.flat());

    if(this.xlim !== undefined){
      this.xmin = this.xlim[0];
      this.xmax = this.xlim[1];
    }else{
      this.xmin = x.flat().reduce((a,b)=>Math.min(a,b), x.flat()[0]);
      this.xmax = x.flat().reduce((a,b)=>Math.max(a,b), x.flat()[0]);
    }

    if (this.ylim !== undefined){
      this.ymin = this.ylim[0];
      this.ymax = this.ylim[1];
    }else{
      this.ymin = y.flat().reduce((a,b)=>Math.min(a,b), y.flat()[0]);
      this.ymax = y.flat().reduce((a,b)=>Math.max(a,b), y.flat()[0]);
    }
    

    //webgl plot
    gl_utils.clear(gl, CLEAR_COLOR);

    if(shouldUpdateCanvas){
      gl_utils.update_data(gl, 'a_position',  this.xy);
      gl_utils.update_data(gl, 'a_color',  this.colors);
      if (this.mode == 'point'){
        gl_utils.update_data(gl, 'a_selected', Array(n).fill(1.0));
      }else{
        gl_utils.update_data(gl, 'a_selected', Array(n*6).fill(1.0));
      }
      gl_utils.update_uniform(gl, 'u_margin', margin); 
      gl_utils.update_uniform(gl, 'u_pointsize', pointSize * window.devicePixelRatio);
    }

    gl.viewport(0,0, this.width*DPR, this.height*DPR);

    gl_utils.update_uniform(gl, 'u_mode', 0.0); //point mode
    gl_utils.update_uniform(gl, 'u_isfg', 0.0); //background mode
    gl.drawArrays(gl.POINTS, 0, this.xy.length);

    if (this.mode == 'line'){
      gl_utils.update_uniform(gl, 'u_mode', 1.0); //line mode
      gl_utils.update_uniform(gl, 'u_isfg', 0.0); //background mode
      gl.drawArrays(gl.LINES, 0, this.xy.length);
      gl_utils.update_uniform(gl, 'u_isfg', 1.0); //foreground mode
      gl.drawArrays(gl.LINES, 0, this.xy.length);
    }

    gl_utils.update_uniform(gl, 'u_mode', 0.0); //point mode
    gl_utils.update_uniform(gl, 'u_isfg', 1.0); //foreground mode
    gl.drawArrays(gl.POINTS, 0, this.xy.length);
    

    if(shouldUpdateSvg){
      //overlay (svg) plot
      this.sx0 = d3.scaleLinear().domain([this.xmin, this.xmax])
      .range([margin[0]*this.width, margin[1]*this.width]);
      this.sy0 = d3.scaleLinear().domain([this.ymin, this.ymax])
      .range([(1-margin[2])*this.height, (1-margin[3])*this.height]);
      
      this.sx = d3.scaleLinear().domain([this.xmin, this.xmax])
      .range([margin[0]*this.width, margin[1]*this.width]);
      this.sy = d3.scaleLinear().domain([this.ymin, this.ymax])
      .range([(1-margin[2])*this.height, (1-margin[3])*this.height]);

      gl_utils.update_uniform(gl, 'u_extent_x', this.sx.domain());
      gl_utils.update_uniform(gl, 'u_extent_y', this.sy.domain());

      //axis
      this.ax = d3.axisBottom(this.sx);
      this.gx = this.overlay
      .selectAll('.x-axis')
      .data([0])
      .enter()
      .append('g')
      .attr('class', 'x-axis');

      this.gx = this.overlay.selectAll('.x-axis');
      this.gx
      .attr('transform', `translate(0, ${this.sy(this.ymin)})`)
      .call(this.ax);

      this.ay = d3.axisLeft(this.sy);
      this.gy = this.overlay
      .selectAll('.y-axis')
      .data([0])
      .enter()
      .append('g')
      .attr('class', 'y-axis');

      this.gy = this.overlay.selectAll('.y-axis');
      this.gy
      .attr('transform', `translate(${this.sx(this.xmin)}, 0)`)
      .call(this.ay);

      //axis labels
      if(this.xLabel !== undefined){
        if(typeof(this.xLabel)=='string'){
          this.xLabelText = this.xLabel;
        }
        this.xLabel = this.overlay.selectAll('.xLabel')
        .data([this.xLabelText,])
        .enter()
        .append('text')
        .attr('class', 'xLabel');
        this.xLabel = this.overlay.selectAll('.xLabel');
        this.xLabel
        .attr('x', d3.mean(this.sx.range()))
        .attr('y', this.sy(0) + 20)
        .text(d=>d);
      }
      if(this.yLabel !== undefined){
        if(typeof(this.yLabel)=='string'){
          this.yLabelText = this.yLabel;
        }
        this.yLabel = this.overlay.selectAll('.yLabel')
        .data([this.yLabelText,])
        .enter()
        .append('text')
        .attr('class', 'yLabel');
        this.yLabel = this.overlay.selectAll('.yLabel');
        this.yLabel
        .attr('x', this.sx.range()[0] - 40)
        .attr('y', d3.mean(this.sy.range()))
        .text(d=>d);
        this.yLabel
        .attr('transform', `rotate(-90, ${this.yLabel.attr('x')}, ${this.yLabel.attr('y')})`);
      }

      //brush
      if(this.kwargs.brush === true){
        this.brush = d3.brush()
        .extent([
          [this.sx(this.xmin)-10,this.sy(this.ymax)-10], 
          [this.sx(this.xmax)+10,this.sy(this.ymin)+10]
        ])
        .on("brush", ()=>{
          let selection = d3.event.selection;
          let x0 = this.sx.invert(selection[0][0]);
          let x1 = this.sx.invert(selection[1][0]);
          let y0 = this.sy.invert(selection[1][1]);
          let y1 = this.sy.invert(selection[0][1]);
          this.brush_rect = [x0,x1,y0,y1];
          this.select(...this.brush_rect);
        })
        .on('end', ()=>{
          if(d3.event.selection === null){
            this.select(null);
            this.brush_rect = undefined;
          }
        });
        this.overlay.append('g')
        .attr('class', 'brush')
        .call(this.brush);
      }
      

      this.overlay.on('mousemove', ()=>{
        let x = this.sx.invert(d3.event.offsetX);
        let y = this.sy.invert(d3.event.offsetY);
        //nearest neighbor
        let minDist = Infinity;
        let nearestNeighbor = null;
        for (let i=0; i<this.x.length; i++){
          let dist = Math.pow((this.x[i]-x)/(this.sx.domain()[1]-this.sx.domain()[0]), 2) 
          + Math.pow((this.y[i]-y)/(this.sy.domain()[1]-this.sy.domain()[0]), 2);
          if(dist < minDist && this.parent.selected[i]){
            nearestNeighbor = i;
            minDist = dist;
          }
        }

        this.parent.hover(nearestNeighbor);
        if(this.graphView !== undefined){
          this.graphView.updateGraph(nearestNeighbor);
        }
        if(this.grandtourView !== undefined){
          this.grandtourView.updatePosition(nearestNeighbor);
        }

        this.hoverIndex = nearestNeighbor;
        if(this.clickIndex === undefined){
          this.clickIndex = this.hoverIndex;
        }

      })
      .on('click', ()=>{
        this.clickIndex = this.hoverIndex;

        function argMax(array) {
          return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
        }

        console.log('arch = ', this.clickIndex);
        if(window.data && window.data.accuracies){
          console.log('accuracy = ', window.data.accuracies[this.clickIndex]);
        }
        if(window.presoftmax){
          console.log('pred[0] = ', argMax(window.presoftmax[this.clickIndex][0]));
          console.log('presoftmax[0] = ', window.presoftmax[this.clickIndex][0]);
        }
         
      })
      .on('mouseout', ()=>{

        this.parent.hover(this.clickIndex);
        if(this.graphView !== undefined){
          this.graphView.updateGraph(this.clickIndex);
        }
        if(this.grandtourView !== undefined){
          this.grandtourView.updatePosition(this.clickIndex);
        }
      });
      if(this.parent !== null){
        this.parent.select(this);
      }
    }
  }
  
  select(x0,x1,y0,y1){
    if (x0 === null){
      this.selected = Array(this.xy.length).fill(true);
    }else{
      this.selected = this.xy.map((d)=>{
        return x0 <= d[0] && d[0] <= x1
            && y0 <= d[1] && d[1] <= y1;
      });
      if(this.mode == 'line'){
        this.selected = this.selected.map((d,i, arr)=>{
          let sub = arr.slice(Math.floor(i/6)*6, Math.floor(i/6)*6+6);
          return Math.max(...sub); 
        });
      }
    }
    if(this.parent !== null){
      this.parent.select(this);
    }
  }


  highlight(selection){
    if(this.mode == 'point'){
      gl_utils.update_data(this.gl, 'a_selected', selection);
    }else if(this.mode == 'line'){
      gl_utils.update_data(this.gl, 'a_selected', 
        zip(selection,selection,selection,
          selection,selection,selection).flat()
      );
    }
    this.plot(false, false);
  }


  initGL(canvas, fs, vs){
    let gl = getGLprog(canvas, fs, vs);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  }

  
}



