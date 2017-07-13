/* tslint:disable */

declare var Object: any;
export interface LeprechaunHistoryInterface {
  spawnPMonth: number;
  moneyPMonth: number;
  moneyPDay: number;
  remainMoneyPMonth: number;
  remainMoneyPDay: number;
  realPaid: number;
  spawnedTotal:any;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class LeprechaunHistory implements LeprechaunHistoryInterface {
  spawnPMonth: number;
  moneyPMonth: number;
  moneyPDay: number;
  remainMoneyPMonth: number;
  remainMoneyPDay: number;
  realPaid: number;
  spawnedTotal:any;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: LeprechaunHistoryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `LeprechaunHistory`.
   */
  public static getModelName() {
    return "LeprechaunHistory";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of LeprechaunHistory for dynamic purposes.
  **/
  public static factory(data: LeprechaunHistoryInterface): LeprechaunHistory{
    return new LeprechaunHistory(data);
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
      name: 'LeprechaunHistory',
      plural: 'LeprechaunHistories',
      properties: {
        spawnPMonth: {
          name: 'spawnPMonth',
          type: 'number',
        },
        moneyPMonth: {
          name: 'moneyPMonth',
          type: 'number',
        },
        moneyPDay: {
          name: 'moneyPDay',
          type: 'number',
        },
        remainMoneyPMonth: {
          name: 'remainMoneyPMonth',
          type: 'number',
        },
        remainMoneyPDay: {
          name: 'remainMoneyPDay',
          type: 'number',
        },
         realPaid: {
          name: 'realPaid',
          type: 'number',
        },
          spawnedTotal: {
          name: 'spawnedTotal',
          type: 'any'
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
