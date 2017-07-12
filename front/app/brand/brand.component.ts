import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, Brand, BrandApi, SettingApi, BrandCategoryApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-brand',
  templateUrl: './brand.component.html',
  // styleUrls: ['./mission.component.css']
})
export class BrandComponent extends ListMasterBaseComponent {
  // private missionTypeList:any;
  public titleTrue: string = `Brand List`;
  public navigator: string = "/brand";
  private listCategorie: string[];
  arrayOfCategorie = [];
  CategorieSearch = [];
  constructor(public api: BrandApi,
    private brandCategoryApi: BrandCategoryApi,
    public route: ActivatedRoute,
    public router: Router,
    private _sanitizer: DomSanitizer) {
    super();
    this.brandCategoryApi.find({ limit: 10 }).subscribe(brands => {
      let array = [];
      brands.map(data => {
        array.push(data["name"]);
      })
      this.listCategorie = array;

    });
  }

  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let orQuery = null;
    let andQuery = null;

    if (this.where['category.name']) {
      let listCategory = this.where['category.name'].split(',');
      let array = [];
      for (var i = 0; i < listCategory.length; ++i) {
        // code...
        let ll = {
          "category.name": {
            "like": listCategory[i],
            "options": "i"
          }
        };
        array.push(ll);
      }
      andQuery = { and: array };
      delete this.where['category.name'];
      this.where = $.extend(andQuery, this.where);
      this.arrayOfCategorie = listCategory;
    }
    delete this.where['category.name'];
    let whereQuery = $.extend({}, this.where);

    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));

    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
      data.map((brand) => {
        if (brand['picture'])
          brand['picture'] = `${ListMasterBaseComponent.allSetting.MEDIA_LINK}/${brand['picture']['container']}/${brand['picture']['name']}`;
        else
          brand['picture'] = "";
        return brand;
      });
      this.dataList = data;
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
  getAuto(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.brandCategoryApi.find({ "where": { "name": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(brands => {
      let array = [];
      brands.map(data => {
        array.push(data["name"]);
      })
      this.listCategorie = array;
    })
  }
  observableSource(keyword: any) {
    let filteredList = this.listCategorie.filter(el => el['name'].indexOf(keyword) !== -1);
    return Observable.of(filteredList);
  }
  submitFilter() {
    let where = {};
    if ($('#name').val())
      where["name"] = $('#name').val();
    where["category.name"] = this.arrayOfCategorie;
    this.navigateWithQueryParams(where);
  };
}
