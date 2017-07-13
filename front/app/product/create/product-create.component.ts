import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, ProductApi, BrandApi, LoopBackAuth, SettingApi } from '../../shared/sdk/index';
import { API_VERSION, BASE_URL } from '../../shared';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { UploadService } from "app/services/upload.service";
import { Product } from "app/shared/sdk/models";
import { MidService } from "app/services/mid.service";
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import 'rxjs/add/operator/toPromise';
import { } from 'dropzone';

// let Dropzone = require('../../../../node_modules/dropzone/dist/dropzone-amd-module');
declare var $: any;
declare var swal: any;
let Dropzone: any = require('../../../../node_modules/dropzone/dist/dropzone-amd-module');
@Component({
    selector: 'product-create',
    templateUrl: './product-create.component.html'
})
export class ProductCreateComponent implements OnInit {
    form: FormGroup;
    listBrands: {}[];
    affiliateNetWork: [string];
    file: File;
    imageSrc: string = '';
    fileName: string = '';
    progressBar: Array<number> = [];
    product: Product = new Product();
    baseUrl: string;
    myDropzone;
    constructor(private productApi: ProductApi,
        @Inject(FormBuilder) fb: FormBuilder,
        private _sanitizer: DomSanitizer,
        private uploadService: UploadService,
        private brandApi: BrandApi,
        private router: Router,
        private _authService: LoopBackAuth,
        private midService: MidService,
        private settingApi: SettingApi) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
        $('.navbar-brand').html(`Product Create`);
        this.affiliateNetWork = ['CJ', 'LS', 'FO'];
        let subscription = this.uploadService.progress$.subscribe(
            value => {
                this.progressBar.push(value);
            }
        );
        this.baseUrl = ListMasterBaseComponent.allSetting["MEDIA_LINK"];
        this.form = fb.group({
            creatorId: [this._authService.getCurrentUserId()],
            title: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(2000)]],
            brand: ['', Validators.required],
            originalUrl: ['', Validators.compose([Validators.required, this.urlValidator])],
            affiliateNetWork: ['', Validators.required],
            url: ['', Validators.compose([Validators.required, this.urlValidator])],
            price: ['', Validators.required],
            pictures: [[]]
        })

    }

    ngAfterViewInit() {
        //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
        //Add 'implements AfterViewInit' to the class.
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
            maxFiles: 10,
            maxFilesize: 8,
            parallelUploads: 10000,
            headers: { "Authorization": localStorage.getItem('accessToken') },
            init: function () {
                this.on('sending', function (file, xhr, formData) {
                });
                this.on("sendingmultiple", function () {
                    // Gets triggered when the form is actually being sent.
                    // Hide the success button or the complete form.
                });
                this.on("successmultiple", function (files, response) {
                    // Gets triggered when the form is actually being sent.
                    // Hide the success button or the complete form.
                    let datasend: Product = new Product();
                    datasend.affiliateNetwork = me.form.value.affiliateNetWork;
                    datasend.brand = {
                        "id": me.form.value.brand.id,
                        "name": me.form.value.brand.name
                    };
                    datasend.creatorId = me.form.value.creatorId;
                    datasend.description = me.form.value.description;
                    datasend.originalUrl = me.form.value.originalUrl;
                    datasend.pictures = response['data'];
                    datasend.price = me.form.value.price;
                    datasend.title = me.form.value.title;
                    datasend.url = me.form.value.url;
                    me.createNew(datasend);
                });
            }
        });
    }

    createNew(data: Product) {
        this.productApi.create(data).subscribe(rs => {
            if (rs["data"] == null && typeof rs["error"] !== 'undefined') {
                return swal("Error...", rs["error"]["message"], "error");
            }
            swal({
                title: "Success",
                text: "Add product successfully",
                timer: 2000,
                showConfirmButton: false
            });
            this.router.navigate(["/product-detail/" + rs["data"]["id"]]);
        })
    }

    urlValidator(control: AbstractControl) {
        return /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(control.value) ? null : { urlValidator: true }
    }

    getLink() {
        let website = '';
        let affiliateNetwork;
        let originalUrl;
        if (typeof this.form.value.brand != 'undefined' && this.form.value.brand !== '' && typeof this.form.value.brand.website !== 'undefined') {
            website = this.form.value.brand.website[0];
        }
        if (website !== '' && this.form.value.affiliateNetWork !== '' && this.form.value.originalUrl !== '') {
            affiliateNetwork = this.form.value.affiliateNetWork, originalUrl = this.form.value.originalUrl;
            let mid;
            if (affiliateNetwork.toLowerCase() == 'ls') {
                mid = this.midService.getLS(website);
            } else {
                if (affiliateNetwork.toLowerCase() == 'cj') {
                    mid = this.midService.getCJ(website);
                } else {
                    mid = this.midService.getFO(website)
                }
            }
            this.productApi.trackingURL(originalUrl, affiliateNetwork, mid)
                .subscribe(rs => {
                    if (rs.data == null && typeof rs.error !== 'undefined') {
                        swal("Error...", rs.error.message, "error");
                    }
                    this.form.controls['url'].setValue(rs.data);
                });
        }
        this.product = this.form.value;
    }

    ngOnInit() {
        this.brandApi.find({ limit: 10 }).subscribe(brands => this.listBrands = brands)
    }

    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.name}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    }

    onKey(event: any) {
        let value = event.target.value;
        let regex = value + ".*";
        this.brandApi.find({ "where": { "name": { "like": regex, "options": "i" } }, limit: 10 }).subscribe(brands => this.listBrands = brands)
    }

    observableSource(keyword: any) {
        let filteredList = this.listBrands.filter(el => el['name'].indexOf(keyword) !== -1);
        return Observable.of(filteredList);
    }

    fileChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
        this.progressBar = [];
        this.file = files[0];
        this.fileName = this.file.name;
        var reader = new FileReader();
        reader.onload = this._handleReaderLoaded.bind(this);
        reader.readAsDataURL(this.file);
    }

    _handleReaderLoaded(e) {
        var reader = e.target;
        this.imageSrc = reader.result;
    }

    create(): void {
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
        this.myDropzone.processQueue();
    }

    upload() {
        let formData: FormData = new FormData();
        formData.append('ab', this.file, this.file.name);
        this.uploadService.upload(formData)
            .subscribe(rs => {
                this.imageSrc = null;
                let pictures = this.form.controls['pictures'].value;
                if (!pictures.length) {
                    pictures = [];
                }
                pictures.push({
                    'container': rs['data'][0]['container'],
                    'name': rs['data'][0]['name']
                })
                this.form.controls['pictures'].setValue(pictures);
            })
    }
}