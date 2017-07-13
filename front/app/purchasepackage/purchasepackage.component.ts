import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, PurchasePackage, PurchasePackageApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-purchasepackage',
  templateUrl: './purchasepackage.component.html',
  // styleUrls: ['./mission.component.css']
})
export class PurchasePackageComponent extends ListMasterBaseComponent {
  public titleTrue:string=`Purchase Package List`;
  public navigator:string="/purchasepackage";
  private categoryList:any;
  constructor(public api: PurchasePackageApi,public route:ActivatedRoute, public router:Router) { 
    super();
    this.loadCategoryList();

  }
  loadCategoryList():void{
    this.api.getCategories().subscribe(res=>{
        this.categoryList=res['data'];
    });
  }
}
