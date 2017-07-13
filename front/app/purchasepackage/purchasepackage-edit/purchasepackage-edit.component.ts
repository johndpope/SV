import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoopBackConfig, PurchasePackage, PurchasePackageApi } from '../../shared/sdk';
import { API_VERSION, BASE_URL } from '../../shared/index';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-purchasepackage-edit',
  templateUrl: 'purchasepackage-edit.component.html',
  // styleUrls: ['./versionapp-edit.component.css']
})
export class PurchasePackageEditComponent implements OnInit, OnDestroy {
  private sub: any;
  public id: string;
  public purchasepackageData: any;
  public formPurchasePackage: any;
  public isCreateForm: boolean = false;
  private categoryList: any;
  constructor(private purchasePackageApi: PurchasePackageApi, private route: ActivatedRoute, private router: Router, private formBuilder: FormBuilder) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
    this.loadCategoryList();
  }
  ngOnInit() {
    var me = this;

    this.sub = this.route.params.subscribe(params => {

      if (!params["id"]) {
        this.isCreateForm = true;

        this.purchasepackageData = this.setCreateData();
        this.formPurchasePackage = this.formBuilder.group(this.validateForm(this.purchasepackageData));
        return $('.navbar-brand').text(`Purchase Package - Create`);
      }

      this.id = params["id"];
      this.purchasePackageApi.findById(params["id"]).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This Purchase Package does not exist",
            type: "error"
          },
            function () {
              me.router.navigate(['purchasepackage']);
            });
          return;
        }

        this.purchasepackageData = res['data'];
        this.formPurchasePackage = this.formBuilder.group(this.validateForm(this.purchasepackageData));
        $('.navbar-brand').html(`Purchase Package Edit - <em>${this.purchasepackageData.name}</em>`);
      });
      $('.navbar-brand').text(`Purchase Package Edit`);
    })
  }
  loadCategoryList(): void {
    this.purchasePackageApi.getCategories().subscribe(res => {
      this.categoryList = res['data'];

    });
  }
  setCreateData(): any {
    let createData = new PurchasePackage();
    createData.items = [{}];
    createData.priceUnit = 'USD';
    return createData;
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  validateForm(purchasePackage: PurchasePackage): {} {
    let editForm = {
      "name": [purchasePackage.name, [Validators.required]],
      "description": [purchasePackage.description, [Validators.required]],
      "category": [purchasePackage.category, [Validators.required]],
      "price": [purchasePackage.price, [Validators.required]],
      "priceUnit": [purchasePackage.priceUnit, [Validators.required]],
    }
    return editForm;
  }
  checkForm(): boolean {
    for (var i = 0; i < this.purchasepackageData.items.length; i++) {
      // code...
      if (!this.purchasepackageData.items[i].boosterKey || !this.purchasepackageData.items[i].number) {
        return false;
      }
    }
    return true;
  }
  addItem(): void {
    this.purchasepackageData.items.push({});
  }
  removeItem(): void {
    if (this.purchasepackageData.items.length > 1)
      this.purchasepackageData.items.pop();
  }
  submitForm(): void {
    var me = this;
    if (this.checkForm()) {
      if (this.isCreateForm) {
        this.purchasePackageApi.create(this.purchasepackageData).subscribe(res => {
          if (res['error']) {
            let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
            msg += res['error']['message'];
            return swal("Error", msg, "error");
          }

          swal({
            title: "Success",
            text: "Created (" + this.purchasepackageData.name + ") successfully!",
            type: "success"
          },
            function () {
              me.router.navigate(['purchasepackage/' + res['data'].id + '/detail']);
            });
        });
        return;
      }
      this.purchasePackageApi.updateAttributes(this.id, this.purchasepackageData).subscribe(res => {
        if (res['error']) {
          let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
          msg += res['error']['message'];
          return swal("Error", msg, "error");
        }
        swal("Success", "Updated successfully!", "success");
        swal({
          title: "Success",
          text: "Updated successfully!",
          type: "success"
        },
          function () {
            me.router.navigate(['purchasepackage/' + res['data'].id + '/detail']);
          });
      });

    }
    else {
      swal({
        title: "Alert",
        text: "Please fill in all the fields with an asterisk",
        type: "warning",
        showCancelButton: false,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Ok!",
        closeOnConfirm: false,
        closeOnCancel: false
      });
    }
  }
  reset() {
    if (this.isCreateForm) {
      this.purchasepackageData = this.setCreateData();
    }
    else {
       this.purchasePackageApi.findById(this.id).subscribe(res => {
        this.purchasepackageData = res['data'];
      });
    }
  }



}
