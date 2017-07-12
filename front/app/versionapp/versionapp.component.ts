import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {LoopBackConfig, VersionAppApi, BoosterApi,VersionApp} from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-versionapp',
  templateUrl: './versionapp.component.html',
  styleUrls: ['./versionapp.component.css']
})
export class VersionAppComponent extends ListMasterBaseComponent {

  public titleTrue:string=`Version App List`;
  public navigator:string="/versionapps";
  public order:string="created DESC";

  constructor(public api: VersionAppApi, public route:ActivatedRoute, public router:Router, private boosterApi: BoosterApi) { 
    super();
  }
}