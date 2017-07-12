import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import {LoopBackConfig, PurchasePackage, PurchasePackageApi } from '../../shared/sdk/index';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $:any;
declare var swal:any;
@Component({
    selector: 'app-purchasepackage-detail',
    templateUrl: 'purchasepackage-detail.component.html',
    // styleUrls: ['./purchasepackage-detail.component.css']
})

export class PurchasePackageDetailComponent implements OnInit {
    private sub: any;
    public id: string;
    public purchasePackageData: any;
    constructor(private purchasePackageApi:PurchasePackageApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        
        this.sub = this.route.params.subscribe(params => {
            if(typeof params['id'] != 'undefined')
            {
                this.purchasePackageApi.findById(params["id"]).subscribe(res => {
                    if (!res['data']) {
                        swal({
                            title: "Not found",
                            text: "This Purchase Package does not exist",
                            type: "error"
                        },
                        function(){
                            this.router.navigate(['purchasepackage']);
                        });
                        return;
                    }
                    this.purchasePackageData = res['data'];
                    $('.navbar-brand').html(`Purchase Package Detail - <em>${this.purchasePackageData.name}</em>`);
                });
            }
            else
            {
                this.router.navigate(['missions']);
            }
            
          
        });
        
    }
}