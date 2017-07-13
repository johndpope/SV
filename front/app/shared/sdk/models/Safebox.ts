/* tslint:disable */

declare var Object: any;
export interface SafeboxInterface {
  storeId: any;
  cellNumber: number;
  safeTypeChoice: string;
  safeTypeAvailable: string;
  safeTypeNext: string;
  safeTime?: number;
  safeStatus?: string;
  lastUpdate?: Date;
  notified?: number;
  startDate?: Date;
  totalDuration?: number;
  created?: Date;
  modified?: Date;
  id?: any;
  store?: any;
}

export class Safebox implements SafeboxInterface {
  storeId: any;
  cellNumber: number;
  safeTypeChoice: string;
  safeTypeAvailable: string;
  safeTypeNext: string;
  safeTime: number;
  safeStatus: string;
  lastUpdate: Date;
  notified: number;
  startDate: Date;
  totalDuration: number;
  created: Date;
  modified: Date;
  id: any;
  store: any;
  constructor(data?: SafeboxInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Safebox`.
   */
  public static getModelName() {
    return "Safebox";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Safebox for dynamic purposes.
  **/
  public static factory(data: SafeboxInterface): Safebox{
    return new Safebox(data);
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
      name: 'Safebox',
      plural: 'Safeboxes',
      properties: {
        storeId: {
          name: 'storeId',
          type: 'any'
        },
        cellNumber: {
          name: 'cellNumber',
          type: 'number'
        },
        safeTypeChoice: {
          name: 'safeTypeChoice',
          type: 'string',
          default: 'none'
        },
        safeTypeAvailable: {
          name: 'safeTypeAvailable',
          type: 'string',
          default: 'copper'
        },
        safeTypeNext: {
          name: 'safeTypeNext',
          type: 'string',
          default: 'silver'
        },
        safeTime: {
          name: 'safeTime',
          type: 'number'
        },
        safeStatus: {
          name: 'safeStatus',
          type: 'string',
          default: ''
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
        startDate: {
          name: 'startDate',
          type: 'Date'
        },
        totalDuration: {
          name: 'totalDuration',
          type: 'number'
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
        store: {
          name: 'store',
          type: 'any',
          model: ''
        },
      }
    }
  }
}
