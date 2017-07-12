/* tslint:disable */

declare var Object: any;
export interface StoreInterface {
  name?: string;
  ownerId: string;
  cells?: any;
  keyGenerationStatus?: any;
  openTime?: number;
  openStatus?: string;
  activeCells?: number;
  closingTime?: number;
  environment?: string;
  displayCloseout?: boolean;
  constructionTime?: number;
  constructionStatus?: string;
  constructionType?: string;
  constructionStartDate?: Date;
  constructionTotalDuration?: number;
  noOfProducts?: number;
  crowd?: number;
  totalOpenTime?: number;
  lastOpen?: Date;
  lastUpdate?: Date;
  notified?: number;
  totalStar?: number;
  statistic?: any;
  bestScore?: any;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Store implements StoreInterface {
  name: string;
  ownerId: string;
  cells: any;
  keyGenerationStatus: any;
  openTime: number;
  openStatus: string;
  activeCells: number;
  closingTime: number;
  environment: string;
  displayCloseout: boolean;
  constructionTime: number;
  constructionStatus: string;
  constructionType: string;
  constructionStartDate: Date;
  constructionTotalDuration: number;
  noOfProducts: number;
  crowd: number;
  totalOpenTime: number;
  lastOpen: Date;
  lastUpdate: Date;
  notified: number;
  totalStar: number;
  statistic: any;
  bestScore: any;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: StoreInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Store`.
   */
  public static getModelName() {
    return "Store";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Store for dynamic purposes.
  **/
  public static factory(data: StoreInterface): Store{
    return new Store(data);
  }  
  /**
  * @method getModelDefinition
  * @author Julien Ledun
  * @license MIT
  * This method returns an object that represents some of the model
  * definitions.
  **/
  public static getModelDefinition() {
    return {
      name: 'Store',
      plural: 'Stores',
      properties: {
        name: {
          name: 'name',
          type: 'string',
          default: `function () {
    return Store.getGeneratedStoreName();
  }`
        },
        ownerId: {
          name: 'ownerId',
          type: 'string'
        },
        cells: {
          name: 'cells',
          type: 'any',
          default: <any>null
        },
        keyGenerationStatus: {
          name: 'keyGenerationStatus',
          type: 'any',
          default: <any>null
        },
        openTime: {
          name: 'openTime',
          type: 'number',
          default: 0
        },
        openStatus: {
          name: 'openStatus',
          type: 'string',
          default: `function () {
    return STORE_STATUS_CLOSED;
  }`
        },
        activeCells: {
          name: 'activeCells',
          type: 'number',
          default: 0
        },
        closingTime: {
          name: 'closingTime',
          type: 'number',
          default: 0
        },
        environment: {
          name: 'environment',
          type: 'string',
          default: `function () {
    return STORE_ENV_DAY;
  }`
        },
        displayCloseout: {
          name: 'displayCloseout',
          type: 'boolean',
          default: true
        },
        constructionTime: {
          name: 'constructionTime',
          type: 'number',
          default: 0
        },
        constructionStatus: {
          name: 'constructionStatus',
          type: 'string',
          default: `function () {
    return null;
  }`
        },
        constructionType: {
          name: 'constructionType',
          type: 'string',
          default: `function () {
    return null;
  }`
        },
        constructionStartDate: {
          name: 'constructionStartDate',
          type: 'Date',
          default: new Date(0)
        },
        constructionTotalDuration: {
          name: 'constructionTotalDuration',
          type: 'number',
          default: 0
        },
        noOfProducts: {
          name: 'noOfProducts',
          type: 'number',
          default: 0
        },
        crowd: {
          name: 'crowd',
          type: 'number',
          default: 0
        },
        totalOpenTime: {
          name: 'totalOpenTime',
          type: 'number'
        },
        lastOpen: {
          name: 'lastOpen',
          type: 'Date',
          default: new Date(0)
        },
        lastUpdate: {
          name: 'lastUpdate',
          type: 'Date'
        },
        notified: {
          name: 'notified',
          type: 'number',
          default: 0
        },
        totalStar: {
          name: 'totalStar',
          type: 'number',
          default: 0
        },
        statistic: {
          name: 'statistic',
          type: 'any',
          default: <any>null
        },
        bestScore: {
          name: 'bestScore',
          type: 'any',
          default: <any>null
        },
        created: {
          name: 'created',
          type: 'Date',
          default: new Date(0)
        },
        modified: {
          name: 'modified',
          type: 'Date',
          default: new Date(0)
        },
        id: {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
      }
    }
  }
}
