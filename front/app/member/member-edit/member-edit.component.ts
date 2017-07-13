import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../../shared/base.url';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DaterangepickerConfig, Daterangepicker } from 'ng2-daterangepicker';
declare var $: any;
declare var swal: any;
let Dropzone: any = require('../../../../node_modules/dropzone/dist/dropzone-amd-module');

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent extends ListMasterBaseComponent {
  public titleTrue: string = `Member Create`;
  listMemberType: any[] = ["User", "Admin", "Merchant"];
  public isCreateForm: boolean = false;
  memberData: Member;
  formMember: FormGroup;
  myDropzone;
  id;
  constructor(
    public api: MemberApi,
    private formBuilder: FormBuilder,
    public route: ActivatedRoute,
    public router: Router,
    private daterangepickerOptions: DaterangepickerConfig,
    private _sanitizer: DomSanitizer
  ) {
    super();
    this.daterangepickerOptions.settings = {
      locale: { format: 'YYYY/MM/DD' },
      singleDatePicker: true,
      "showDropdowns": true,
    };


  }
  setup() {
    Dropzone.options.myAwesomeDropzone = false;
    Dropzone.autoDiscover = false;
    var myDropzone;
    var me = this;
    this.myDropzone = myDropzone = new Dropzone("#PostForm", {
      url: LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
      "/Uploads/upload",
      addRemoveLinks: true,
      autoProcessQueue: false,
      uploadMultiple: true,
      acceptedFiles: "image/*",
      maxFiles: 1,
      maxFilesize: 8,
      parallelUploads: 1,
      headers: { "Authorization": localStorage.getItem('accessToken') },
      init: function () {
        this.on("maxfilesexceeded", function (file) {
          swal("Warning", "Just one file for Picture", "warning");
          this.removeFile(file);
        });
        this.on('sending', function (file, xhr, formData) {
        });
        this.on("sendingmultiple", function () {
          // Gets triggered when the form is actually being sent.
          // Hide the success button or the complete form.
        });
        this.on("successmultiple", function (files, response) {
          if (response['error']) {
            let msg = response['error']['name'] ? response['error']['name'] + ": " : "";
            msg += response['error']['message'];
            return swal("Error", msg, "error");
          }
          let dataSend = new Member();
          dataSend.type = me.formMember.value["type"];
          dataSend.firstName = me.formMember.value["firstName"];
          dataSend.lastName = me.formMember.value["lastName"];
          dataSend.fullName = me.formMember.value["fullName"];
          dataSend.email = me.formMember.value["email"];
          dataSend.gender = me.formMember.value["gender"];
          dataSend.dateOfBirth = me.formMember.value["dateOfBirth"];
          dataSend.picture = response["data"][0];



          if (me.isCreateForm) {
            dataSend.password = me.formMember.value["password"];

            me.api.create(dataSend).subscribe(res => {
              if (res['error']) {
                let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                msg += res['error']['message'];
                return swal("Error", msg, "error");
              }
              res["data"]["budget"] = me.formMember.value["budget"];
              let updateData = res["data"];
              me.api.createBudgets(res["data"]["id"], { income: me.formMember.value["budget"], note: "Create" }).subscribe(ress => {
                if (res['error']) {
                  let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                  msg += res['error']['message'];
                  return swal("Error", msg, "error");
                }
                swal({
                  title: "Success",
                  text: "Create successfully!",
                  type: "success"
                },
                  function () {
                    me.router.navigate(['member/' + res['data'].id]);
                  });
              })
            })
          }
          else {
            me.api.updateAttributes(me.memberData.id, dataSend).subscribe(res => {
              if (res['error']) {
                let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                msg += res['error']['message'];
                return swal("Error", msg, "error");
              }

              if (!(res["data"]["budget"] == me.formMember.value["budget"])) {
                res["data"]["budget"] = me.formMember.value["budget"];
                let dataUpdate = (me.memberData.budget > me.formMember.value["budget"]) ? { expense: (me.memberData.budget - me.formMember.value["budget"]) } : { income: (me.formMember.value["budget"] - me.memberData.budget) }
                me.api.createBudgets(res["data"]["id"], dataUpdate).subscribe(ress => {
                  swal({
                    title: "Success",
                    text: "Update successfully!",
                    type: "success"
                  },
                    function () {
                      me.router.navigate(['member/' + res['data'].id]);
                    });
                })
              }
              else {
                swal({
                  title: "Success",
                  text: "Update successfully!",
                  type: "success"
                },
                  function () {
                    me.router.navigate(['member/' + res['data'].id]);
                  });
              }

            })
          }
        });
      }
    });
  }
  ngAfterViewChecked() {
    //Called after every check of the component's view. Applies to components only.
    //Add 'implements AfterViewChecked' to the class.
    var me = this;
    let lll = $("#PostForm");
    if (lll[0] && !this.myDropzone) {
      this.setup();
    }
    $('.selectControl').selectpicker();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      if (!params["id"]) {
        this.isCreateForm = true;
        this.memberData = new Member();
        this.memberData.budget = 1;
        this.memberData.type = [];
        this.formMember = this.formBuilder.group(this.validateForm(this.memberData));
        return this.updateBrand();
      }
      this.id = params["id"];
      this.api.findById(params["id"]).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This Member does not exist",
            type: "error"
          },
            function () {
              this.router.navigate(['/member']);
            });
          return;
        }
        this.isCreateForm = false;
        this.memberData = res['data'];
        if (this.memberData.picture)
          this.memberData["avatar"] = `${ListMasterBaseComponent.allSetting["MEDIA_LINK"]}/${this.memberData.picture.container}/${this.memberData.picture.name}`;
        this.formMember = this.formBuilder.group(this.validateForm(this.memberData));
        $('.navbar-brand').html(`Member Edit - <em>${this.memberData.fullName}</em>`);
      });
    })
  }
  validateForm(member: Member): {} {
    let editForm = {
      "type": [member.type, [Validators.required]],
      "firstName": [member.firstName],
      "lastName": [member.lastName],
      "fullName": [member.fullName],
      "email": [member.email, [Validators.required]],
      "budget": [member.budget],
      "gender": [member.gender],
      "dateOfBirth": [member.dateOfBirth]
    }
    if (this.isCreateForm) {
      editForm["password"] = [member.password, [Validators.required]]
    }
    return editForm;
  }
  checkInputNumber(evt: any): boolean {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;

  }
  submitForm() {
    let me = this;
    if ($("#formEditMember").valid()) {
      if (this.isCreateForm) {
        if (!this.myDropzone.getAcceptedFiles() || !this.myDropzone.getAcceptedFiles().length) {
          return swal({
            title: "Alert",
            text: "Please fill in all the fields with an asterisk",
            type: "warning",
            showCancelButton: false,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Ok!",
            closeOnConfirm: false,
            closeOnCancel: false
          });
        }
        else {
          this.myDropzone.processQueue();
        }
      }
      else {
        if (this.myDropzone.getAcceptedFiles() && this.myDropzone.getAcceptedFiles().length > 0) {
          this.myDropzone.processQueue();
        }
        else {
          let dataSend = new Member();
          dataSend.type = this.formMember.value["type"];
          dataSend.firstName = this.formMember.value["firstName"];
          dataSend.lastName = this.formMember.value["lastName"];
          dataSend.fullName = this.formMember.value["fullName"];
          dataSend.email = this.formMember.value["email"];
          dataSend.gender = this.formMember.value["gender"];
          dataSend.dateOfBirth = this.formMember.value["dateOfBirth"];
          this.api.updateAttributes(this.memberData.id, dataSend).subscribe(res => {
            if (res['error']) {
              let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
              msg += res['error']['message'];
              return swal("Error", msg, "error");
            }

            if (!(res["data"]["budget"] == this.formMember.value["budget"])) {
              res["data"]["budget"] = this.formMember.value["budget"];
              let dataUpdate = (this.memberData.budget > this.formMember.value["budget"]) ? { expense: (this.memberData.budget - this.formMember.value["budget"]) } : { income: (this.formMember.value["budget"] - this.memberData.budget) }
              this.api.createBudgets(res["data"]["id"], dataUpdate).subscribe(ress => {
                swal({
                  title: "Success",
                  text: "Update successfully!",
                  type: "success"
                },
                  function () {
                    me.router.navigate(['member/' + res['data'].id]);
                  });
              })
            }
            else {
              swal({
                title: "Success",
                text: "Update successfully!",
                type: "success"
              },
                function () {
                  me.router.navigate(['member/' + res['data'].id]);
                });
            }

          })
        }
      }

    }
  }

  singleSelect(event) {
    this.formMember.controls["dateOfBirth"].setValue(new Date(event.start._d));
  }
  reset() {
    if (this.isCreateForm) {
      $('.selectpicker').selectpicker('deselectAll');
      this.myDropzone.removeAllFiles();
      this.formMember.reset();
    }
    else {
      this.api.findById(this.id).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This Member does not exist",
            type: "error"
          },
            function () {
              this.router.navigate(['/member']);
            });
          return;
        }
        this.memberData = res['data'];
        if (this.memberData.picture)
          this.memberData["avatar"] = `${ListMasterBaseComponent.allSetting["MEDIA_LINK"]}/${this.memberData.picture.container}/${this.memberData.picture.name}`;
        this.formMember.reset(this.memberData);
        $('.navbar-brand').html(`Member Edit - <em>${this.memberData.fullName}</em>`);
      });
    }
  }
}
