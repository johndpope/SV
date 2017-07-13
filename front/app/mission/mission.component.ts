import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router ,Params } from '@angular/router';
import {LoopBackConfig, Mission, MissionApi } from '../shared/sdk/index';
import {API_VERSION, BASE_URL, BASE_STORAGE_URL} from '../shared/base.url';
import {ListMasterBaseComponent} from '../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-mission',
  templateUrl: './mission.component.html',
  // styleUrls: ['./mission.component.css']
})
export class MissionComponent extends ListMasterBaseComponent {
  public titleTrue:string=`Mission List`;
  public navigator:string="/missions";
  private missionTypeList:any;
  constructor(public api: MissionApi,public route:ActivatedRoute, public router:Router) { 
    super();
    this.loadMissionType();
  }
  loadMissionType():void{
    this.api.find({fields:["type"]}).subscribe(data=>{
        var uniqueNames = [];
        $.each(data, function(i, el){
            if($.inArray(el.type, uniqueNames) === -1) uniqueNames.push(el.type);
        });
        this.missionTypeList=uniqueNames;
       });
  }
}
