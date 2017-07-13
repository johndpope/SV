/* tslint:disable */

declare var Object: any;
export interface AssetInterface {
  name: string;
  description?: string;
  price: number;
  salesToUnlock: number;
  group: string;
  string3D?: string;
  string2D?: string;
  modified?: Date;
  created?: Date;
  id?: any;
}

export class Asset implements AssetInterface {
  name: string;
  description: string;
  price: number;
  salesToUnlock: number;
  group: string;
  string3D: string;
  string2D: string;
  modified: Date;
  created: Date;
  id: any;
  constructor(data?: AssetInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Asset`.
   */
  public static getModelName() {
    return "Asset";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Asset for dynamic purposes.
  **/
  public static factory(data: AssetInterface): Asset{
    return new Asset(data);
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
      name: 'Asset',
      plural: 'Assets',
      properties: {
        name: {
          name: 'name',
          type: 'string'
        },
        description: {
          name: 'description',
          type: 'string'
        },
        price: {
          name: 'price',
          type: 'number'
        },
        salesToUnlock: {
          name: 'salesToUnlock',
          type: 'number'
        },
        group: {
          name: 'group',
          type: 'string'
        },
        string3D: {
          name: 'string3D',
          type: 'string'
        },
        string2D: {
          name: 'string2D',
          type: 'string'
        },
        modified: {
          name: 'modified',
          type: 'Date',
          default: new Date(0)
        },
        created: {
          name: 'created',
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
