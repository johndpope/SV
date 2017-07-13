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
import { Asset } from '../../models/Asset';
import { SocketConnection } from '../../sockets/socket.connections';


/**
 * Api services for the `Asset` model.
 */
@Injectable()
export class AssetApi extends BaseLoopBackApi {

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
   * Create default Asset data list
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
   * This usually means the response is a `Asset` object.)
   * </em>
   */
  public createDefaultList(): Observable<any> {
    let _method: string = "POST";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Assets/createDefaultList";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Get and check list Assets included status.
   *
   * @param {string} memberId MemberId is optional, if empty get list base on current logged user.
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Asset` object.)
   * </em>
   */
  public checkList(memberId: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Assets/checkList";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (memberId) _urlParams.memberId = memberId;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * Buy an asset.
   *
   * @param {object} data Request data.
   *
   *  - `data` – `{object}` - {id: "string"}
   *
   *  - `ctx` – `{object}` - Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Asset` object.)
   * </em>
   */
  public buyAsset(data: any, ctx: any = {}): Observable<any> {
    let _method: string = "PUT";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Assets/buy";
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
   * Get total owned assets.
   *
   * @param {string} memberId MemberId is optional, if empty get list base on current logged user.
   *
   * @param {object} ctx Current context.
   *
   * @returns {object} An empty reference that will be
   *   populated with the actual data once the response is returned
   *   from the server.
   *
   * <em>
   * (The remote method definition does not provide any description.
   * This usually means the response is a `Asset` object.)
   * </em>
   */
  public getNetWealth(memberId: any = {}, ctx: any = {}): Observable<any> {
    let _method: string = "GET";
    let _url: string = LoopBackConfig.getPath() + "/" + LoopBackConfig.getApiVersion() +
    "/Assets/netWealth";
    let _routeParams: any = {};
    let _postBody: any = {};
    let _urlParams: any = {};
    if (memberId) _urlParams.memberId = memberId;
    if (ctx) _urlParams.ctx = ctx;
    let result = this.request(_method, _url, _routeParams, _urlParams, _postBody);
    return result;
  }

  /**
   * The name of the model represented by this $resource,
   * i.e. `Asset`.
   */
  public getModelName() {
    return "Asset";
  }
}
