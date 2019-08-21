import * as d3 from "d3";

export class LinkedViewController{
  constructor(){
    this.children = {};
    this.selected = undefined;
    this.div = d3.select('body')
    .append('div')
    .attr('class', 'text-body');
    this.p = this.div.append('p');
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

    this.p.text(`selected: ${this.selected.reduce((a,b)=>a+b)}/${this.selected.length}`);

    for (let childId in this.children){
      this.children[childId].highlight(this.selected.map(d=>d?1:0));
    }
  }


}