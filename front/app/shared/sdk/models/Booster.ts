/* tslint:disable */

declare var Object: any;
export interface BoosterInterface {
  name: string;
  description?: string;
  category?: any;
  rarity: string;
  boostValue: any;
  price?: number;
  priceUnit?: string;
  restrictUnlock?: any;
  requiredUnlock?: any;
  key?: string;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Booster implements BoosterInterface {
  name: string;
  description: string;
  category: any;
  rarity: string;
  boostValue: any;
  price: number;
  priceUnit: string;
  restrictUnlock: any;
  requiredUnlock: any;
  key: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: BoosterInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Booster`.
   */
  public static getModelName() {
    return "Booster";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Booster for dynamic purposes.
  **/
  public static factory(data: BoosterInterface): Booster{
    return new Booster(data);
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
      name: 'Booster',
      plural: 'Boosters',
      properties: {
        name: {
          name: 'name',
          type: 'string',
          default: `function () {
      return null;
  }`
        },
        description: {
          name: 'description',
          type: 'string',
          default: `function () {
      return null;
  }`
        },
        category: {
          name: 'category',
          type: 'any',
          default: <any>null
        },
        rarity: {
          name: 'rarity',
          type: 'string'
        },
        boostValue: {
          name: 'boostValue',
          type: 'any'
        },
        price: {
          name: 'price',
          type: 'number'
        },
        priceUnit: {
          name: 'priceUnit',
          type: 'string'
        },
        restrictUnlock: {
          name: 'restrictUnlock',
          type: 'any'
        },
        requiredUnlock: {
          name: 'requiredUnlock',
          type: 'any'
        },
        key: {
          name: 'key',
          type: 'string',
          default: ''
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
