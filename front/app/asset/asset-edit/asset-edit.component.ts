import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Asset, AssetApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $: any;
declare var swal:any;

@Component({
    selector: 'app-asset-edit',
    templateUrl: 'asset-edit.component.html',
})

export class AssetEditComponent implements OnInit {
    private sub: any;
    public id: string;
    public assetData: any;
    public formAsset: any;
    public isCreateForm: boolean = false;
    public assetGroupList:Array<string>=["Toys","Properties"];
    public isDuplicated:boolean=false;
    constructor(private assetApi:AssetApi,private route:ActivatedRoute, private router:Router, private formBuilder:FormBuilder) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
          if (!params["id"]) {
            this.isCreateForm = true;
            this.assetData = new Asset();
            this.assetData.string2D = "";
            this.assetData.string3D = "";
            this.assetData.group=this.assetGroupList[0];
            this.formAsset = this.formBuilder.group(this.validateForm(this.assetData));
            return $('.navbar-brand').text(`Assets - Create`);
          }
          this.id = params["id"];
          this.assetApi.findById(params["id"]).subscribe(res => {
            if (!res['data']) {
              swal({
                title: "Not found",
                text: "This mission does not exist",
                type: "error"
              },
              function(){
                this.router.navigate(['assets']);
              });
              return;
            }
            this.assetData = res['data'];
            this.formAsset = this.formBuilder.group(this.validateForm(this.assetData));
            $('.navbar-brand').html(`Assets Edit - <em>${this.assetData.name}</em>`);
          });
        })
    }
    checkInputNumber(evt:any):boolean{
          var charCode = (evt.which) ? evt.which : evt.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57))
                return false;
            return true;
          
    }
    validateForm(asset: Asset): {} {
        let editForm = {
          "name": [asset.name, [Validators.required]],
          "description": [asset.description],
          "price": [asset.price],
          "salesToUnlock": [asset.salesToUnlock],
          "group": [asset.group],
          "string3D": [asset.string3D],
          "string2D": [asset.string2D],
        }
        return editForm;
    }
    reset():void
    {
      if(this.isCreateForm) 
      {
        this.assetData = new Asset();
        this.assetData.string2D = "";
        this.assetData.string3D = "";
        this.assetData.group=this.assetGroupList[0];
      }
      else
      {
        this.assetApi.findById(this.id).subscribe(res => {
          this.assetData = res['data'];
        });
      }
      
    }
    submitForm():void
    {
      var me = this;
      if(this.isCreateForm) {
        this.assetApi.find({where:{name:this.formAsset.value.name}}).subscribe(ress=>{
          if(ress.length==0)  
          {
            this.assetApi.create(this.formAsset.value).subscribe(res => {
              if (res['error']) {
                let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                msg += res['error']['message'];
                return swal("Error", msg, "error");
              }
              swal({
                title: "Success",
                text: "Created ( " + this.formAsset.value.name + " ) successfully!",
                type: "success"
              },
              function(){
                me.router.navigate(['assets']);
              });
            });
          }
          else
          {
            swal({
              title: "Error",
              text: "This name has been duplicated!",
              type: "error"
            })
          }
        })
      }
      else
      {
        this.assetApi.updateAttributes(this.id, this.formAsset.value).subscribe(res => {
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
              me.router.navigate(['assets']);
            });
        });
      }
      
    }
}