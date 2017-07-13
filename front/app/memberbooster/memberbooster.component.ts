import { Component } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberBooster, MemberBoosterApi, MemberApi, BoosterApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-memberbooster',
  templateUrl: './memberbooster.component.html',
  styleUrls: ['./memberbooster.component.css']
})
export class MemberboosterComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Member Boosters`;
  public navigator: string = "/memberbooster";
  public order: string = "id ASC";
  listBoosterKeys: any;
  memberIdFilter;
  memberList: any[] = [];
  detailData: any;
  constructor(public api: MemberBoosterApi, public route: ActivatedRoute, public router: Router, private _sanitizer: DomSanitizer, private memberApi: MemberApi, private boosterApi: BoosterApi) {
    super();
    this.boosterApi.getBoosterKeys().subscribe(data => {
      this.listBoosterKeys = data["data"];
    })

  }
  loadList(params: {}): void {
    $('.loader').toggleClass("hide")
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    whereQuery = $.extend(whereQuery, this.getParamForQuery(this.where));

    if (whereQuery['memberId']) {
      this.memberApi.find({ where: { email: { like: whereQuery['memberId'] } } }).subscribe(res => {
        if (res.length > 0) {
          let listOwnerId = [];
          let orQuery = null;
          res.forEach(element => {
            listOwnerId.push({ memberId: element["id"] })
          });
          delete whereQuery['memberId'];
          orQuery = { or: listOwnerId };
          whereQuery = $.extend(whereQuery, orQuery);
          this.updateDataList(whereQuery);
        }
        else {
          this.prevPage = false;
          this.nextPage = false;
          this.isEmpty = true;
          this.dataList = null;
          $('.loader').toggleClass("hide")
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
        let listMemberId: string[] = [];
        data.forEach(memberbo => {
          listMemberId.push(memberbo['memberId']);
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
              if (boo["memberId"] == mem['id']) {
                if (mem) {
                  boo["memberDetail"] = mem;
                }
                else {
                  boo["memberDetail"] = { email: boo["memberId"] };
                }
              }
            });
            if (!boo["memberDetail"]) {
              boo["memberDetail"] = { email: boo["memberId"] };
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
        this.updateBrand();
        $('.loader').toggleClass("hide")
      }
      else {
        this.prevPage = false;
        this.nextPage = false;
        this.isEmpty = true;
        this.dataList = null;
        $('.loader').toggleClass("hide")
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
  myCallback(event: any) {
    this.memberIdFilter = (event.id);
  }
  showEdit(id: number) {
    this.api.findById(id).subscribe(ress => {
      if (ress['error']) {
        swal({
          title: "Not found",
          text: "This member booster does not exist",
          type: "error"
        },
          function () {

          });
        return;
      }
      this.detailData = ress['data'];
      this.memberApi.findById(this.detailData.memberId).subscribe(res => {
        if (res['data'])
          this.detailData.memberDetail = res['data'];
        else
          this.detailData.memberDetail = { email: this.detailData.memberId };

      })
    })
    $("#modal-id").modal('show');
  }
  checkInputNumber(evt: any): boolean {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;

  }

  updateMemberBooster() {
    this.api.updateAttributes(this.detailData.id, this.detailData).subscribe(ress => {

      if (ress['error']) {
        swal({
          title: "Error",
          text: "Something wrong here",
          type: "error"
        },
          function () {

          });
        return;
      }
      swal("Success", "Update Complete", 'success')
      $("#modal-id").modal('hide');
      this.ngOnInit();

    })
  }

}
