import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, Booster, BoosterApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-booster',
  templateUrl: './booster.component.html',
  // styleUrls: ['./mission.component.css']
})
export class BoosterComponent extends ListMasterBaseComponent {
  public titleTrue:string=`Booster List`;
  public navigator:string="/booster";
  public order:string="created DESC";
  public page: number = 0;
  public boosterKeys:any;
  public categories:any;
  constructor(public api: BoosterApi,public route:ActivatedRoute, public router:Router) { 
    super();
    this.getBoosterKeys();
    this.getCategories();
  }

  loadList(params:{}):void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    
    let orQuery=null;
    if(this.where['name'])
    {
      let orQueryName={
               "like": this.where['name'],
               "options": "i"
             };
      let orQueryDescription={
               "like": this.where['name'],
               "options": "i"
             };
      orQuery={or: [{name: orQueryName}, {description: orQueryDescription}]};
      delete this.where['name'];
      this.where = $.extend(orQuery, this.where);
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    this.api.find({where:whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order}).subscribe(data=>
    {
      this.dataList=data;
      this.prevPage = this.page > 0;
      this.nextPage = false;
      this.isEmpty = false;
      if (this.dataList.length > this.limit) {
        this.nextPage = true;
        this.dataList.pop();
      }
      if (this.dataList.length === 0) {
        this.isEmpty = true;
      }
      this.updateBrand();
    })
  }

  getBoosterKeys()
  {
    this.api.getBoosterKeys().subscribe(res=>{
      this.boosterKeys=res['data'];
    })
  }
  getCategories()
  {
    this.api.getCategories().subscribe(res=>{
      this.categories=res['data'];
    })
  }
}
