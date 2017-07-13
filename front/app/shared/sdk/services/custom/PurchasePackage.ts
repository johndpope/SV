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
import { PurchasePackage } from '../../models/PurchasePackage';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `PurchasePackage` model.
 */
@Injectable()
export class PurchasePackageApi extends BaseLoopBackApi {

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
   * Create list PurchasePackage with default data.
   *
   * @param {object} data Request data.
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `PurchasePackage` object.)
   * </em>
   */
  public createDefaultList(ctx: any = {}): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/PurchasePackages/createDefaultList";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Get Categories form PurchasePackage.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `PurchasePackage` object.)
   * </em>
   */
  public getCategories(): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/PurchasePackages/getCategories";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `PurchasePackage`.
   */
  public getModelName() {
    return "PurchasePackage";
  }
}
