import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {LoopBackConfig, VersionApp, VersionAppApi, BoosterApi} from '../../shared/sdk';
import { API_VERSION, BASE_URL } from '../../shared/index';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
declare var $:any;
declare var swal:any;
@Component({
  selector: 'versionapp-form',
  templateUrl: 'versionapp-edit.component.html',
  styleUrls: ['./versionapp-edit.component.css']
})
export class VersionAppEditComponent implements OnInit, OnDestroy {
  private sub: any;
  public id: string;
  public versionData: any;
  public formVersion: any;
  public isCreateForm: boolean = false;
  constructor(private versionAppApi: VersionAppApi, private route:ActivatedRoute, private router:Router, private formBuilder:FormBuilder) { 
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }
  ngOnInit() {
    var me = this;
    this.sub = this.route.params.subscribe(params => {
      if (!params["id"]) {
        this.isCreateForm = true;
        this.versionData = new VersionApp();
        this.versionData.description = "";
        this.versionData.releaseDate = new Date().toISOString().slice(0,10);
        this.formVersion = this.formBuilder.group(this.validateForm(this.versionData));
        return $('.navbar-brand').text(`Version App - Create`);
      }

      this.id = params["id"];
      this.versionAppApi.findById(params["id"]).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This version app does not exist",
            type: "error"
          },
          function(){
            me.router.navigate(['versionapps']);
          });
          return;
        }

        this.versionData = res['data'];
        this.versionData.releaseDate = this.versionData.releaseDate.slice(0,10);
        this.formVersion = this.formBuilder.group(this.validateForm(this.versionData));
        $('.navbar-brand').html(`Version App Edit - <em>${this.versionData.title}</em>`);
      });
      $('.navbar-brand').text(`Version App Edit`);
    })
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  validateForm(version: VersionApp): {} {
    let editForm = {
      "title": [version.title, [Validators.required, Validators.minLength(3)]],
      "description": [version.description],
      "releaseDate": [version.releaseDate, Validators.compose([Validators.required, Validators.pattern(/^\d{4}-((0\d)|(1[012]))-(([012]\d)|3[01])$/)])],
      "platform": [version.platform, [Validators.required]],
      "version": [version.version, [Validators.required]],
      "build": [version.build],
      "url": [version.url, Validators.compose([Validators.required, Validators.pattern(/^(https?):\/\/[^\s/$.?#].[^\s]*$/)])],
    }
    return editForm;
  }

  submitForm(): void {
    var me = this;
    if (this.isCreateForm) {
      this.versionAppApi.create(this.formVersion.value).subscribe(res => {
        if (res['error']) {
          let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
          msg += res['error']['message'];
          return swal("Error", msg, "error");
        }

        swal({
          title: "Success",
          text: "Created (" + this.formVersion.value.title + ") successfully!",
          type: "success"
        },
        function(){
          me.router.navigate(['versionapps']);
        });
      });
      return ;
    }
    this.versionAppApi.updateAttributes(this.id, this.formVersion.value).subscribe(res => {
      if (res['error']) {
        let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
        msg += res['error']['message'];
        return swal("Error", msg, "error");
      }
      swal("Success", "Updated successfully!", "success");
    });
  }
}
