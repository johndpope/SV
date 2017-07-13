import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Brand, BrandApi, BrandCategoryApi, SettingApi } from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
import { UploadService } from "app/services/upload.service";

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

declare var $: any;
declare var swal: any;

@Component({
  selector: 'app-brand-edit',
  templateUrl: './brand-edit.component.html',
})

export class BrandEditComponent implements OnInit {
  private sub: any;
  public id: string;
  public brandData: any;
  public formBrand: any;
  public nameItemEdit: string;
  public isCreateForm: boolean = false;
  affiliateNetWork = ['cj', 'ls', 'fo'];
  listCategorie: any;
  category: Array<string> = [];

  basePictureUrl: string = "";
  file: File;
  imageSrc: string = '';
  fileName: string = '';
  baseUrl: string;
  progressBar: Array<number> = [];
  constructor(private brandApi: BrandApi, private route: ActivatedRoute, private router: Router,
    private uploadService: UploadService,
    private brandCategoryApi: BrandCategoryApi,
    private settingApi: SettingApi,
    private _sanitizer: DomSanitizer,//f adjshfasdjhf
    private formBuilder: FormBuilder) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
    let subscription = this.uploadService.progress$.subscribe(
      value => {
        this.progressBar.push(value);
      }
    );
    this.getPictureUrl();
    this.brandCategoryApi.find({ limit: 10 }).subscribe(brands => {
      let array = [];
      brands.map(data => {
        array.push(data["name"]);
      })
      this.listCategorie = array;
    })
  }
  getAuto(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.brandCategoryApi.find({ "where": { "name": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(brands => {
      let array = [];
      brands.map(data => {
        array.push(data["name"]);
      })
      this.listCategorie = array;
    })
  }
  ngOnInit() {

    var me = this;
    this.sub = this.route.params.subscribe(params => {
      if (!params["id"]) {
        this.isCreateForm = true;
        this.brandData = this.getDataCreate();
        this.formBrand = this.formBuilder.group(this.validateForm(this.brandData));
        return $('.navbar-brand').text(`Brand Categorie - Create`);
      }
      this.id = params["id"];
      this.brandApi.findById(params["id"]).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This Brand does not exist",
            type: "error"
          },
            function () {
              me.router.navigate(['/brand']);
            });
          return;
        }
        this.brandData = res['data'];
        this.nameItemEdit = this.brandData.name;
        this.editForm();
        this.formBrand = this.formBuilder.group(this.validateForm(this.brandData));
        $('.navbar-brand').html(`Brand Edit - <em>${this.brandData.name}</em>`);
      });
    })
  }
  getPictureUrl() {
    this.settingApi.find({ where: { configName: "MEDIA_LINK" } }).subscribe(rs => {
      if (rs && rs.length) {
        let baseUrl = rs[0]['configValue'];
        baseUrl = baseUrl.replace('/_container_/_filename_', '');
        this.basePictureUrl = baseUrl;
      }
    });
  }
  editForm() {
    this.category = [];
    for (var i = 0; i < this.brandData.category.length; ++i) {
      // code...
      this.category.push(this.brandData.category[i].name);
    }
    this.imageSrc = this.basePictureUrl + "/" + this.brandData.picture.container + "/" + this.brandData.picture.name;
  }
  fileChange(event: EventTarget) {
    let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
    let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
    let files: FileList = target.files;
    // this.progressBar = [];
    this.file = files[0];
    this.fileName = this.file.name;
    var reader = new FileReader();
    reader.onload = this._handleReaderLoaded.bind(this);
    reader.readAsDataURL(this.file);
  }
  _handleReaderLoaded(e) {
    var reader = e.target;
    this.imageSrc = reader.result;
  }
  removeUpload() {
    $('#Picture').val("");
    if (this.isCreateForm) this.imageSrc = "";
    else {
      this.imageSrc = this.basePictureUrl + "/" + this.brandData.picture.container + "/" + this.brandData.picture.name;
    }
  }
  getDataCreate() {
    let data = new Brand();
    data.website = [''];
    data.category = [];
    data.picture = {};
    return data;
  }
  validateForm(brandCategory: Brand): {} {
    let editForm = {
      "name": [brandCategory.name, [Validators.required]],
      "description": [brandCategory.description],
      "affiliateNetwork": [brandCategory.affiliateNetwork],
      "website": [brandCategory.website],
      "category": [this.brandData.category]
    }
    return editForm;
  }
  reset(): void {
    if (this.isCreateForm) {
      this.brandData = this.getDataCreate();
    }
    else {
      // location.reload();
      this.brandApi.findById(this.id).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This Brand does not exist",
            type: "error"
          },
            function () {
              this.router.navigate(['/brand']);
            });
          return;
        }
        this.brandData = res['data'];
        this.nameItemEdit = this.brandData.name;
        this.editForm();
      })
    }

  }
  addWebsite() {
    this.brandData.website.push('');
  }
  removeWebsite() {
    if (this.brandData.website.length == 1) {
      return false;
    }
    this.brandData.website.pop();

  }
  getWebsite() {
    let allSite = $('input[name="website"]');
    let values = [];

    for (var i = 0; i < allSite.length; ++i) {
      if (allSite[i].value === '') {
        return null;
      }
      if (allSite[i].value.endsWith("universe.")) {
        swal("NOT GOOD")
      }
      values.push(allSite[i].value);
    }
    return values;
  }
  upload() {
    var website = this.getWebsite();
    if (!this.isCreateForm) {
      if (website != null && this.imageSrc && this.checkCategory()) {

        if (this.file) {
          let formData: FormData = new FormData();
          formData.append('ab', this.file, this.file.name);
          this.uploadService.upload(formData)
            .subscribe(rs => {
              this.brandData.picture.container = rs['data'][0].container;
              this.brandData.picture.name = rs['data'][0].name;
              this.brandData.category = [];
              this.getCategory().toPromise().then(() => {
                this.submitForm();
              })
              return;
            })
        }
        else {
          this.brandData.category = [];
          this.getCategory().toPromise().then(() => {
            this.submitForm();
          })
        }

      }
    }
    else
      if (website != null && this.file && this.imageSrc && this.checkCategory()) {
        let formData: FormData = new FormData();
        formData.append('ab', this.file, this.file.name);
        this.uploadService.upload(formData)
          .subscribe(rs => {
            this.brandData.picture.container = rs['data'][0].container;
            this.brandData.picture.name = rs['data'][0].name;
            this.brandData.category = [];

            this.getCategory().toPromise().then(() => {
              this.submitForm();
            })
          })
      }

  }
  checkCategory() {
    if (!this.category.length) {
      swal("", "Please required categories!", "warning");
      return false;
    }
    for (var i = 0; i < this.category.length; ++i) {
      // code...
      if (!this.category[i]) {
        return false;
      }
    }
    return true;
  }
  getCategory() {
    let orquery = [];
    let arrayQue = [];
    for (var index = 0; index < this.category.length; index++) {
      //  var element = array[index];
      arrayQue.push({
        name: this.category[index]
      })
    }
    return this.brandCategoryApi.find({ where: { or: arrayQue } }).map(ress => {
      let arr = [];
      ress.forEach(element => {
        arr.push({
          id: element["id"],
          name: element["name"]
        })
      });
      this.brandData.category = arr;
    })
  }
  submitForm(): void {
    var website = this.getWebsite();
    var me = this;
    if (!this.isCreateForm) {
      if (website != null && this.imageSrc) {
        this.brandData.website = website;
        this.brandApi.updateAttributes(this.brandData.id, this.brandData).subscribe(res => {

          if (res['error']) {
            if (res['error']['message'].toLowerCase().includes("website")) {
              return swal("Error", "Website has been duplicated!", "error");
            }
            else {
              let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
              msg += res['error']['message'];
              return swal("Error", msg, "error");
            }

          }
          swal({
            title: "Success",
            text: "Update ( " + this.brandData.name + " ) successfully!",
            type: "success"
          },
            function () {
              me.router.navigate(['brand/' + res['data'].id + '/detail']);
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
    else
      if (website != null && this.file && this.imageSrc) {
        this.brandData.website = website;

        this.brandApi.find({ where: { name: this.brandData.name } }).subscribe(ress => {
          if (ress.length == 0) {
            this.brandApi.create(this.brandData).subscribe(res => {

              if (res['error']) {
                if (res['error']['message'].toLowerCase().includes("website")) {
                  return swal("Error", "Website has been duplicated!", "error");
                }
                else {
                  let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                  msg += res['error']['message'];
                  return swal("Error", msg, "error");
                }

              }
              swal({
                title: "Success",
                text: "Created ( " + this.brandData.name + " ) successfully!",
                type: "success"
              },
                function () {
                  me.router.navigate(['brand/' + res['data'].id + '/detail']);
                });

            });

          }
          else {
            swal({
              title: "Error",
              text: "This name has been duplicated!",
              type: "error"
            })
          }

        })
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
}