import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Booster, BoosterApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $: any;
declare var swal:any;

@Component({
    selector: 'app-booster-edit',
    templateUrl: './booster-edit.component.html',
    // styleUrls: ['booster-edit.component.css']
})

export class BoosterEditComponent implements OnInit {
    private sub: any;
    public id: string;
    public boosterData: any;
    public formBooster: any;
    public nameItemEdit: string;
    public isCreateForm: boolean = false;
    public categories:any;
    constructor(private boosterApi:BoosterApi,private route:ActivatedRoute, private router:Router, private formBuilder:FormBuilder) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
        this.getCategories();
    }

    ngOnInit() {
        var me = this;
        this.sub = this.route.params.subscribe(params => {
          this.id = params["id"];
          this.boosterApi.findById(params["id"]).subscribe(res => {
            if (!res['data']) {
              swal({
                title: "Not found",
                text: "This Booster does not exist",
                type: "error"
              },
              function(){
                me.router.navigate(['/booster']);
              });
              return;
            }

            this.boosterData = res['data'];
            this.checkValid();
            this.nameItemEdit=this.boosterData.name;
            this.formBooster = this.formBuilder.group(this.validateForm(this.boosterData));
            $('.navbar-brand').html(`Booster Edit - <em>${this.boosterData.name}</em>`);
          });
        })
    }
    checkValid(){
      if(!this.boosterData.restrictUnlock)
      {
        this.boosterData.restrictUnlock=  {
                                "restrict" : {
                                      "max" :''
                                  }
                                };
      }
       
      if(!this.boosterData.requiredUnlock)
      {
        this.boosterData.requiredUnlock=   {
                                      "level" : '', 
                                      "stage" : ''
                                  };
      }
    }
    getCategories()
    {
      this.boosterApi.getCategories().subscribe(res=>{
        this.categories=res['data'];
      })
    }
    validateForm(booster: Booster): {} {
        let editForm = {
          "name": [booster.name, [Validators.required]],
          "description": [booster.description],
          "category.code": [booster.category.code, [Validators.required]],
          "category.name": [booster.category.name, [Validators.required]],
          "rarity": [booster.rarity, [Validators.required]],
          "energy": [booster.boostValue.energy],
          "times": [booster.boostValue.times],
          "crowd": [booster.boostValue.crowd],
          "finishConstruction": [booster.boostValue.finishConstruction],
          "restrictUnlock.restrict.max": [booster.restrictUnlock.restrict.max],
          "requiredUnlock.level": [booster.requiredUnlock.level],
          "requiredUnlock.stage": [booster.requiredUnlock.stage],
          "price": [booster.price, [Validators.required]],
          "priceUnit": [booster.priceUnit, [Validators.required]],
          "key": [booster.key, [Validators.required]],
        }
        return editForm;
    }
    reset():void
    {
      if(this.isCreateForm) 
      {
        this.boosterData = new Booster();
      }
      else
      {
        this.boosterApi.findById(this.id).subscribe(res => {
          this.boosterData = res['data'];
          this.checkValid();
        });
      }
      
    }
    submitForm():void
    {
      var me = this;
      this.boosterData.category.name=this.boosterData.category.code[0].toUpperCase()+this.boosterData.category.code.substring(1);
       this.boosterApi.updateAttributes(this.id, this.boosterData).subscribe(res => {
        if (res['error']) {
          let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
          msg += res['error']['message'];
          return swal("Error", msg, "error");
        }
        swal({
            title: "Success",
            text: "Updated successfully!",
            type: "success"
          },
          function(){
            me.router.navigate(['booster/'+res['data'].id+'/detail']);
          });
      });
      
    }
}