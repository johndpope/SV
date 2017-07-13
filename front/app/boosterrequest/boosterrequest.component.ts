import { Component, NgModule } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, BoosterRequest, BoosterRequestApi, MemberApi, BoosterApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
declare var $: any;
declare var swal: any;

@Component({
  selector: 'app-boosterrequest',
  templateUrl: './boosterrequest.component.html',
  styleUrls: ['./boosterrequest.component.css']
})
export class BoosterrequestComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Booster Request`;
  public navigator: string = "/boosterrequest";
  private isEdit: boolean = false;
  detailData: any;
  memberList: any[] = [];
  searchToId: any;
  searchFromId: any;
  boosterKey: any;
  formBooster: any;
  status: string[] = ["new", "done"];
  constructor(public api: BoosterRequestApi, public route: ActivatedRoute, public router: Router, private _sanitizer: DomSanitizer, private memberApi: MemberApi, private boosterApi: BoosterApi, private formBuilder: FormBuilder) {
    super();
    this.boosterApi.find({ where: { or: [{ key: "booster_store_key" }, { key: "booster_hard_hat" }] } }).subscribe(value => {
      this.boosterKey = value;
    })
    this.formBooster = this.formBuilder.group(this.validateForm(new BoosterRequest));
  }
  inArray(array: any[], object) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] == object) return true;
    }
    return false;
  }
  loadList(params: {}): void {
    $('.loader').toggleClass("hide")
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));
    let listFormMember = [];
    let listToMember = [];
    let isFrom = false;
    let isTo = false;

    // this.prevPage = false;
    // this.nextPage = false;
    // this.isEmpty = true;
    // this.dataList = null;

    let requestManage = new Observable(observer => {
      if (!whereQuery["from"] && !whereQuery["to"]) {
        observer.complete();
      }
      if (whereQuery["from"]) {
        this.memberApi.find({ where: { email: { like: whereQuery['from'], options: "i" } } }).toPromise().then(res => {
          if (res.length > 0) {
            res.forEach(element => {
              listFormMember.push({ from: element["id"] });
            });
          }
          delete whereQuery['from'];
          isFrom = true;
          observer.next(res);
          if (!whereQuery["to"]) {
            observer.complete();
          }
        })
      }
      if (whereQuery["to"]) {
        this.memberApi.find({ where: { email: { like: whereQuery['to'], options: "i" } } }).toPromise().then(res => {
          if (res.length > 0) {
            res.forEach(element => {
              listToMember.push({ to: element["id"] });
            });
          }
          delete whereQuery['to'];
          isTo = true;
          observer.next(res);
          observer.complete();

        })
      }
    });
    requestManage.forEach(value => {
    }).then(() => {
      let finalOrQuery = [];
      if (listFormMember.length > 0 && listToMember.length > 0) {
        listFormMember.forEach(fromMem => {
          listToMember.forEach(toMem => {
            finalOrQuery.push({
              and: [
                fromMem,
                toMem
              ]
            })
          });
        });
        whereQuery = $.extend(whereQuery, { or: finalOrQuery });
      }
      else {
        if (listFormMember.length > 0) {
          let orQuery = { or: listFormMember };
          whereQuery = $.extend(whereQuery, orQuery);
        }
        else {
          if (isFrom) {
            this.prevPage = false;
            this.nextPage = false;
            this.isEmpty = true;
            this.dataList = null;
            $('.loader').toggleClass("hide")
            return;
          }
        }
        if (listToMember.length > 0) {
          let orQuery = { or: listToMember };
          whereQuery = $.extend(whereQuery, orQuery);
        }
        else {
          if (isTo) {
            this.prevPage = false;
            this.nextPage = false;
            this.isEmpty = true;
            this.dataList = null;
            $('.loader').toggleClass("hide")
            return;
          }
        }
      }
      this.api.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: this.order }).subscribe(data => {
        if (data.length > 0) {
          let listMemberId: string[] = [];
          data.forEach(boosterRe => {
            if (!this.inArray(listMemberId, boosterRe['from']))
              listMemberId.push(boosterRe['from']);
            if (!this.inArray(listMemberId, boosterRe['to']))
              listMemberId.push(boosterRe['to']);
          })
          let whereQuer: any[] = [];
          listMemberId.forEach(id => {
            let MemberId = {
              id: id
            };
            whereQuer.push(MemberId);
          })
          this.memberApi.find({ where: { or: whereQuer } }).subscribe(members => {
            data.forEach(boo => {
              members.forEach(mem => {
                if (boo["from"] == mem['id']) {
                  if (mem) {
                    boo["fromMember"] = mem;
                  }
                  else {
                    boo["fromMember"] = { email: boo["from"] };
                  }
                }
                if (boo["to"] == mem['id']) {
                  if (mem) {
                    boo["toMember"] = mem;
                  }
                  else {
                    boo["toMember"] = { email: boo["to"] };
                  }
                }
              });
              if (!boo["fromMember"]) {
                boo["fromMember"] = { email: boo["from"] };
              }
              if (!boo["toMember"]) {
                boo["toMember"] = { email: boo["to"] };
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

            this.isEmpty = true;
          }
        }
        else {
          this.dataList = data;

          this.isEmpty = true;
        }
        this.updateBrand();
        $('.loader').toggleClass("hide")
      })
    })

  }
  viewDetail(id: number): void {
    this.api.findById(id).subscribe(ress => {
      this.detailData = ress['data'];
      this.memberApi.findById(this.detailData['from']).subscribe(member => {
        if (member['data'])
          this.detailData['fromMember'] = member['data'];
        else
          this.detailData['fromMember'] = { email: this.detailData['from'] };
      })
      this.memberApi.findById(this.detailData['to']).subscribe(member => {
        if (member['data'])
          this.detailData['toMember'] = member['data'];
        else
          this.detailData['toMember'] = { email: this.detailData['to'] };

      })
    })
    $("#modal-detail").modal('show');
  }

  viewEdit(id: number): void {
    this.api.findById(id).subscribe(ress => {
      this.detailData = ress['data'];
      this.memberApi.findById(this.detailData['from']).subscribe(member => {
        if (member['data'])
          this.detailData['fromMember'] = member['data'];
        else
          this.detailData['fromMember'] = { email: this.detailData['from'] };
      })
      this.memberApi.findById(this.detailData['to']).subscribe(member => {
        if (member['data'])
          this.detailData['toMember'] = member['data'];
        else
          this.detailData['toMember'] = { email: this.detailData['to'] };

      })
    })
    $("#modal-edit").modal('show');
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
    if (param.toLowerCase().includes("from")) {
      return false;
    }
    if (param.toLowerCase().includes("to")) {
      return false;
    }
    if (param.toLowerCase() == "price") {
      return false;
    }
    if (typeof param === 'string') {
      return true;
    }

  }
  create(): void {
    $("#modal-create").modal('show');
  }
  submitForm(): void {
    if ((typeof this.formBooster.value.to) == "string" || (typeof this.formBooster.value.from) == "string") {
      swal("Error", "Email does not exist", "error");
      return;
    }
    else {
      this.formBooster.value.to = this.formBooster.value.to.id;
      this.formBooster.value.from = this.formBooster.value.from.id;
      this.api.create(this.formBooster.value).subscribe(ress => {
        if (ress['error']) {
          swal("Error", "Error : " + ress['error']['message'], "error");
          return;
        }
        else {
          swal("Success", "Create Complete", "success");
          $("#modal-create").modal('hide');
          this.formBooster = this.formBuilder.group(this.validateForm(new BoosterRequest));
          this.ngOnInit();
        }
      })
    }
  }
  validateForm(boosterRequest: BoosterRequest): {} {
    let editForm = {
      "from": [boosterRequest.from, [Validators.required]],
      "to": [boosterRequest.to],
      "status": [boosterRequest.status, [Validators.required]],
      "boosterKey": [boosterRequest.boosterKey, [Validators.required]],
    }
    return editForm;
  }
  update() {
    if ((typeof this.detailData.toMember) == "string" || (typeof this.detailData.fromMember) == "string") {
      swal("Error", "Email does not exist", "error");
      return;
    }
    else {
      this.detailData.from = this.detailData.fromMember.id;
      this.detailData.to = this.detailData.toMember.id;
      delete this.detailData.toMember;
      delete this.detailData.fromMember;
      this.api.updateAttributes(this.detailData.id, this.detailData).subscribe(ress => {
        if (ress['error']) {
          swal("Error", "Error : " + ress['error']['message'], "error");
          return;
        }
        else {
          swal("Success", "Update Complete", "success");
          $("#modal-edit").modal('hide');
          this.ngOnInit();
        }
      })
    }
  }
}
