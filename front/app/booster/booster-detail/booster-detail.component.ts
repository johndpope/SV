import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import {LoopBackConfig, Booster, BoosterApi } from '../../shared/sdk/index';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $:any;
declare var swal:any;
@Component({
    selector: 'app-booster-detail',
    templateUrl: 'booster-detail.component.html',
    // styleUrls: ['booster-detail.component.css']
})

export class BoosterDetailComponent implements OnInit {
    private sub: any;
    public id: string;
    public boosterData: any;
    constructor(private boosterApi:BoosterApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        var me=this;
        this.sub = this.route.params.subscribe(params => {
            if(typeof params['id'] != 'undefined')
            {
                this.boosterApi.findById(params["id"]).subscribe(res => {
                    if (!res['data']) {
                        swal({
                            title: "Not found",
                            text: "This Booster does not exist",
                            type: "error"
                        },
                        function(){
                            me.router.navigate(['booster']);
                        });
                        return;
                    }
                    this.boosterData = res['data'];
                    $('.navbar-brand').html(`Booster Detail - <em>${this.boosterData.name}</em>`);
                });
            }
            else
            {
                this.router.navigate(['booster']);
            }
            
          
        });
        
    }
}