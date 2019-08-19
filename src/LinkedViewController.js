export class LinkedViewController{
  constructor(){
    this.children = {};
    this.selected = undefined;
  }

  select(child, id){
    if( !this.children.hasOwnProperty(id)){
      this.children[child.id] = child;
    }

    // compute intersection
    this.selected = this.children[child.id].selected;
    for (let childId in this.children){
      if (childId !== child.id){
        this.selected = this.selected.map((d,i)=>{
          return d && this.children[childId].selected[i];
        });
      }
    }

    for (let childId in this.children){
      this.children[childId].highlight(this.selected.map(d=>d?1:0));
    }
  }


}