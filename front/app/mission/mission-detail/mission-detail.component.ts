import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Mission, MissionApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $:any;
declare var swal:any;
@Component({
    selector: 'app-mission-detail',
    templateUrl: 'mission-detail.component.html',
    styleUrls: ['./mission-detail.component.css']
})

export class MissionDetailComponent implements OnInit {
    private sub: any;
    public id: string;
    public missionData: any;
    constructor(private missionApi:MissionApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        
        this.sub = this.route.params.subscribe(params => {
            if(typeof params['id'] != 'undefined')
            {
                this.missionApi.findById(params["id"]).subscribe(res => {
                    if (!res['data']) {
                        swal({
                            title: "Not found",
                            text: "This mission does not exist",
                            type: "error"
                        },
                        function(){
                            this.router.navigate(['missions']);
                        });
                        return;
                    }
                    this.missionData = res['data'];
                    $('.navbar-brand').html(`Mission Detail - <em>${this.missionData.name}</em>`);
                });
            }
            else
            {
                this.router.navigate(['missions']);
            }
            
          
        });
        
    }
}