import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, Asset, AssetApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  // styleUrls: ['./mission.component.css']
})
export class AssetComponent extends ListMasterBaseComponent {
  private missionTypeList:any;
  public titleTrue:string=`Asset List`;
  public navigator:string="/assets";
  public assetGroupList:Array<string>=["Toys","Properties"];
  constructor(public api: AssetApi,public route:ActivatedRoute, public router:Router) { 
    super();
  }
}
