import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Http } from '@angular/http';
import { LoopBackConfig, CashOutMoney, CashOutMoneyApi, MemberApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-cashoutmoney',
  templateUrl: './cashoutmoney.component.html',
  styleUrls: ['./cashoutmoney.component.css']
})
export class CashoutmoneyComponent extends ListMasterBaseComponent {
  public titleTrue: string = `CashOutMoney`;
  public navigator: string = "/cashoutmoney";
  public memberList: any;
  private ownerId;
  private listStatus = ['done', 'rejected', 'validated', 'under_validation', 'processing'];
  constructor(public api: CashOutMoneyApi, public route: ActivatedRoute, public router: Router, private memberApi: MemberApi, private _sanitizer: DomSanitizer) {
    super();
    this.memberApi.find({ limit: this.limit }).subscribe(members => {
      this.memberList = members;
    });

  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    if (whereQuery['ownerId']) {
      this.memberApi.find({ where: { email: { like: whereQuery['ownerId'] } } }).subscribe(res => {
        if (res) {
          let listOwnerId = [];
          let orQuery = null;
          res.forEach(element => {
            listOwnerId.push({ ownerId: element["id"] })
          });
          delete whereQuery['ownerId'];
          orQuery = { or: listOwnerId };
          whereQuery = $.extend(whereQuery, orQuery);
          this.updateDataList(whereQuery);
        }
        else {
          this.isEmpty = true;
        }
      })
    }
    else {
      this.updateDataList(whereQuery);
    }
  }
  updateDataList(whereQuery: any) {
    this.api.find({ "where": whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(castoutmoneys => {
      let listOwnerId = [];
      let andQuery = null;
      for (var index = 0; index < castoutmoneys.length; index++) {
        listOwnerId.push({ id: castoutmoneys[index]["ownerId"] })
      }
      andQuery = { or: listOwnerId };
      if (listOwnerId.length != 0)
        this.memberApi.find({ where: andQuery }).toPromise().then(members => {
          castoutmoneys.forEach(element => {
            var memfind = members.filter(function (mem) {
              if (mem['id'] == element['ownerId'])
                return mem;
            })
            element["memberDetail"] = (memfind) ? memfind[0] : { email: element["ownerId"] };
          });
        })

      let list = castoutmoneys.forEach((cashoutmoney) => {
        cashoutmoney['operation'] = this.getOperationForCashoutmoney(cashoutmoney['status']);
        return cashoutmoney;
      })
      this.dataList = castoutmoneys;
      this.prevPage = this.page > 0;
      this.nextPage = false;
      this.isEmpty = false;
      if (castoutmoneys.length > this.limit) {
        this.nextPage = true;
        castoutmoneys.pop();
      }
      this.dataList = castoutmoneys;
      if (this.dataList.length === 0) {
        this.isEmpty = true;
      }
      this.updateBrand();
    });
  }

  getOperationForCashoutmoney(status: string): any {
    let functionList = [];
    switch (status) {
      case "processing": {
        functionList.push("Approve");
        functionList.push("Approve & Payout");
        functionList.push("Decline");
        functionList.push("Complete");
      }; break;
      case "under_validation": {
        functionList.push("Approve");
        functionList.push("Approve & Payout");
        functionList.push("Decline");
        functionList.push("Complete");
      }; break;
      case "validated": {
        functionList.push("Payout");
        functionList.push("Decline");
        functionList.push("Complete");
      }; break;
      case "rejected": {
        functionList.push("Approve");
        functionList.push("Complete");
      }; break;
    }
    return functionList;
  }

  updateOperation(method: string, id: string) {
    this.api.findById(id).subscribe(ress => {
      if (ress['error']) {
        let msg = ress['error']['name'] ? ress['error']['name'] + ": " : "";
        msg += ress['error']['message'];
        return swal("Error", msg, "error");
      }
      let CashOutMoneyData = ress['data'];
      switch (method) {
        case "Approve": {
          CashOutMoneyData.status = 'validated';
        }; break;
        case "Decline": {
          CashOutMoneyData.status = 'rejected';
        }; break;
        case "Approve & Payout": {
          CashOutMoneyData.status = 'payout';
        }; break;
        case "Payout": {
          CashOutMoneyData.status = 'payout';
        }; break;
        case "Complete": {
          CashOutMoneyData.status = 'done';
        }; break;
      }
      delete CashOutMoneyData.id;
      delete CashOutMoneyData.modified;
      this.api.updateAttributes(id, CashOutMoneyData).subscribe(res => {
        if (res['error']) {
          let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
          msg += res['error']['message'];
          return swal("Error", msg, "error");
        }
        swal("Success", 'Update Success!', "success");
        this.ngOnInit();
      })
    })
  }

  autocompleListFormatter = (data: any): SafeHtml => {
    let html = `<span>${data.email}</span>`;
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }

  onKey(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.memberApi.find({ "where": { "email": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(members => this.memberList = members)
  }

  observableSource(keyword: any) {
    let filteredList = this.memberList.filter(el => el['email'].indexOf(keyword) !== -1);
    return Observable.of(filteredList);
  }

  myCallback(event: any) {
    this.ownerId = (event.id);
  }
}
