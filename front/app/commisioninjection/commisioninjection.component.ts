import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Http } from '@angular/http';
import { LoopBackConfig, CommissionInjectionApi, CommissionInjection, MemberApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

declare var $: any;
declare var swal: any;

@Component({
  selector: 'app-commisioninjection',
  templateUrl: './commisioninjection.component.html',
  styleUrls: ['./commisioninjection.component.css']
})
export class CommisioninjectionComponent extends ListMasterBaseComponent {
  ownerId;
  memberList = [];
  public titleTrue: string = `Commision Injection`;
  public navigator: string = "/injection";
  private listStatus = ['done', 'rejected', 'validated', 'under_validation', 'processing'];
  constructor(public api: CommissionInjectionApi, public route: ActivatedRoute, public router: Router, private memberApi: MemberApi, private _sanitizer: DomSanitizer) {
    super();
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
        if (res.length > 0) {
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
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
          this.dataList = null;
          return;
        }
      })
    }
    else {
      this.updateDataList(whereQuery);
    }
  }
  updateDataList(whereQuery) {
    this.api.find({ "where": whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(injections => {
      if (injections.length > 0) {
        let listOwnerId = [];
        let andQuery = null;
        for (var index = 0; index < injections.length; index++) {
          listOwnerId.push({ id: injections[index]["ownerId"] })
        }
        andQuery = { or: listOwnerId };
        this.memberApi.find({ where: andQuery }).toPromise().then(members => {
          injections.forEach(element => {
            var memfind = members.filter(function (mem) {
              if (mem['id'] == element['ownerId'])
                return mem;
            })
            element["memberDetail"] = (memfind) ? memfind[0] : { email: element["ownerId"] };
          });
        })
        this.dataList = injections;
        this.prevPage = this.page > 0;
        this.nextPage = false;
        this.isEmpty = false;
        if (injections.length > this.limit) {
          this.nextPage = true;
          injections.pop();
        }
        this.dataList = injections;
        if (this.dataList.length === 0) {
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
          this.dataList = null;
        }
      }
      else {
        this.prevPage = false;
        this.nextPage = false;
        this.isEmpty = true;
        this.dataList = null;
      }
      this.updateBrand();
    });
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
