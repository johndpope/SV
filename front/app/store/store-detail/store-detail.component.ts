import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, StoreApi, Store, LoopBackAuth, MemberApi } from '../../shared/sdk/index';
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
  selector: 'app-store-detail',
  templateUrl: './store-detail.component.html',
  styleUrls: ['./store-detail.component.css']
})
export class StoreDetailComponent extends ListMasterBaseComponent {
  private storeData: Store;
  constructor(
    private authenService: LoopBackAuth,
    private formBuilder: FormBuilder,
    public api: StoreApi,
    public memberApi: MemberApi,
    public route: ActivatedRoute,
    public router: Router,
  ) {
    super();
  }


  ngOnInit() {
    let me = this;
    this.sub = this.route.params.subscribe(params => {
      if (typeof params['id'] != 'undefined') {
        this.api.findById(params["id"]).subscribe(res => {
          if (!res['data']) {
            swal({
              title: "Not found",
              text: "This store does not exist",
              type: "error"
            },
              function () {
                me.router.navigate(['store']);
              });
            return;
          }
          this.storeData = res['data'];
          this.memberApi.findById(this.storeData.ownerId).toPromise().then(members => {
            this.storeData["memberDetail"] = (members["data"]) ? members["data"] : { email: this.storeData["ownerId"] };
          })
          if (this.storeData.name) {
            this.titleTrue = `Member Detail - <em>${this.storeData.name}</em>`;
          }
          else {
            this.titleTrue = `Member Detail - <em>${this.storeData.id}</em>`;
          }
          this.updateBrand();
        });
      }
      else {
        this.router.navigate(['store']);
      }
    });
  }

}
