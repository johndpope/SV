import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, MemberApi, Member, LoopBackAuth } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../../shared/base.url';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
declare var $: any;
declare var swal: any;

@Component({
  selector: 'app-your-profile-changepassword',
  templateUrl: './your-profile-changepassword.component.html',
  styleUrls: ['./your-profile-changepassword.component.css']
})
export class YourProfileChangepasswordComponent implements OnInit {
  @Output() onSave = new EventEmitter<boolean>();
  formChangePassword: FormGroup;
  constructor(
    private authenService: LoopBackAuth,
    private formBuilder: FormBuilder,
    public api: MemberApi,
    public route: ActivatedRoute,
    public router: Router,
  ) {
    this.formChangePassword = formBuilder.group({
      "currentPassword": ["", Validators.required],
      "newPassword": ["", Validators.required],
      "repeatPassword": ["", Validators.required],
    }, { validator: this.checkIfMatchingPasswords('newPassword', 'repeatPassword') });
  }

  ngOnInit() {
  }
  changePassword() {
    let currentUser = this.authenService.getCurrentUserData();
    currentUser.password = this.formChangePassword.value.newPassword;
    this.api.secureUpdate({ password: this.formChangePassword.value.currentPassword, updatedData: currentUser }).subscribe(res => {
      if (!res['data']) {
        return swal("Error", res.error.message, "error");
      }
      this.formChangePassword.reset();
      this.onSave.emit(true);
      return swal("Success", "Change Password Complete!", "success");
    })
  }
  checkIfMatchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (group: FormGroup) => {
      let passwordInput = group.controls[passwordKey],
        passwordConfirmationInput = group.controls[passwordConfirmationKey];
      if (passwordInput.value !== passwordConfirmationInput.value) {
        return passwordConfirmationInput.setErrors({ notEquivalent: true })
      }
      else {
        return passwordConfirmationInput.setErrors(null);
      }
    }
  }
}
