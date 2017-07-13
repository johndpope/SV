import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member, LoopBackAuth, AccessToken } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-your-profile',
  templateUrl: './your-profile.component.html',
  styleUrls: ['./your-profile.component.css']
})
export class YourProfileComponent extends ListMasterBaseComponent {
  private memberData: Member;
  private viewDetail: boolean = true;
  constructor(
    private authenService: LoopBackAuth,
    private formBuilder: FormBuilder,
    public api: MemberApi,
    public route: ActivatedRoute,
    public router: Router,
  ) {
    super();
  }

  ngOnInit() {
    let me = this;
    this.sub = this.api.findById(this.authenService.getCurrentUserId()).subscribe(res => {
      if (!this.authenService.getCurrentUserId()) {
        return swal({
          title: "Not found your id!",
          text: "You should loggin again!",
          type: "error"
        },
          function () {
            me.router.navigate(['/']);
          });
      }
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
      this.titleTrue = `Your Profile - <em>${this.memberData.email}</em>`;
      this.updateBrand();

    });
  }
  onSave(event: any) {
    if (event) {
      this.ngOnInit();
    }
  }

}
