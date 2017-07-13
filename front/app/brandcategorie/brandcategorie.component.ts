import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, BrandCategory, BrandCategoryApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-brandcate',
  templateUrl: './brandcategorie.component.html',
  // styleUrls: ['./mission.component.css']
})
export class BrandCategorieComponent extends ListMasterBaseComponent {
  public titleTrue:string=`Brand Categories List`;
  public navigator:string="/brandcate";
  public order:string="created DESC";
  public page: number = 0;
  constructor(public api: BrandCategoryApi,public route:ActivatedRoute, public router:Router) { 
    super();
  }
}
