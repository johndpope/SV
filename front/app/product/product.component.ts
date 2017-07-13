import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoopBackConfig, Product, ProductApi, MemberApi, BrandApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
declare var $: any;
@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent extends ListMasterBaseComponent {
  productsList: {}[];
  pager: Array<number>;
  public titleTrue: string = `Product`;
  public navigator: string = "/products";
  listAffiliateNetwork = ["LS", "CJ", "FO"];
  listExclusive = ["Yes", "No"];
  memberList: any = [];
  brandList: any = [];
  creatorIdSearch;
  brandIdSearch;
  constructor(public api: ProductApi, public route: ActivatedRoute, public router: Router, private memberApi: MemberApi, private _sanitizer: DomSanitizer, private brandApi: BrandApi) {
    super();
  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit }).subscribe(data => {
      let baseUrl = ListMasterBaseComponent.allSetting["MEDIA_LINK"];
      let list = data.map((product) => {
        if (product['pictures'] && product['pictures'].length)
          product['pictures'] = `${baseUrl}/${product['pictures'][0]['container']}/${product['pictures'][0]['name']}`;
        else
          product['pictures'] = "";
        return product;
      })
      this.productsList = list;
      this.dataList = list;
      this.prevPage = this.page > 0;
      this.nextPage = false;
      this.isEmpty = false;
      if (this.dataList.length > this.limit) {
        this.nextPage = true;
        this.dataList.pop();
      }
      if (this.dataList.length === 0) {
        this.isEmpty = true;
      }
      this.updateBrand();
    })
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product-detail', productId]);
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

  autocompleListFormatterBrand = (data: any): SafeHtml => {
    let html = `<span>${data.name}</span>`;
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }

  onKeyBrand(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.brandApi.find({ "where": { "name": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(brands => this.brandList = brands)
  }

  observableSourceBrand(keyword: any) {
    let filteredList = this.brandList.filter(el => el['name'].indexOf(keyword) !== -1);
    return Observable.of(filteredList);
  }

  submitFilter() {
    let where = {};
    let control = new Array();
    control.push($("form").find($('input')));
    control.push($("form").find($('select')));
    for (var i = 0; i < control.length; i++) {
      for (var j = 0; j < control[i].length; j++) {

        if (control[i][j].value !== '') {
          where[control[i][j].id] = control[i][j].value;
        }
      }
    }
    if (this.creatorIdSearch) {
      where["creatorId"] = this.creatorIdSearch.id;
    }
    if (this.brandIdSearch) {
      where["brand.id"] = this.brandIdSearch.id;
    }
    this.navigateWithQueryParams(where);
  };
}
