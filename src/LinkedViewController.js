import * as d3 from "d3";

export class LinkedViewController{
  constructor(){
    this.children = {};
    this.selected = undefined;
    this.div = d3.select('body')
    .append('div')
    .attr('class', 'text-body');
    this.p = this.div.append('p');
    this.hoverIndex = 0;
  }

  select(child){
    if( !this.children.hasOwnProperty(child.id)){
      this.children[child.id] = child;
    }

    // compute intersection
    this.selected = null;
    for (let childId in this.children){
      if (this.selected === null){
        if(this.children[childId].mode == 'line'){
          this.selected = [];//this.children[childId].selected;
          for(let i=0; i<this.children[childId].selected.length; i+=6){
            this.selected.push(this.children[childId].selected[i]);
          }
        }else{          
          this.selected = this.children[childId].selected;
        }
        continue;
      }

      if(this.children[childId].mode == 'line'){
        this.selected = this.selected.map((d,i)=>{
          return d && this.children[childId].selected[i*6];
        });
      }else{
        this.selected = this.selected.map((d,i)=>{
            return d && this.children[childId].selected[i];
        });
      }
    }

    this.p.text(`selected: ${this.selected.reduce((a,b)=>a+b)} / ${this.selected.length}`);

    let selected = this.selected.map(d=>d?1:0);
    for (let childId in this.children){
      this.children[childId].highlight(selected);
    }
  }

  hover(i){
    this.hoverIndex = i;
    for (let childId in this.children){
      let child = this.children[childId];
      
      child.highlighter
      .style('opacity', 1)
      .attr('cx', child.sx(child.x[i]))
      .attr('cy', child.sy(child.y[i]));
    }
    
  }


}