/* tslint:disable */

declare var Object: any;
export interface StockroomInterface {
  brandId: any;
  memberId: any;
  products?: Array<any>;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Stockroom implements StockroomInterface {
  brandId: any;
  memberId: any;
  products: Array<any>;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: StockroomInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Stockroom`.
   */
  public static getModelName() {
    return "Stockroom";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Stockroom for dynamic purposes.
  **/
  public static factory(data: StockroomInterface): Stockroom{
    return new Stockroom(data);
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
      name: 'Stockroom',
      plural: 'Stockrooms',
      properties: {
        brandId: {
          name: 'brandId',
          type: 'any'
        },
        memberId: {
          name: 'memberId',
          type: 'any'
        },
        products: {
          name: 'products',
          type: 'Array&lt;any&gt;',
          default: <any>[]
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
