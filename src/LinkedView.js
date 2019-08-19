import * as gl_utils from "./gl_utils";
import getGLprog from "webgl-utils";

const DPR = window.devicePixelRatio;
const CLEAR_COLOR = [0.2, 0.2, 0.2, 1.0];

export class LinkedView{

  constructor(x,y, kwargs){
    kwargs = kwargs || {};
    var vertexShader = require("./shader/shader.vs");
    var fragmentShader = require("./shader/shader.fs");

    this.x = x;
    this.y = y;

    this.width = kwargs.width || window.innerWidth;
    this.height = kwargs.height || window.innerHeight;
    this.margin = kwargs.margin ||  [0.1, 0.9, 0.1, 0.9];//[left, right, bottom, top]
    this.ylim = kwargs.ylim;
    this.pointSize = kwargs.pointSize || 100.0;
    this.parent = kwargs.parent || null;
    this.id = kwargs.id || "" + Math.floor(Math.random() * 1e9);

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
    this.selected = Array(this.x.length).fill(true);
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
    this.xy = Array(n).fill().map((d,i)=>{
      return [x[i], y[i]];
    });

    let xmax = x.reduce((a,b)=>Math.max(a,b), x[0]);
    let xmin = x.reduce((a,b)=>Math.min(a,b), x[0]);

    let ymin, ymax;
    if(this.ylim === undefined){
      ymax = y.reduce((a,b)=>Math.max(a,b), y[0]);
      ymin = y.reduce((a,b)=>Math.min(a,b), y[0]);
    }else{
      ymin = this.ylim[0];
      ymax = this.ylim[1];
    }
    

    //webgl plot
    gl_utils.clear(gl, CLEAR_COLOR);
    if(isFirst){
      gl_utils.update_data(gl, 'a_position',  this.xy);
      gl_utils.update_data(gl, 'a_selected', Array(n).fill(1.0));
      gl_utils.update_uniform(gl, 'u_margin', margin); 
      gl_utils.update_uniform(gl, 'u_shift', [xmin, ymin]);
      gl_utils.update_uniform(gl, 'u_scale', [xmax-xmin, ymax-ymin]);
      gl_utils.update_uniform(gl, 'u_pointsize', pointSize);
    }
    gl.drawArrays(gl.POINTS, 0, n);

    if(isFirst){
      //overlay (svg) plot
      this.sx = d3.scaleLinear().domain([xmin, xmax])
      .range([margin[0]*this.width, margin[1]*this.width]);
      this.sy = d3.scaleLinear().domain([ymin, ymax])
      .range([(1-margin[2])*this.height, (1-margin[3])*this.height]);

      //axis
      this.ax = d3.axisBottom(this.sx);
      this.gx = this.overlay.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.sy(ymin)})`)
      .call(this.ax);

      this.ay = d3.axisLeft(this.sy);
      this.gy = this.overlay.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${this.sx(xmin)}, 0)`)
      .call(this.ay);

      //brush
      this.brush = d3.brush()
      .extent([
        [this.sx(xmin)-10,this.sy(ymax)-10], 
        [this.sx(xmax)-10,this.sy(ymin)+10]
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
    }
    if(this.parent !== null){
      this.parent.select(this);
    }
  }

  highlight(selection){
    gl_utils.update_data(this.gl, 'a_selected', selection);
    this.plot(false);
  }

  initGL(canvas, fs, vs){
    let gl = getGLprog(canvas, fs, vs);


    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    return gl;
  }
}



