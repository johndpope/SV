import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, CashOutMoney, CashOutMoneyApi, MemberApi } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../../shared/base.url';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-cashoutmoney-detail',
  templateUrl: './cashoutmoney-detail.component.html',
  styleUrls: ['./cashoutmoney-detail.component.css']
})
export class CashoutmoneyDetailComponent extends ListMasterBaseComponent {
  cashoutmoneyData: any;
  constructor(public api: CashOutMoneyApi, public route: ActivatedRoute, public router: Router, private memberApi: MemberApi) {
    super();
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }
  ngOnInit() {

    this.sub = this.route.params.subscribe(params => {
      if (typeof params['id'] != 'undefined') {
        this.api.findById(params["id"]).subscribe(res => {
          if (!res['data']) {
            swal({
              title: "Not found",
              text: "This Cashoutmoney does not exist",
              type: "error"
            },
              function () {
                this.router.navigate(['cashoutmoney']);
              });
            return;
          }
          this.cashoutmoneyData = res['data'];

          this.memberApi.findById(this.cashoutmoneyData["ownerId"]).subscribe(Member => {
            if (Member["data"] != undefined && Member["data"] != null) {
              this.cashoutmoneyData["memberDetail"] = Member["data"];
            }
            else {
              this.cashoutmoneyData["memberDetail"] = { email: this.cashoutmoneyData["ownerId"] };
            }

          });



          $('.navbar-brand').html(`CashOutMoney Detail - <em>${this.cashoutmoneyData.id}</em>`);
        });
      }
      else {
        this.router.navigate(['cashoutmoney']);
      }


    });

  }

}
