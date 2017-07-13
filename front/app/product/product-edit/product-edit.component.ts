import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { LoopBackConfig, Product, ProductApi, SettingApi, BrandApi, UploadApi } from '../../shared/sdk';
import { API_VERSION, BASE_URL } from '../../shared/index';
import { UploadService } from "app/services/upload.service";
import { Observable } from "rxjs/Observable";
import { cjList, foLists, lsLists } from '../../sidebar/midList.metadata';
import { MidService } from '../../services/mid.service';
import { ListMasterBaseComponent } from '../../shared/listMaster.component';
import 'rxjs/add/operator/toPromise';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import 'rxjs/add/observable/of';

declare var $: any;
declare var swal: any;
// let Dropzone: any = require('../../../../node_modules/dropzone/dist/dropzone-amd-module');
let Dropzone: any = require('../../../../node_modules/dropzone/dist/dropzone');
// declare var Dropzone: any;


interface productBrand {
    id: string,
    name: string
}

@Component({
    selector: 'product-edit',
    templateUrl: 'product-edit.component.html',
    styleUrls: ['./product-edit.component.css']
})

export class ProductEditComponent implements OnInit {
    product: Product;
    id: string;
    title: string;
    productEditForm: FormGroup;
    listBrand: productBrand[];

    selectedBrand: productBrand;
    listBrands = [];

    file: File;
    imageSrc: string = '';
    fileName: string = '';
    progressBar: Array<number> = [];
    baseUrl: string;
    listMaster = ListMasterBaseComponent;
    affiliateNetWork: [string];
    myDropzone;
    constructor(private route: ActivatedRoute,
        private router: Router,
        private productApi: ProductApi,
        private fb: FormBuilder,
        private settingApi: SettingApi,
        private _sanitizer: DomSanitizer,
        private brandApi: BrandApi,
        private uploadApi: UploadApi,
        private uploadService: UploadService,
        private midService: MidService) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
        let subscription = this.uploadService.progress$.subscribe(
            value => {
                this.progressBar.push(value);
            }
        );
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.affiliateNetWork = ['CJ', 'LS', 'FO'];
            this.id = params['id'];
            if (typeof this.id !== 'undefined') {
                // Edit Form
                this.productApi.findById(this.id).subscribe(product => {
                    let productDetail = product['data'];
                    if (productDetail.pictures && productDetail.pictures.length)
                        productDetail['images'] = `${ListMasterBaseComponent.allSetting["MEDIA_LINK"]}/${productDetail['pictures'][0]['container']}/${productDetail['pictures'][0]['name']}`;
                    this.product = productDetail;
                    this.selectedBrand = productDetail.brand;
                    this.productEditForm = this.fb.group(this.configsValidateForm(productDetail));
                    this.title = productDetail.title;
                    $('.navbar-brand').text('Product Edit');
                })
            } else {
                // Create Form
                this.productEditForm = this.fb.group(this.configsValidateForm())
            }

        })

    }
    ngAfterViewChecked() {
        //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
        //Add 'implements AfterViewInit' to the class.
        var me = this;
        let lll = $("#editImageForm");
        if (lll[0] && !this.myDropzone) {
            Dropzone.options.myAwesomeDropzone = false;
            Dropzone.autoDiscover = false;
            this.myDropzone = new Dropzone("#editImageForm", {
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
                    this.on("error", function (file, message) {
                        swal(message);
                        this.removeFile(file);
                    });
                    this.on("sendingmultiple", function () {
                    });
                    this.on("successmultiple", function (files, response) {
                        me.product = me.productEditForm.value;
                        response["data"].forEach(element => {
                            me.product.pictures.push(element);
                        });
                        me.productApi.updateAttributes(me.id, me.product)
                            .subscribe(rs => {
                                if (rs["error"]) {
                                    return swal("Error...", rs["error"]["message"], "error");
                                }
                                return swal({
                                    title: "Success",
                                    text: "Update Success!",
                                    type: "success",
                                    showCancelButton: false,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Ok!"
                                }, function () {
                                    me.router.navigate(['product-detail/' + me.id]);

                                });
                            });
                    });
                }
            });
        }
    }
    editProduct(): void {
        let me = this;
        if (!this.myDropzone.getAcceptedFiles() || !this.myDropzone.getAcceptedFiles().length) {
            if (!this.productEditForm.value.pictures || !this.productEditForm.value.pictures.length) {
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
                this.product = this.productEditForm.value;
                if (this.product.brand.affiliateNetwork) {
                    this.product.brand = {
                        id: this.product.brand.id,
                        name: this.product.brand.name
                    }
                }
                this.productApi.updateAttributes(this.id, this.product)
                    .subscribe(rs => {
                        if (rs["error"]) {
                            return swal("Error...", rs["error"]["message"], "error");
                        }

                        return swal({
                            title: "Success",
                            text: "Update Success!",
                            type: "success",
                            showCancelButton: false,
                            confirmButtonText: "Ok!",
                            closeOnCancel: false
                        }, function () {
                            me.router.navigate(['product-detail/' + me.id]);
                        });

                    });
            }
        }
        else {

            this.myDropzone.processQueue();
        }

    }

    priceValidator(control: AbstractControl) {
        return /^\$?[0-9]+(\.[0-9][0-9]?)?$/.test(control.value) ? null : { urlValidator: true }
    }

    fileChange(event: EventTarget) {
        let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
        let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
        let files: FileList = target.files;
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

    configsValidateForm(productDetail?: Product): {} {
        let editForm = {
            "title": [(productDetail) ? productDetail.title : '', [Validators.required]],
            "description": [(productDetail) ? productDetail.description : '', [Validators.required]],
            "brand": [(productDetail) ? productDetail.brand : ''],
            "originalUrl": [(productDetail) ? productDetail.originalUrl : '', [Validators.required]],
            "affiliateNetwork": [(productDetail) ? productDetail.affiliateNetwork : '', [Validators.required]],
            "url": [(productDetail) ? productDetail.url : '', [Validators.required]],
            "price": [(productDetail) ? productDetail.price : '', Validators.compose([Validators.required, this.priceValidator])],
            "pictures": [(productDetail) ? productDetail.pictures : ''],
            "imgUrls": [(productDetail) ? productDetail.imageURLs : '']
        }
        return editForm;
    }

    getLink() {
        let productCheck = this.productEditForm.value;
        let website = '';
        let affiliateNetwork = productCheck.affiliateNetwork;
        let originalUrl;
        if (typeof productCheck.brand != 'undefined' && productCheck.brand !== '') {
            if (productCheck.brand.website)
                website = productCheck.brand.website[0];
            if (website !== '' && productCheck.affiliateNetWork !== '' && productCheck.originalUrl !== '') {
                originalUrl = productCheck.originalUrl;
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
                            return swal("Error...", rs.error.message, "error");
                        }
                        this.productEditForm.controls['url'].setValue(rs.data);
                        let imgUrl = this.product["images"].toLowerCase();
                        this.product = this.productEditForm.value;
                        this.product["images"] = imgUrl;
                    });
            }
            else {
                this.brandApi.findById(productCheck.brand.id).toPromise().then(res => {
                    website = res["data"]["website"][0];
                    if (website !== '' && productCheck.affiliateNetWork !== '' && productCheck.originalUrl !== '') {
                        originalUrl = productCheck.originalUrl;
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
                                    return swal("Error...", rs.error.message, "error");
                                }
                                this.productEditForm.controls['url'].setValue(rs.data);
                                let imgUrl = this.product["images"].toLowerCase();
                                this.product = this.productEditForm.value;
                                this.product["images"] = imgUrl;
                            });
                    }
                })
            }
        }
    }

    upload() {
        let formData: FormData = new FormData();
        formData.append('ab', this.file, this.file.name);
        this.uploadService.upload(formData)
            .subscribe(rs => {
                this.imageSrc = null;
                this.product['pictures'].push({
                    'container': rs['data'][0]['container'],
                    'name': rs['data'][0]['name']
                })
            })
    }

    removePicture(index: number) {
        this.product['pictures'].splice(index, 1);
        if (this.product['pictures'].length) {
            this.product['images'] = `${ListMasterBaseComponent.allSetting['MEDIA_LINK']}/${this.product['pictures'][0]['container']}/${this.product['pictures'][0]['name']}`;
        }
    }

    removeUpload() {
        this.imageSrc = null;
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


}