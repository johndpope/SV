import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member, MemberBooster, MemberBoosterApi, BoosterApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
declare var $: any;
declare var swal: any;
@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.css']
})
export class MemberComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Member List`;
  public navigator: string = "/member";
  listMemberType: any[] = ["User", "Admin", "Merchant"];
  memberList = [];
  memberData: Member;
  listBoosterKeys: any;
  private formAddBudget: FormGroup;
  private formAddBooster: FormGroup;
  constructor(
    public api: MemberApi,
    private formBuilder: FormBuilder,
    private memberBoosterApi: MemberBoosterApi,
    private boosterApi: BoosterApi,
    public route: ActivatedRoute,
    public router: Router,
    private _sanitizer: DomSanitizer
  ) {
    super();
    this.formAddBudget = this.formBuilder.group({
      "Value": ["", Validators.required],
      "note": [, Validators.required],
      "type": [, Validators.required]
    });
    this.formAddBooster = this.formBuilder.group({
      "boosterKey": ["", Validators.required],
      "number": ["", Validators.required]
    });
    this.boosterApi.getBoosterKeys().subscribe(res => {
      this.listBoosterKeys = res["data"];
    })
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
    if (param.toLowerCase() == "type") {
      return false;
    }
    if (typeof param === 'string') {
      return true;
    }

  }
  autocompleListFormatter = (data: any): SafeHtml => {
    let html = `<span>${data.email}</span>`;
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }

  onKey(event: any) {
    let value = event.target.value;
    let regex = value + ".*";
    this.api.find({ "where": { "email": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(members => this.memberList = members)
  }

  observableSource(keyword: any) {
    let filteredList = this.memberList.filter(el => el['email'].indexOf(keyword) !== -1);
    return Observable.of(filteredList);
  }


  addBudget(member: Member) {
    this.memberData = member;
    $("#modalAddBudget").modal('show');
  }
  updateBudget() {
    let dataSend = this.formAddBudget.value;
    switch (dataSend.type) {
      case "1": {
        dataSend.income = dataSend.Value;
        delete dataSend.type;
        delete dataSend.Value;
        break;
      }
      case "2": {
        dataSend.expense = dataSend.Value;
        delete dataSend.type;
        delete dataSend.Value;
        break;
      }

      default:
        break;
    }
    this.api.createBudgets(this.memberData.id, dataSend).subscribe(res => {
      if (res['error']) {
        let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
        msg += res['error']['message'];
        return swal("Error", msg, "error");
      }
      swal({
        title: "Success",
        text: "Update complete!",
        type: "success"
      });
      $('#modalAddBudget').modal('hide');
      this.ngOnInit();
    })
  }
  addBootster(member: Member) {
    this.memberData = member;
    this.memberBoosterApi.find({ where: { memberId: member.id } }).subscribe(res => {
      this.memberData["memberBoosters"] = res;
    })
    $("#modalAddBootster").modal('show');
  }
  updateBootster() {
    let dataSend: MemberBooster = this.formAddBooster.value;
    dataSend.memberId = this.memberData.id;
    dataSend["playerId"] = dataSend.memberId;
    this.memberBoosterApi.updateMemberBooster(dataSend).subscribe(ress => {
      if (ress['error']) {
        let msg = ress['error']['name'] ? ress['error']['name'] + ": " : "";
        msg += ress['error']['message'];
        return swal("Error", msg, "error");
      }
      swal({
        title: "Success",
        text: "Update complete!",
        type: "success"
      });
      $('#modalAddBootster').modal('hide');
    })
  }
  checkInputNumber(evt: any): boolean {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;

  }
}
