import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Mission, MissionApi} from '../../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../../shared/index';
declare var $: any;

@Component({
    selector: 'mission-criteria',
    templateUrl: 'mission-criteria.component.html',
    // styleUrls: ['./product-edit.component.css']
})

export class MissionCriteriaComponent implements OnInit {
    @Input() missionCriteria: any;
    actionList:any;
    constructor(private missionApi:MissionApi) {
        
    }

    ngOnInit() {
        this.missionApi.getActionList().subscribe(data=>{
            this.actionList=data["data"];
            if(!this.missionCriteria.action) {
                this.missionCriteria.action=this.actionList[0];
            }
        });
        
    }
    checkInputNumber(evt:any):boolean{
      var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57))
            return false;
        return true;
    }
}