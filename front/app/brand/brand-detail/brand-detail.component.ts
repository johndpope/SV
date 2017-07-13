import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Brand, BrandApi,SettingApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
import {ListMasterBaseComponent} from '../../shared/listMaster.component';
declare var $:any;
declare var swal:any;
@Component({
    selector: 'app-brand-detail',
    templateUrl: 'brand-detail.component.html',
    // styleUrls: ['brandcategorie-detail.component.css']
})

export class BrandDetailComponent extends ListMasterBaseComponent {
    public sub: any;
    public id: string;
    public brandData: any;
    constructor(public api:BrandApi,public route:ActivatedRoute, public router:Router,public settingApi:SettingApi) {
        super();
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        
        this.sub = this.route.params.subscribe(params => {
            if(typeof params['id'] != 'undefined')
            {
                this.api.findById(params["id"]).subscribe(res => {
                    if (!res['data']) {
                        swal({
                            title: "Not found",
                            text: "This Brand does not exist",
                            type: "error"
                        },
                        function(){
                            this.router.navigate(['brandcate']);
                        });
                        return;
                    }
                    if(res['data']['picture'])
                      res['data']['picture'] = `${ListMasterBaseComponent.allSetting.MEDIA_LINK}/${res['data']['picture']['container']}/${res['data']['picture']['name']}`;
                    else
                      res['data']['picture'] = "";
                    this.brandData = res['data'];

                    $('.navbar-brand').html(`Brand Detail - <em>${this.brandData.name}</em>`);
                });
            }
            else
            {
                this.router.navigate(['brand']);
            }
            
          
        });
        
    }
}