import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../../shared/base.url';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-member-confirmpasswordrecovery',
  templateUrl: './member-confirmpasswordrecovery.component.html',
  styleUrls: ['./member-confirmpasswordrecovery.component.css']
})
export class MemberConfirmpasswordrecoveryComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Member Confirm password recovery`;
  public navigator: string = "/member";
  private memberData: Member;
  private formConfirmpassword: FormGroup;
  constructor(
    public api: MemberApi,
    private formBuilder: FormBuilder,
    public route: ActivatedRoute,
    public router: Router,
    private _sanitizer: DomSanitizer
  ) {
    super();
  }

  ngOnInit() {
    let me = this;
    this.sub = this.route.params.subscribe(params => {
      if (typeof params['user-id'] != 'undefined') {
        this.api.findById(params["user-id"]).subscribe(res => {
          if (!res['data']) {
            swal({
              title: "Not found",
              text: "This member does not exist",
              type: "error"
            },
              function () {
                me.router.navigate(['member']);
              });
            return;
          }
          this.memberData = res['data'];
          if (this.memberData.picture) {

            this.memberData["avatar"] = `${ListMasterBaseComponent.allSetting["MEDIA_LINK"]}/${this.memberData.picture.container}/${this.memberData.picture.name}`;
          }
          this.titleTrue = `Member Confirm password recovery - <em>${this.memberData.email}</em>`;
          this.updateBrand();
          this.formConfirmpassword = this.formBuilder.group({
            "pwdRecoveryToken": ["", Validators.required],
            "password": ["", Validators.required],
            "passwordConfirm": ["", [Validators.required]]
          })
        });
      }
      else {
        this.router.navigate(['member']);
      }
    });
  }
  submitForm() {
    if (this.formConfirmpassword.controls["password"].value != this.formConfirmpassword.controls["passwordConfirm"].value) {
      swal("Error!", "Password not match!", "warning");
    }
    else {
      let dataSend = this.formConfirmpassword.value;
      dataSend.uid = this.memberData.id;
      let me = this;
      this.api.confirmPasswordRecovery(dataSend).subscribe(res => {
        if (res["error"]) {
          swal({
            title: res["error"]["message"],
            text: "",
            type: "error"
          });
          return;
        }
        swal({
          title: "Success",
          text: "",
          type: "success"
        }, function () {
          me.router.navigate(['member']);
        });
      })

    }
  }

}
