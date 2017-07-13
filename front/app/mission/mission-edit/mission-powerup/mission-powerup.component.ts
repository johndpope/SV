import { Component, OnInit,Input} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig,PurchasePackage, Booster, BoosterApi} from '../../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../../shared/index';
declare var $: any;

@Component({
    selector: 'mission-powerup',
    templateUrl: 'mission-powerup.component.html',
    // styleUrls: ['./product-edit.component.css']
})

export class MissionPowerUpComponent implements OnInit {
    @Input() missionPowerUp: any;
    boosterList:any;
    constructor(private boosterApi:BoosterApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        this.boosterApi.find().subscribe(boosters=>{
            this.boosterList=boosters;
            if(typeof  this.missionPowerUp==="string")
            {
                this.missionPowerUp={value:this.missionPowerUp};
            }
            if(!this.missionPowerUp.value){
                this.missionPowerUp.value=boosters[0]["key"];
            }
            
        })
    }
}
