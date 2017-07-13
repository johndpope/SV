import { Component } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, Safebox, SafeboxApi, StoreApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-safebox',
  templateUrl: './safebox.component.html',
  styleUrls: ['./safebox.component.css']
})
export class SafeboxComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Safebox`;
  public navigator: string = "/safebox";
  storeList: any;
  storeFilterId: any;
  safeType: Array<string> = ["Copper", "Silver", "Gold"];
  safeStatus: Array<string> = ["Collectable time", "Collectable", "Ongoing timer", "Ongoing counter", "Choice", "Choice lock"];
  constructor(public api: SafeboxApi, public route: ActivatedRoute, public router: Router, private _sanitizer: DomSanitizer, private storeApi: StoreApi) {
    super();
    this.storeApi.find({ limit: 10 }).subscribe(stores => {
      this.storeList = stores;
    });
  }


  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    if (whereQuery["safeStatus"]) {
      whereQuery["safeStatus"]= whereQuery["safeStatus"]["like"].toLowerCase().split(" ").join('_');
    }
    if (whereQuery['storeId']) {
      this.storeApi.find({ where: { name: { like: whereQuery['storeId'] } } }).subscribe(res => {
        if (res) {
          let listStoreId = [];
          let orQuery = null;
          res.forEach(element => {
            listStoreId.push({ storeId: element["id"] })
          });
          delete whereQuery['storeId'];
          orQuery = { or: listStoreId };
          whereQuery = $.extend(whereQuery, orQuery);
          this.updateDataList(whereQuery);
        }
        else {
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
          this.dataList = null;
        }
      })
    }
    else {
      this.updateDataList(whereQuery);
    }
  }

  updateDataList(whereQuery) {
    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
      if (data.length > 0) {
        let listStoreId: string[] = [];
        data.forEach(memberbo => {
          listStoreId.push(memberbo['storeId']);
        })
        let whereQuer: any[] = [];
        listStoreId.forEach(id => {
          let StoreId = {
            id: id
          };
          whereQuer.push(StoreId);
        })
        this.storeApi.find({ where: { or: whereQuer } }).subscribe(stores => {
          data.forEach(boo => {
            stores.forEach(mem => {
              if (boo["storeId"] == mem['id']) {
                if (mem) {
                  boo["storeDetail"] = mem;
                }
                else {
                  boo["storeDetail"] = { name: boo["storeId"] };
                }
              }
            });
            if (!boo["storeDetail"]) {
              boo["storeDetail"] = { name: boo["storeId"] };
            }
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
    })
  }


  autocompleListFormatter = (data: any): SafeHtml => {
    let html = `<span>${data.name}</span>`;
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }

  onKey(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.storeApi.find({ "where": { "name": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(members => this.storeList = members)
  }

  observableSource(keyword: any) {
    let filteredList = this.storeList.filter(el => el['name'].indexOf(keyword) !== -1);
    return Observable.of(filteredList);
  }
  myCallback(event: any) {
    this.storeFilterId = (event.id);
  }

}
