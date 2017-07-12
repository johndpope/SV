/* tslint:disable */
import { Injectable, Inject, Optional } from '@angular/core';
import { Http, Response } from '@angular/http';
import { SDKModels } from './SDKModels';
import { BaseLoopBackApi } from '../core/base.service';
import { LoopBackConfig } from '../../lb.config';
import { LoopBackAuth } from '../core/auth.service';
import { LoopBackFilter,  } from '../../models/BaseModels';
import { JSONSearchParams } from '../core/search.params';
import { ErrorHandler } from '../core/error.service';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';
import { Store } from '../../models/Store';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Store` model.
 */
@Injectable()
export class StoreApi extends BaseLoopBackApi {

  constructor(
    @Inject(Http) protected http: Http,
    @Inject(SocketConnection) protected connection: SocketConnection,
    @Inject(SDKModels) protected models: SDKModels,
    @Inject(LoopBackAuth) protected auth: LoopBackAuth,
    @Inject(JSONSearchParams) protected searchParams: JSONSearchParams,
    @Optional() @Inject(ErrorHandler) protected errorHandler: ErrorHandler
  ) {
    super(http,  connection,  models, auth, searchParams, errorHandler);
  }

  /**
   * Find a store instance by id from the data source.
   *
   * @param {string} id Store id
   *
   * @param {string} filter Filter defining fields
   *
   * @param {string} include Include staff or safebox or both
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public findByIdWithInclude(id: any, filter: any = {}, include: any = {}): Observable<Store> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/:id";
    let _routeParams: any = {
      id: id
    };
    let _postBody: any = {};
    let _urlParams: any = {};
    if (filter) _urlParams.filter = filter;
    if (include) _urlParams.include = include;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result.map((instance: Store) => new Store(instance));
  }

  /**
   * Update Store status (after open store).
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - {open_time: (int), open_status: string, closing_time : 0, environment: string, display_closeout : bool}
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public updateStatus(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/updateStatus";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Stock a product from affiliate sites
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - Stock a product from affiliate sites
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public stockProduct(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/stockProduct";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Add Product From MarketPlace / Stockroom
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - Add Product From MarketPlace / Stockroom
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public addProduct(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/addProduct";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Player can remove product from Store to Stockroom or Market place.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - Remove Product From MarketPlace / Stockroom
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public removeProduct(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/removeProduct";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * After generating a key success, Player need to collect this key.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - {storeStatus: open/overtime/closing/closed }
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public collectKey(data: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/collectKey";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * when assign new branch to a cell, it will also assign a staff to that cell.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - 
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public assignBrand(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/assignBrand";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Update generated key status.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - Update generated key status
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public gkeyStatus(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/gkeyStatus";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Update construction status.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - {construction_time: int, construction_status: string}
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public updateConstructionStatus(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/updateConstructionStatus";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Upgrade a cell/stage/ or level.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - 
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public upgrade(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/upgrade";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Initial a store
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - Init store with staff
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public initial(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/initial";
    let _routeParams: any = {};
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Get leaderboard of store.bestScore
   *
   * @param {object} filter 
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public leaderboard(filter: LoopBackFilter = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/leaderboard";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (filter) _urlParams.filter = filter;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Get list product of current user
   *
   * @param {string} filter {"limit": limit , "offset": offset}
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public getListProducts(filter: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/products";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (filter) _urlParams.filter = filter;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Input total Sale, output total stars.
   *
   * @param {string} total_satisfied_customers cell Number
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public tmpFunc(total_satisfied_customers: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/testTotalStar";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (total_satisfied_customers) _urlParams.total_satisfied_customers = total_satisfied_customers;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Input total stars, output total sale.
   *
   * @param {string} totalStars cell Number
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public tmpFunc2(totalStars: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/testTotalStar2";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (totalStars) _urlParams.totalStars = totalStars;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Input total stars, output total sale.
   *
   * @param {object} data Request data.
   *
   * This method does not accept any data. Supply an empty object.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public tmpMigrateStatsCustomers(): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/migrateStatsCustomers";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Update store data
   *
   * @param {string} id PersistedModel id
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - An object of model property name/value pairs
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Store` object.)
   * </em>
   */
  public updateStore(data: any = {}, id: any, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Stores/:id";
    let _routeParams: any = {
      id: id
    };
    let _postBody: any = {
      data: data
    };
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `Store`.
   */
  public getModelName() {
    return "Store";
  }
}
