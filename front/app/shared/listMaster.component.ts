import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, SettingApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
declare var $: any;
declare var swal: any;
export abstract class ListMasterBaseComponent implements OnInit, OnDestroy {
  public sub: any;
  public api: any;
  public limit: number = 20;
  public dataList: {}[];
  public page: number = 0;
  public nextPage: boolean = false;
  public prevPage: boolean = false;
  public isEmpty: boolean = false;
  public where: {};
  public route: ActivatedRoute;
  public router: Router;
  public titleTrue: string = `Custom List - <em>Page ${this.page + 1}</em>`;
  public navigator: string;
  public order: string = "modified DESC";
  public settingApi: SettingApi;
  public static allSetting: any;
  constructor() {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }
  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {

      if (typeof params['page'] != 'undefined')
        this.page = +params['page'];
      this.loadList(params);
      this.updateBrand();
    })
  }
  getParamForQuery(params: {}): any {
    var queryParam = $.extend({}, this.where);

    for (var k in params) {
      if (this.validForParam(k) && this.validForParam(params[k])) {
        queryParam[k] = {
          "like": params[k],
          "options": "i"
        }
      }
    }
    return queryParam;
  }
  validForParam(param: any): boolean {
    if (typeof param === 'function') {
      return false;
    }
    if (typeof param === 'undefined') {
      return false;
    }
    if (typeof param === 'object') {
      return false;
    }
    if (param.toLowerCase().includes("date")) {
      return false;
    }
    if (param.toLowerCase().includes("id")) {
      return false;
    }
    if (param.toLowerCase() == "price") {
      return false;
    }
    if (typeof param === 'string') {
      return true;
    }

  }
  updateBrand() {
    if (this.prevPage || this.nextPage) {
      let name = `${this.titleTrue} - <em>Page ${this.page + 1}</em>`;
      $('.navbar-brand').html(name);
    }
    else {
      $('.navbar-brand').html(`${this.titleTrue}`);
    }
  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
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

  deleteItem(assetId: string, assetName: string, indexRow: number): void {
    var me = this;
    swal({
      title: "Are you sure?",
      text: "Do you really want to delete this item ( " + assetName + " )?\n This process can not be undone!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      closeOnConfirm: false,
      closeOnCancel: false
    },
      function (isConfirm) {
        if (isConfirm) {
          me.api.deleteById(assetId).subscribe(response => {
            if (response['error']) {
              let msg = response['error']['name'] ? response['error']['name'] + ": " : "";
              msg += response['error']['message'];
              return swal("Error", msg, "error");
            }
            me.dataList.splice(indexRow, 1);
            swal({
              title: "Deleted!",
              text: "The Asset (" + assetName + ") has been deleted.",
              timer: 1500,
              showConfirmButton: false,
              type: "success"
            });
            me.route.queryParams.subscribe(params => {
              if (typeof params['page'] != 'undefined')
                me.page = +params['page'];
              me.loadList(params);
            })
          })
        } else {
          swal.close();
        }
      });
  }

  submitFilter() {
    let where = {};
    let control = new Array();
    control.push($("form#filter").find($('input')));
    control.push($("form#filter").find($('select')));
    for (var i = 0; i < control.length; i++) {
      for (var j = 0; j < control[i].length; j++) {

        if (control[i][j].value !== '') {
          where[control[i][j].id] = control[i][j].value;
        }
      }
    }
    this.navigateWithQueryParams(where);
  };
  navigateWithQueryParams(param: any, page = null) {
    this.page = (page) ? page : 0;
    this.router.navigate([this.navigator], { queryParams: param });
  }
  prevPageClick() {
    if (!this.prevPage) {
      return;
    }
    this.where['page'] = this.page - 1;
    this.navigateWithQueryParams(this.where);
  }

  nextPageClick() {
    if (!this.nextPage) {
      return;
    }
    this.where['page'] = this.page + 1;
    this.navigateWithQueryParams(this.where);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getAllSetting() {
    let me = this;
    let allSetting = {};
    this.settingApi.find().subscribe(ress => {
      var allCu = {};
      ress.forEach(value => {
        if (value['configName'] === "MEDIA_LINK") {
          let baseUrl = value['configValue'];
          baseUrl = baseUrl.replace('/_container_/_filename_', '');
          allSetting[value['configName']] = baseUrl;
          allCu[value['configName']] = baseUrl;
        }
        else {
          allSetting[value['configName']] = value['configValue'];
          allCu[value['configName']] = value['configValue'];
        }
      })
      ListMasterBaseComponent.allSetting = allCu;
    }, function (error) {
      localStorage.removeItem("accessToken");
      me.router.navigate(['lock']);
    });

    return allSetting;
  }
}
