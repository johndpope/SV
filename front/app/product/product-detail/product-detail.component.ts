import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {LoopBackConfig, Product, ProductApi, SettingApi} from '../../shared/sdk';
import {API_VERSION, BASE_URL} from '../../shared/index';
declare var $:any;
@Component({
    selector: 'product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
    product: {};
    id: string;
    baseUrl: string;
    constructor(private route:ActivatedRoute, private productApi: ProductApi,private settingApi: SettingApi) {
        LoopBackConfig.setBaseURL(BASE_URL);
        LoopBackConfig.setApiVersion(API_VERSION);
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.id = params['id']; 
            this.settingApi.find({where: {configName: "MEDIA_LINK"}}).subscribe(rs => {
                if(rs && rs.length) {
                    this.baseUrl = rs[0]['configValue'];
                    this.baseUrl = this.baseUrl.replace('/_container_/_filename_', '');
                    this.productApi.findById(this.id).subscribe(product => {
                        let productDetail = product['data'];
                        if(productDetail.pictures && productDetail.pictures.length)
                            productDetail.pictures = `${this.baseUrl}/${productDetail['pictures'][0]['container']}/${productDetail['pictures'][0]['name']}`;
                        this.product = productDetail;
                        $('.navbar-brand').text('Product Detail');
                    })
                }
            })
        })
    }
}