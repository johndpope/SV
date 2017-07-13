import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { LoopBackConfig, Order, OrderApi, MemberApi, PurchasePackage, PurchasePackageApi } from '../shared/sdk/index';
import { API_VERSION, BASE_URL, BASE_STORAGE_URL } from '../shared/base.url';
import { ListMasterBaseComponent } from '../shared/listMaster.component';
declare var $: any;
@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent extends ListMasterBaseComponent {
  purchasePackageList: any;
  public titleTrue: string = `Order List`;
  public navigator: string = "/orders";
  public order: string = "created DESC";
  ordersList: {}[];
  constructor(public orderApi: OrderApi, public memberApi: MemberApi, public purchasePackageApi: PurchasePackageApi, public route: ActivatedRoute, public router: Router) {
    super();
  }
  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {
      if (typeof params['page'] != 'undefined')
        this.page = +params['page'];
      this.loadList(params);
      this.loadPurchasePackageList();
      $('.navbar-brand').text(`Order List`);
      if (this.prevPage || this.nextPage) {
        $('.navbar-brand').html(`Order List - <em>Page ${this.page + 1}</em>`);
      }
    })
  }
  loadPurchasePackageList(): void {
    this.purchasePackageApi.find({ order: "created ASC" }).subscribe(purchasePackages => {
      this.purchasePackageList = purchasePackages;
    })
  }
  loadList(params: {}): void {
    this.where = $.extend({}, params);
    if (this.where['page']) {
      delete this.where['page'];
    }
    let whereQuery = $.extend({}, this.where);
    if (params['transactionId']) {
      whereQuery['transactionId'] = {
        "like": params['transactionId'],
        "options": "i"
      }
    }
    if (params['platform']) {
      whereQuery['platform'] = {
        "like": params['platform'],
        "options": "i"
      }
    }
    if (params['purchasePackageLogId']) {
      delete whereQuery['purchasePackageLogId'];
      whereQuery['purchasePackageId'] = {
        like: params['purchasePackageLogId'],
        "options": "i"
      }
    }
    if (params['email']) {
      whereQuery['email'] = {
        "like": params['email'],
        "options": "i"
      }
    }
    if (whereQuery['email']) {
      this.memberApi.find({ "where": { "email": whereQuery['email'] }, limit: 1, order: "created DESC" }).subscribe(members => {
        delete whereQuery['email'];
        let list = members.map((member) => {
          whereQuery['memberId'] = {
            "like": member['id'],
            "options": "i"
          }
          this.orderApi.find({ where: whereQuery, limit: (this.limit + 1), offset: this.page * this.limit }).subscribe(orders => {
            let danhsachOrders = orders.map((order) => {
              order["memberDetail"] = member;
              return order;
            })
            this.ordersList = danhsachOrders;
            this.prevPage = this.page > 0;
            this.nextPage = false;
            this.isEmpty = false;
            if (danhsachOrders.length > this.limit) {
              this.nextPage = true;
              danhsachOrders.pop();
            }
            if (this.ordersList.length === 0) {
              this.isEmpty = true;
            }

            if (this.prevPage || this.nextPage) {
              $('.navbar-brand').html(`Order List - <em>Page ${this.page + 1}</em>`);
            }
          })
        })
      });
    }
    else {
      this.orderApi.find({ "where": whereQuery, limit: (this.limit + 1), offset: this.page * this.limit, order: "created DESC" }).subscribe(orders => {
        let listOwnerId = [];
        let andQuery = null;
        for (var index = 0; index < orders.length; index++) {
          listOwnerId.push({ id: orders[index]["memberId"] })
        }
        andQuery = { or: listOwnerId };
        this.memberApi.find({ where: andQuery }).toPromise().then(members => {
          orders.forEach(element => {
            var memfind = members.filter(function (mem) {
              if (mem['id'] == element['memberId'])
                return mem;
            })
            element["memberDetail"] = (memfind) ? memfind[0] : { email: element["memberId"] };
          });
        })
        this.ordersList = orders;
        this.prevPage = this.page > 0;
        this.nextPage = false;
        this.isEmpty = false;
        if (orders.length > this.limit) {
          this.nextPage = true;
          orders.pop();
        }
        this.ordersList = orders;
        if (this.ordersList.length === 0) {
          this.isEmpty = true;
        }
        if (this.prevPage || this.nextPage) {
          $('.navbar-brand').html(`Order List - <em>Page ${this.page + 1}</em>`);
        }
      });
    }
  }
}
