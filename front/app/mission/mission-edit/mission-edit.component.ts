import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { LoopBackConfig, Mission, MissionApi } from '../../shared/sdk';
import { API_VERSION, BASE_STORAGE_URL, BASE_URL } from '../../shared/index';
declare var $: any;
declare var swal: any;

@Component({
  selector: 'app-mission-edit',
  templateUrl: 'mission-edit.component.html',
  styleUrls: ['./mission-edit.component.css']
})

export class MissionEditComponent implements OnInit {
  private sub: any;
  public id: string;
  public missionData: any;
  public formMission: any;
  public isCreateForm: boolean = false;
  private missionTypeList: any;
  private nameItemEdit: any;
  constructor(private missionApi: MissionApi, private route: ActivatedRoute, private router: Router, private formBuilder: FormBuilder) {
    LoopBackConfig.setBaseURL(BASE_URL);
    LoopBackConfig.setApiVersion(API_VERSION);
  }

  ngOnInit() {
    var me = this;
    this.loadMissionType();
    this.sub = this.route.params.subscribe(params => {
      if (!params["id"]) {
        this.isCreateForm = true;
        this.missionData = new Mission();
        this.missionData.criteria = [{}];
        this.missionData.powerUp = [{}];
        this.formMission = this.formBuilder.group(this.validateForm(this.missionData));
        return $('.navbar-brand').text(`Mission - Create`);
      }
      this.id = params["id"];
      this.missionApi.findById(params["id"]).subscribe(res => {
        if (!res['data']) {
          swal({
            title: "Not found",
            text: "This mission does not exist",
            type: "error"
          },
            function () {
              me.router.navigate(['/missions']);
            });
          return;
        }
        this.missionData = res['data'];
        this.setMissionPowerUpToObjectArray();
        this.nameItemEdit = this.missionData.name;
        this.formMission = this.formBuilder.group(this.validateForm(this.missionData));
        $('.navbar-brand').html(`Mission Edit - <em>${this.missionData.name}</em>`);
      });
    })
  }
  setMissionPowerUpToObjectArray() {
    for (var i = 0; i < this.missionData.powerUp.length; i++) {
      if (typeof this.missionData.powerUp[i] == "object") break;
      this.missionData.powerUp[i] = { value: this.missionData.powerUp[i] };
    }
  }
  setMissionPowerUpToStringArray() {
    var valuePowerUp = [];
    for (var i = 0; i < this.missionData.powerUp.length; ++i) {
      if (typeof this.missionData.powerUp[i] == "string") break;
      valuePowerUp.push(this.missionData.powerUp[i].value);
    }
    this.missionData.powerUp = valuePowerUp;
  }
  loadMissionType(): void {
    this.missionApi.find({ fields: ["type"] }).subscribe(data => {
      var uniqueNames = [];
      $.each(data, function (i, el) {
        if ($.inArray(el.type, uniqueNames) === -1) uniqueNames.push(el.type);
      });
      this.missionTypeList = uniqueNames;
      if (this.isCreateForm)
        this.missionData.type = this.missionTypeList[0];
    });
  }
  subscribePowerUp(powers: any): any {
    console.log(powers);
    for (var i = 0; i < powers.length; i++) {
    }
    return powers;
  }

  validateForm(mission: Mission): {} {
    let editForm = {
      "name": [mission.name, [Validators.required]],
      "type": [mission.type],
      "rewards": [mission.rewards]
    }
    return editForm;
  }


  addCriteria(): void {
    this.missionData.criteria.push({});
  }

  removeCriteria(): void {
    if (this.missionData.criteria.length > 1)
      this.missionData.criteria.pop();
  }

  addPowerUp(): void {
    this.missionData.powerUp.push({});
  }

  removePowerUp(): void {
    if (this.missionData.powerUp.length > 1)
      this.missionData.powerUp.pop();
  }
  checkInputNumber(evt: any): boolean {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;

  }
  checkMissionCriteria(): boolean {
    var Criteria = this.missionData.criteria;
    for (var i = 0; i < Criteria.length; ++i) {
      if (!Criteria[i].action || !Criteria[i].actionName || !Criteria[i].number) {
        return false;
      }
    }
    return true;
  }

  checkMissionPowerUp(): boolean {
    var powerUp = this.missionData.powerUp;

    for (var i = 0; i < powerUp.length; ++i) {
      if (typeof powerUp[i] == "string") {
        return true;
      }
      if (!powerUp[i].value) {
        return false;
      }
    }
    return true;
  }
  reset(): void {
    if (this.isCreateForm) {
      this.missionData = new Mission();
      this.missionData.type = this.missionTypeList[0];
      this.missionData.criteria = [{}];
      this.missionData.powerUp = [{}];
    }
    else {
      this.missionApi.findById(this.id).subscribe(res => {
        for (var i = 0; i < res['data'].powerUp.length; i++) {
          res['data'].powerUp[i] = { value: res['data'].powerUp[i] };
        }
        this.missionData = res['data'];
      });
    }

  }
  submitForm(): void {
    var me = this;
    this.setMissionPowerUpToStringArray();
    if (this.checkMissionCriteria() && this.checkMissionPowerUp()) {

      if (me.isCreateForm) {
        this.missionApi.find({ where: { name: this.missionData.name } }).subscribe(ress => {
          if (ress.length == 0) {
            this.missionApi.create(this.missionData).subscribe(res => {
              if (res['error']) {
                let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
                msg += res['error']['message'];
                return swal("Error", msg, "error");
              }
              swal({
                title: "Success",
                text: "Created ( " + this.missionData.name + " ) successfully!",
                type: "success"
              },
                function () {
                  me.router.navigate(['missions/' + res['data'].id + '/detail']);
                });
            });
          }
          else {
            this.setMissionPowerUpToObjectArray();
            swal({
              title: "Error",
              text: "This name has been duplicated!",
              type: "error"
            })
          }
        })

        return;
      }
      this.missionApi.find({ where: { name: this.missionData.name } }).subscribe(ress => {
        if (!(this.missionData.name == this.nameItemEdit) && ress.length == 0) {
          this.missionApi.updateAttributes(this.id, this.missionData).subscribe(res => {
            if (res['error']) {
              let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
              msg += res['error']['message'];
              return swal("Error", msg, "error");
            }
            swal({
              title: "Success",
              text: "Updated successfully!",
              type: "success"
            },
              function () {
                me.router.navigate(['missions/' + res['data'].id + '/detail']);
              });
          });
        }
        if (this.missionData.name == this.nameItemEdit) {
          this.missionApi.updateAttributes(this.id, this.missionData).subscribe(res => {
            if (res['error']) {
              let msg = res['error']['name'] ? res['error']['name'] + ": " : "";
              msg += res['error']['message'];
              return swal("Error", msg, "error");
            }
            swal({
              title: "Success",
              text: "Updated successfully!",
              type: "success"
            },
              function () {
                me.router.navigate(['missions/' + res['data'].id + '/detail']);
              });
          });
        }
        else {
          this.setMissionPowerUpToObjectArray();
          swal({
            title: "Error",
            text: "This name has been duplicated!",
            type: "error"
          })
        }
      })
    }
    else {
      swal({
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
  }
}