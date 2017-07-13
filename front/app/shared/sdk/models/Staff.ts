/* tslint:disable */

declare var Object: any;
export interface StaffInterface {
  name?: string;
  storeId: any;
  status?: any;
  string3D?: string;
  boltModifierActivate?: boolean;
  created?: Date;
  modified?: Date;
  id?: any;
  store?: any;
}

export class Staff implements StaffInterface {
  name: string;
  storeId: any;
  status: any;
  string3D: string;
  boltModifierActivate: boolean;
  created: Date;
  modified: Date;
  id: any;
  store: any;
  constructor(data?: StaffInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Staff`.
   */
  public static getModelName() {
    return "Staff";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Staff for dynamic purposes.
  **/
  public static factory(data: StaffInterface): Staff{
    return new Staff(data);
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
      name: 'Staff',
      plural: 'Staffs',
      properties: {
        name: {
          name: 'name',
          type: 'string'
        },
        storeId: {
          name: 'storeId',
          type: 'any',
          default: <any>null
        },
        status: {
          name: 'status',
          type: 'any',
          default: <any>null
        },
        string3D: {
          name: 'string3D',
          type: 'string',
          default: `function () {
    return null;
  }`
        },
        boltModifierActivate: {
          name: 'boltModifierActivate',
          type: 'boolean',
          default: true
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
