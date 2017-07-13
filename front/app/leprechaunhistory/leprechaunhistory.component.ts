import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig,LeprechaunHistoryApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
import {DaterangepickerConfig,Daterangepicker} from 'ng2-daterangepicker';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-leprechaunhistory',
  templateUrl: './leprechaunhistory.component.html',
  styleUrls: ['./leprechaunhistory.component.css']
})
export class LeprechaunhistoryComponent extends ListMasterBaseComponent {
  public titleTrue:string=`LeprechaunHistory`;
  public navigator:string="/leprechaunhistory";
  public order:string="created DESC";
  public page: number = 0;

  public options: any = {
        locale: { format: 'YYYY/MM/DD' },
        alwaysShowCalendars: false,
    };
  constructor(public api: LeprechaunHistoryApi,public route:ActivatedRoute, public router:Router,private daterangepickerOptions: DaterangepickerConfig) { 
    super();
     this.daterangepickerOptions.settings = {
            locale: { format: 'YYYY/MM/DD' },
            alwaysShowCalendars: false,
        };
  }
  submitFilter() {
    let where = {};
    let dateRange=$('#dateRange').val().split("-");
    where["startDate"]=dateRange[0];
    where["endDate"]=dateRange[1];
    this.navigateWithQueryParams(where);
  };
   getParamForQuery(params: {}): any {
    var queryParam = $.extend({}, this.where);
    for (var k in params) {
      if (!this.validForParam(k) || !this.validForParam(params[k])) {
        let arrr=[];
        arrr.push({
          "created":{
            // gt:new Date(params['startDate'])
            gt:(params['startDate'])
          }
        })
        arrr.push({
          "created":{
            lt:(params['endDate'])
            // lt:new Date(params['endDate'])
          }
        })
        queryParam["and"] =arrr;
        break;
      }
    }
    return queryParam;
  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    
    
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    delete whereQuery['startDate'];
    delete whereQuery['endDate'];
    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
      this.dataList = data;
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
   
}
