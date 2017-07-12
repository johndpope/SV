import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member, LoopBackAuth } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../../shared/base.url';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent extends ListMasterBaseComponent {
  private memberData: Member;
  private formAddBudget: FormGroup;
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
    let me=this;
    this.sub = this.route.params.subscribe(params => {
      if (typeof params['id'] != 'undefined') {
        this.api.findById(params["id"]).subscribe(res => {
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
          this.titleTrue = `Member Detail - <em>${this.memberData.email}</em>`;
          this.formAddBudget = this.formBuilder.group({
            "Value": ["", Validators.required],
            "note": [,Validators.required],
            "type": [, Validators.required]
          })
          this.updateBrand();

        });
      }
      else {
        this.router.navigate(['member']);
      }
    });
  }
  updateBudget() {
    let dataSend = this.formAddBudget.value;
    switch (dataSend.type) {
      case "1": {
        dataSend.income = dataSend.Value;
        delete dataSend.type;
        delete dataSend.Value;
        break;
      }
      case "2": {
        dataSend.expense = dataSend.Value;
        delete dataSend.type;
        delete dataSend.Value;
        break;
      }

      default:
        break;
    }
    this.api.createBudgets(this.memberData.id, dataSend).subscribe(res => {
      if (res['error']) {
        let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
        msg += res['error']['message'];
        return swal("Error", msg, "error");
      }
      swal({
        title: "Success",
        text: "Update complete!",
        type: "success"
      });
      $('#modal-id').modal('hide');
      this.ngOnInit();
    })
  }

}
