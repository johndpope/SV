import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, BrandCategory, BrandCategoryApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $: any;
declare var swal:any;

@Component({
    selector: 'app-brandcate-edit',
    templateUrl: './brandcategorie-edit.component.html',
    styleUrls: ['brandcategorie-edit.component.css']
})

export class BrandCategorieEditComponent implements OnInit {
    private sub: any;
    public id: string;
    public brandCategoryData: any;
    public formBrandCategorie: any;
    public nameItemEdit: string;
    public isCreateForm: boolean = false;
    constructor(private brandCategoryApi:BrandCategoryApi,private route:ActivatedRoute, private router:Router, private formBuilder:FormBuilder) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        var me = this;
        this.sub = this.route.params.subscribe(params => {
          if (!params["id"]) {
            this.isCreateForm = true;
            this.brandCategoryData = new BrandCategory();
            this.formBrandCategorie = this.formBuilder.group(this.validateForm(this.brandCategoryData));
            return $('.navbar-brand').text(`Brand Categorie - Create`);
          }
          this.id = params["id"];
          this.brandCategoryApi.findById(params["id"]).subscribe(res => {
            if (!res['data']) {
              swal({
                title: "Not found",
                text: "This Brand Categorie does not exist",
                type: "error"
              },
              function(){
                me.router.navigate(['/brandcate']);
              });
              return;
            }
            this.brandCategoryData = res['data'];
            this.nameItemEdit=this.brandCategoryData.name;
            this.formBrandCategorie = this.formBuilder.group(this.validateForm(this.brandCategoryData));
            $('.navbar-brand').html(`Brand Categorie Edit - <em>${this.brandCategoryData.name}</em>`);
          });
        })
    }

    validateForm(brandCategory: BrandCategory): {} {
        let editForm = {
          "name": [brandCategory.name, [Validators.required]],
          "description": [brandCategory.description]
        }
        return editForm;
    }
      reset():void
    {
      if(this.isCreateForm) 
      {
        this.brandCategoryData = new BrandCategory();
      }
      else
      {
        this.brandCategoryApi.findById(this.id).subscribe(res => {
          this.brandCategoryData = res['data'];
        });
      }
      
    }
    submitForm():void
    {
      var me = this;
      if(me.isCreateForm) {
        this.brandCategoryApi.find({where:{name:this.brandCategoryData.name}}).subscribe(ress=>{
          if(ress.length==0)  
          {
              this.brandCategoryApi.create(this.brandCategoryData).subscribe(res => {
                if (res['error']) {
                  let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                  msg += res['error']['message'];
                  return swal("Error", msg, "error");
                }
                swal({
                  title: "Success",
                  text: "Created ( " + this.brandCategoryData.name + " ) successfully!",
                  type: "success"
                },
                function(){
                  me.router.navigate(['brandcate/'+res['data'].id+'/detail']);
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
      
        return;
      }
      this.brandCategoryApi.find({where:{name:this.brandCategoryData.name}}).subscribe(ress=>{
          if(!(this.brandCategoryData.name==this.nameItemEdit)&&ress.length==0)
          {
            this.brandCategoryApi.updateAttributes(this.id, this.brandCategoryData).subscribe(res => {
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
                  me.router.navigate(['brandcate/'+res['data'].id+'/detail']);
                });
            });
          }
          if(this.brandCategoryData.name==this.nameItemEdit)  
          {
            this.brandCategoryApi.updateAttributes(this.id, this.brandCategoryData).subscribe(res => {
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
                  me.router.navigate(['brandcate/'+res['data'].id+'/detail']);
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
}