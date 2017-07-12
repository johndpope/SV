import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, BrandCategory, BrandCategoryApi} from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $:any;
declare var swal:any;
@Component({
    selector: 'app-brandcate-detail',
    templateUrl: 'brandcategorie-detail.component.html',
    styleUrls: ['brandcategorie-detail.component.css']
})

export class BrandCategorieDetailComponent implements OnInit {
    private sub: any;
    public id: string;
    public brandCategoryData: any;
    constructor(private brandCategoryApi:BrandCategoryApi,private route:ActivatedRoute, private router:Router) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        
        this.sub = this.route.params.subscribe(params => {
            if(typeof params['id'] != 'undefined')
            {
                this.brandCategoryApi.findById(params["id"]).subscribe(res => {
                    if (!res['data']) {
                        swal({
                            title: "Not found",
                            text: "This Brand Categorie does not exist",
                            type: "error"
                        },
                        function(){
                            this.router.navigate(['brandcate']);
                        });
                        return;
                    }
                    this.brandCategoryData = res['data'];
                    $('.navbar-brand').html(`Brand Categorie Detail - <em>${this.brandCategoryData.name}</em>`);
                });
            }
            else
            {
                this.router.navigate(['brandcate']);
            }
            
          
        });
        
    }
}