import { Component, OnInit,Input} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Booster, BoosterApi} from '../../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../../shared/index';
declare var $: any;

@Component({
    selector: 'app-purchasepackage-edit-item',
    templateUrl: 'purchasepackage-items.component.html',
    // styleUrls: ['./product-edit.component.css']
})

export class PurchasePackageItemsComponent implements OnInit {
    @Input() purchasepackageItem: any;
    boosterList:any;
    public formPurchasepackageItem: any;

    constructor(private boosterApi:BoosterApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        this.boosterApi.find({where:{priceUnit:'USD'}}).subscribe(boosters=>{
            this.boosterList=boosters;
            if(!this.purchasepackageItem.boosterKey){
                this.purchasepackageItem.boosterKey=boosters[0]["key"];
            }
        })
    }
}
