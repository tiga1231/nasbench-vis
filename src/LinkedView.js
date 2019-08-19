import * as gl_utils from "./gl_utils";
import getGLprog from "webgl-utils";

const DPR = window.devicePixelRatio;
const CLEAR_COLOR = [0.2, 0.2, 0.2, 1.0];

export class LinkedView{

  constructor(x,y, kwargs){
    kwargs = kwargs || {};
    var vertexShader = require("./shader/shader.vs");
    var fragmentShader = require("./shader/shader.fs");

    let canvasWidth = kwargs.canvasWidth || window.innerWidth;
    let canvasHeight = kwargs.canvasHeight || window.innerHeight;
    this.margin = kwargs.margin ||  [0.1, 0.9, 0.1, 0.9];//[left, right, bottom, top]
    this.pointSize = kwargs.pointSize || 100.0;

    this.div = d3.select('body')
    .append('div')
    .attr('class', 'plot');

    this.overlay = this.div
    .append('svg')
    .attr('class', 'overlay')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight);

    this.canvas = this.div
    .append('canvas')
    .attr('width', canvasWidth*DPR)
    .attr('height', canvasHeight*DPR)
    .style('width', canvasWidth)
    .style('height', canvasHeight);

    this.gl = this.initGL(this.canvas.node(), fragmentShader, vertexShader);
    this.plot(x, y);
  }

  
  plot(x, y){
    let gl = this.gl;
    let margin = this.margin;
    let pointSize = this.pointSize;

    let n = 10000;
    let xy = Array(n).fill().map((d,i)=>{
      return [x[i], y[i]];
    });
    let xmax = x.reduce((a,b)=>Math.max(a,b), x[0]);
    let xmin = x.reduce((a,b)=>Math.min(a,b), x[0]);
    let ymax = y.reduce((a,b)=>Math.max(a,b), y[0]);
    let ymin = y.reduce((a,b)=>Math.min(a,b), y[0]);

    // this.sx = d3.scaleLinear().domain([xmin, xmax])
    // .range([margin, this.width-margin]);

    gl_utils.clear(gl, CLEAR_COLOR);
    gl_utils.update_data(gl, 'a_position', xy);
    gl_utils.update_uniform(gl, 'u_margin', margin); 
    gl_utils.update_uniform(gl, 'u_shift', [xmin, ymin]);
    gl_utils.update_uniform(gl, 'u_scale', [xmax-xmin, ymax-ymin]);
    gl_utils.update_uniform(gl, 'u_pointsize', pointSize);
    gl.drawArrays(gl.POINTS, 0, n);
  }
  
  initGL(canvas, fs, vs){
    let gl = getGLprog(canvas, fs, vs);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  }
}



