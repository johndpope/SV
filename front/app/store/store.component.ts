import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoopBackConfig, StoreApi, MemberApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
declare var $: any;

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Store`;
  public navigator: string = "/store";
  memberList: any = [];
  constructor(public api: StoreApi, public route: ActivatedRoute, public router: Router, private _sanitizer: DomSanitizer, private memberApi: MemberApi) {
    super();
  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    if (whereQuery["email"]) {
      this.memberApi.find({ "where": { "email": { "like": whereQuery["email"]["like"], "options": "i" } }, limit: 10 }).subscribe(members => {
        delete whereQuery["email"];
        if (members.length > 0) {
          let listOwnerId = [];
          let orQuery = null;
          for (var index = 0; index < members.length; index++) {
            listOwnerId.push({ ownerId: members[index]["id"] })
          }
          orQuery = { or: listOwnerId };
          let andQuery = { and: [orQuery, whereQuery] }
          this.findStore(andQuery);
        }
        else {
          this.dataList = null;
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
        }
      })
    }
    else {
      this.findStore(whereQuery)
    }

  }
  findStore(whereQuery) {
    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
      if (data.length > 0) {
        let listOwnerId = [];
        let orQuery = null;
        for (var index = 0; index < data.length; index++) {
          listOwnerId.push({ id: data[index]["ownerId"] })
        }
        orQuery = { or: listOwnerId };
        this.memberApi.find({ where: orQuery }).toPromise().then(members => {
          data.forEach(element => {
            var memfind = members.filter(function (mem) {
              if (mem['id'] == element['ownerId'])
                return mem;
            })
            element["memberDetail"] = (memfind.length > 0) ? memfind[0] : { email: element["ownerId"] };
          });
        })
        this.dataList = data;
        this.prevPage = this.page > 0;
        this.nextPage = false;
        this.isEmpty = false;
        if (this.dataList.length > this.limit) {
          this.nextPage = true;
          this.dataList.pop();
        }
        if (this.dataList.length === 0) {
          this.dataList = null;
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
        }
        this.updateBrand();
      }
      else {
        this.dataList = null;
        this.prevPage = false;
        this.nextPage = false;
        this.isEmpty = true;
      }
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
}
