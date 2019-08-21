import * as gl_utils from "./gl_utils";
import getGLprog from "webgl-utils";
import {zip} from './utils';

const DPR = window.devicePixelRatio;
const CLEAR_COLOR = [0.2, 0.2, 0.2, 1.0];

export class LinkedView{

  constructor(x,y, kwargs){
    kwargs = kwargs || {};
    var vertexShader = require("./shader/shader.vs");
    var fragmentShader = require("./shader/shader.fs");



    this.width = kwargs.width || window.innerWidth;
    this.height = kwargs.height || window.innerHeight;
    this.margin = kwargs.margin ||  [0.1, 0.9, 0.1, 0.9];//[left, right, bottom, top]
    this.ylim = kwargs.ylim;
    this.xlim = kwargs.xlim;
    this.pointSize = kwargs.pointSize || 100.0;
    this.parent = kwargs.parent || null;
    this.id = kwargs.id || "" + Math.floor(Math.random() * 1e9);
    this.mode = kwargs.mode || 'point';

    if(this.mode == 'point'){
      this.x = x;
      this.y = y;
    }else{
      this.x = x.map(d=>[d[0], d[1], d[1], d[2], d[2], d[3]]);
      this.y = y.map(d=>[d[0], d[1], d[1], d[2], d[2], d[3]]);
    }
    this.div = d3.select('body')
    .append('div')
    .attr('class', 'plot');

    this.overlay = this.div
    .append('svg')
    .attr('class', 'overlay')
    .attr('width', this.width)
    .attr('height', this.height);

    this.canvas = this.div
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
    this.plot(true);
  }

  
  plot(isFirst){
    let x = this.x;
    let y = this.y;
    let n = x.length;

    let gl = this.gl;
    let margin = this.margin;
    let pointSize = this.pointSize;

    //data
    this.xy = zip(x.flat(),y.flat());

    if(this.xlim === undefined){
      this.xmin = x.flat().reduce((a,b)=>Math.min(a,b), x.flat()[0]);
      this.xmax = x.flat().reduce((a,b)=>Math.max(a,b), x.flat()[0]);
    }else{
      this.xmin = this.xlim[0];
      this.xmax = this.xlim[1];
    }
    if(this.ylim === undefined){
      this.ymax = y.flat().reduce((a,b)=>Math.max(a,b), y.flat()[0]);
      this.ymin = y.flat().reduce((a,b)=>Math.min(a,b), y.flat()[0]);
    }else{
      this.ymin = this.ylim[0];
      this.ymax = this.ylim[1];
    }
    

    //webgl plot
    gl_utils.clear(gl, CLEAR_COLOR);
    if(isFirst){
      gl_utils.update_data(gl, 'a_position',  this.xy);
      if (this.mode == 'point'){
        gl_utils.update_data(gl, 'a_selected', Array(n).fill(1.0));
      }else{
        gl_utils.update_data(gl, 'a_selected', Array(n*6).fill(1.0));
      }
      gl_utils.update_uniform(gl, 'u_margin', margin); 
      gl_utils.update_uniform(gl, 'u_shift', [this.xmin, this.ymin]);
      gl_utils.update_uniform(gl, 'u_scale', [this.xmax-this.xmin, this.ymax-this.ymin]);
      gl_utils.update_uniform(gl, 'u_pointsize', pointSize);
    }


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
    

    if(isFirst){
      //overlay (svg) plot
      this.sx = d3.scaleLinear().domain([this.xmin, this.xmax])
      .range([margin[0]*this.width, margin[1]*this.width]);
      this.sy = d3.scaleLinear().domain([this.ymin, this.ymax])
      .range([(1-margin[2])*this.height, (1-margin[3])*this.height]);

      //axis
      this.ax = d3.axisBottom(this.sx);
      this.gx = this.overlay.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.sy(this.ymin)})`)
      .call(this.ax);

      this.ay = d3.axisLeft(this.sy);
      this.gy = this.overlay.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${this.sx(this.xmin)}, 0)`)
      .call(this.ay);

      //brush
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
        this.select(x0,x1,y0,y1);
      })
      .on('end', ()=>{
        if(d3.event.selection === null){
          this.select(null);
        }
      });
      this.overlay.append('g')
      .attr('class', 'brush')
      .call(this.brush);

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
    this.plot(false);
  }

  initGL(canvas, fs, vs){
    let gl = getGLprog(canvas, fs, vs);


    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    return gl;
  }
}



